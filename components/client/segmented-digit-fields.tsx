"use client";

import { useRef, type KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";
import { splitIntoSegments } from "@/lib/form/segmented-digits";
import { cn } from "@/lib/utils";

type SegmentedDigitFieldsProps = {
  segmentLengths: readonly number[];
  values: string[];
  onChange: (values: string[]) => void;
  idPrefix: string;
  disabled?: boolean;
  separator?: string;
  className?: string;
};

const segmentWidthClass: Record<number, string> = {
  2: "w-10",
  3: "w-14",
  4: "w-16",
  5: "w-20",
  6: "w-[5.5rem]",
  7: "w-[6.25rem]",
};

export function SegmentedDigitFields({
  segmentLengths,
  values,
  onChange,
  idPrefix,
  disabled = false,
  separator = "-",
  className,
}: SegmentedDigitFieldsProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateFromIndex(index: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    const maxLength = segmentLengths[index] ?? 0;
    const nextValues = [...values];

    if (digits.length <= maxLength) {
      nextValues[index] = digits;
      for (let segmentIndex = index + 1; segmentIndex < segmentLengths.length; segmentIndex += 1) {
        nextValues[segmentIndex] = "";
      }
    } else {
      const combined = values.slice(0, index).join("") + digits;
      onChange(splitIntoSegments(combined, [...segmentLengths]));

      const nextFocusIndex = Math.min(index + 1, segmentLengths.length - 1);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    onChange(nextValues);

    if (digits.length === maxLength && index < segmentLengths.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace" || values[index]) {
      return;
    }

    if (index === 0) {
      return;
    }

    event.preventDefault();
    inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(index: number, pastedText: string) {
    const combined = values
      .slice(0, index)
      .join("")
      .concat(pastedText.replace(/\D/g, ""));
    const nextValues = splitIntoSegments(
      combined,
      segmentLengths as number[],
    );
    onChange(nextValues);

    const nextFocusIndex = nextValues.findIndex(
      (segment, segmentIndex) =>
        segment.length < (segmentLengths[segmentIndex] ?? 0),
    );
    const focusIndex =
      nextFocusIndex === -1 ? segmentLengths.length - 1 : nextFocusIndex;
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {segmentLengths.map((length, index) => (
        <div key={`${idPrefix}-${length}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span className="text-sm text-muted-foreground">{separator}</span>
          ) : null}
          <Input
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            id={`${idPrefix}-${index}`}
            value={values[index] ?? ""}
            onChange={(event) => updateFromIndex(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => {
              event.preventDefault();
              handlePaste(index, event.clipboardData.getData("text"));
            }}
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            maxLength={length}
            className={cn(
              "font-mono text-center tabular-nums",
              segmentWidthClass[length] ?? "w-20",
            )}
            aria-label={`${index + 1}번째 구간`}
          />
        </div>
      ))}
    </div>
  );
}
