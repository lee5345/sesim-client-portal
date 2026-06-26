"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

type FieldLabelProps = {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
};

export function FieldLabel({ htmlFor, required = false, children }: FieldLabelProps) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required ? (
        <span
          className="text-base font-semibold leading-none text-destructive"
          aria-hidden="true"
        >
          *
        </span>
      ) : null}
    </Label>
  );
}
