"use client";

import { useMemo } from "react";

import { SegmentedDigitFields } from "@/components/client/segmented-digit-fields";
import {
  WORKPLACE_MANAGEMENT_NUMBER_SEGMENT_LENGTHS,
  joinWorkplaceManagementNumberSegments,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";

type WorkplaceManagementNumberInputProps = {
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  disabled?: boolean;
};

export function WorkplaceManagementNumberInput({
  idPrefix,
  value,
  onChange,
  name,
  disabled = false,
}: WorkplaceManagementNumberInputProps) {
  const segments = useMemo(
    () =>
      splitIntoSegments(value, [...WORKPLACE_MANAGEMENT_NUMBER_SEGMENT_LENGTHS]),
    [value],
  );

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <SegmentedDigitFields
        idPrefix={idPrefix}
        segmentLengths={WORKPLACE_MANAGEMENT_NUMBER_SEGMENT_LENGTHS}
        values={segments}
        onChange={(nextSegments) => {
          onChange(
            joinWorkplaceManagementNumberSegments(
              nextSegments[0] ?? "",
              nextSegments[1] ?? "",
              nextSegments[2] ?? "",
              nextSegments[3] ?? "",
            ),
          );
        }}
        disabled={disabled}
      />
    </>
  );
}
