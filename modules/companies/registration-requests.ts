"use server";

import crypto from "crypto";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { afterFirmScopeMutation } from "@/modules/realtime/post-mutation";
import { bumpSyncCursors } from "@/modules/realtime/sync";
import { requireAuth } from "@/lib/auth/guards";
import { createPasswordSetupTokenTx } from "@/lib/auth/password-setup";
import { sendPasswordSetupEmail } from "@/lib/auth/email";

const approveSchema = z.object({
  requestId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  newCompanyName: z.string().optional(),
});

export async function approveRegistrationRequestAction(formData: FormData) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  try {
    const parsed = approveSchema.safeParse({
      requestId: formData.get("requestId"),
      companyId: formData.get("companyId") || undefined,
      newCompanyName: formData.get("newCompanyName") || undefined,
    });
    if (!parsed.success) {
      redirect("/firm/client-accounts?approveError=1");
    }

    const input = parsed.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      redirect("/firm/client-accounts?approveError=1&emailError=1");
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.registrationRequest.findUnique({
        where: { id: input.requestId },
        select: {
          id: true,
          status: true,
          email: true,
          name: true,
          companyName: true,
        },
      });

      if (!request || request.status !== "PENDING") {
        return null;
      }

      let companyId = input.companyId;

      const newName = input.newCompanyName?.trim();
      if (!companyId && newName) {
        const company = await tx.company.create({
          data: { name: newName },
          select: { id: true },
        });
        companyId = company.id;
      }

      if (!companyId) {
        throw new Error("companyId or newCompanyName is required");
      }

      const unusable = crypto.randomBytes(32).toString("hex");
      const user = await tx.user.create({
        data: {
          name: request.name,
          email: request.email,
          role: "CLIENT_ADMIN",
          companyId,
          isActive: true,
          mustChangePassword: true,
          passwordHash: unusable,
        },
        select: { id: true },
      });

      const token = await createPasswordSetupTokenTx(tx, user.id);
      const setupUrl = `${appUrl}/setup-password?token=${token}`;

      await tx.registrationRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          companyId,
          reviewedById: session.user.userId,
          reviewedAt: new Date(),
        },
      });

      return { email: request.email, setupUrl, companyId };
    });

    if (!result) {
      redirect("/firm/client-accounts");
    }

    const sent = await sendPasswordSetupEmail(result.email, result.setupUrl);

    await bumpSyncCursors(result.companyId);
    await afterFirmScopeMutation();

    if (!sent.ok) {
      redirect("/firm/client-accounts?approved=1&emailError=1");
    }

    redirect("/firm/client-accounts?approved=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[approveRegistrationRequestAction] Unexpected error", error);
    redirect("/firm/client-accounts?approveError=1");
  }
}

const rejectSchema = z.object({
  requestId: z.string().uuid(),
});

export async function rejectRegistrationRequestAction(formData: FormData) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const input = rejectSchema.parse({
    requestId: formData.get("requestId"),
  });

  await prisma.registrationRequest.update({
    where: { id: input.requestId },
    data: {
      status: "REJECTED",
      reviewedById: session.user.userId,
      reviewedAt: new Date(),
    },
  });

  await afterFirmScopeMutation();
  redirect("/firm/client-accounts");
}

