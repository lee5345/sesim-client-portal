"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { afterFirmScopeMutation } from "@/modules/realtime/post-mutation";

const signupRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  companyName: z.string().min(1),
  phone: z.string().optional(),
  note: z.string().optional(),
});

export type SignupRequestResult =
  | { ok: true }
  | { ok: false; error: "EMAIL_ALREADY_REGISTERED" };

export async function createSignupRequestAction(
  formData: FormData,
): Promise<SignupRequestResult> {
  const input = signupRequestSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    companyName: formData.get("companyName"),
    phone: formData.get("phone") || undefined,
    note: formData.get("note") || undefined,
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existingUser) {
    return { ok: false, error: "EMAIL_ALREADY_REGISTERED" };
  }

  const pendingRequest = await prisma.registrationRequest.findFirst({
    where: { email: input.email, status: "PENDING" },
    select: { id: true },
  });
  if (pendingRequest) {
    return { ok: false, error: "EMAIL_ALREADY_REGISTERED" };
  }

  await prisma.registrationRequest.create({
    data: {
      name: input.name,
      email: input.email,
      companyName: input.companyName,
      phone: input.phone,
      note: input.note,
      status: "PENDING",
    },
  });

  await afterFirmScopeMutation();

  return { ok: true as const };
}

