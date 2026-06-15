"use client";

import { useMemo } from "react";

import { SegmentedDigitFields } from "@/components/client/segmented-digit-fields";
import {
  BUSINESS_NUMBER_SEGMENT_LENGTHS,
  joinBusinessNumberSegments,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";

type BusinessNumberInputProps = {
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  disabled?: boolean;
};

export function BusinessNumberInput({
  idPrefix,
  value,
  onChange,
  name,
  disabled = false,
}: BusinessNumberInputProps) {
  const segments = useMemo(
    () => splitIntoSegments(value, [...BUSINESS_NUMBER_SEGMENT_LENGTHS]),
    [value],
  );

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <SegmentedDigitFields
        idPrefix={idPrefix}
        segmentLengths={BUSINESS_NUMBER_SEGMENT_LENGTHS}
        values={segments}
        onChange={(nextSegments) => {
          onChange(
            joinBusinessNumberSegments(
              nextSegments[0] ?? "",
              nextSegments[1] ?? "",
              nextSegments[2] ?? "",
            ),
          );
        }}
        disabled={disabled}
      />
    </>
  );
}
