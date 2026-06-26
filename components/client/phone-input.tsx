"use client";

import { useState } from "react";

import { formatPhone, parsePhoneInput } from "@/lib/format/phone";
import { Input } from "@/components/ui/input";

type PhoneInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
};

export function PhoneInput({
  id,
  name,
  defaultValue = "",
  required,
}: PhoneInputProps) {
  const [value, setValue] = useState(() => parsePhoneInput(defaultValue));

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Input
        id={id}
        type="tel"
        value={formatPhone(value)}
        onChange={(event) => setValue(parsePhoneInput(event.target.value))}
        required={required}
      />
    </>
  );
}
