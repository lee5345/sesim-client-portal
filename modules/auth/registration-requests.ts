"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/db";

const signupRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  companyName: z.string().min(1),
  phone: z.string().optional(),
  note: z.string().optional(),
});

export async function createSignupRequestAction(formData: FormData) {
  const input = signupRequestSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    companyName: formData.get("companyName"),
    phone: formData.get("phone") || undefined,
    note: formData.get("note") || undefined,
  });

  const existing = await prisma.registrationRequest.findFirst({
    where: { email: input.email, status: "PENDING" },
    select: { id: true },
  });
  if (existing) {
    return { ok: true as const };
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

  return { ok: true as const };
}

