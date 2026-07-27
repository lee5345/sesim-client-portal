"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { SegmentedDigitFields } from "@/components/client/segmented-digit-fields";
import { EMPTY_FIELD_LABEL } from "@/lib/companies/labels";
import { formatBusinessNumber } from "@/lib/format/business-number";
import { formatPhone, parsePhoneInput } from "@/lib/format/phone";
import { formatWorkplaceManagementNumber } from "@/lib/format/workplace-management-number";
import {
  joinRrnSegments,
  RRN_SEGMENT_LENGTHS,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";
import {
  type CompanyProfile,
  type CompanyProfileFieldDef,
} from "@/lib/companies/profile-fields";
import {
  revealCompanyRepresentativeRrn,
  updateCompanyProfileFieldAction,
} from "@/modules/companies/company-profile";
import { BusinessNumberInput } from "@/components/companies/business-number-input";
import { WorkplaceManagementNumberInput } from "@/components/companies/workplace-management-number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const compactTextareaClassName =
  "min-h-8 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm leading-normal outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function resizeCompactTextarea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function createEmptyRrnSegments() {
  return splitIntoSegments("", [...RRN_SEGMENT_LENGTHS]);
}

function getMaskedRepresentativeRrn(profile: CompanyProfile): string | null {
  return profile.maskedRepresentativeRrn;
}

type CompanyProfileFieldRowProps = {
  companyId: string;
  field: CompanyProfileFieldDef;
  profile: CompanyProfile;
  className?: string;
};

type ScalarProfileFieldKey = Exclude<
  CompanyProfileFieldDef["key"],
  "representativeRrn"
>;

function getProfileScalarValue(
  key: ScalarProfileFieldKey,
  profile: CompanyProfile,
) {
  return profile[key];
}

function formatDisplayValue(
  field: CompanyProfileFieldDef,
  profile: CompanyProfile,
): string {
  if (field.key === "representativeRrn") {
    return getMaskedRepresentativeRrn(profile) ?? EMPTY_FIELD_LABEL;
  }

  const value = getProfileScalarValue(field.key, profile);

  if (field.type === "boolean") {
    if (value === true) return "관리 함";
    if (value === false) return "관리 안 함";
    return EMPTY_FIELD_LABEL;
  }

  if (field.type === "password") {
    return value ? "••••••••" : EMPTY_FIELD_LABEL;
  }

  if (field.type === "businessNumber") {
    return formatBusinessNumber(typeof value === "string" ? value : null) ?? EMPTY_FIELD_LABEL;
  }

  if (field.type === "workplaceManagementNumber") {
    return (
      formatWorkplaceManagementNumber(typeof value === "string" ? value : null) ??
      EMPTY_FIELD_LABEL
    );
  }

  if (field.type === "phone") {
    if (typeof value === "string" && value.length > 0) {
      return formatPhone(value);
    }
    return EMPTY_FIELD_LABEL;
  }

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return EMPTY_FIELD_LABEL;
}

function getEditDefaultValue(
  field: CompanyProfileFieldDef,
  profile: CompanyProfile,
): string {
  if (field.key === "representativeRrn") {
    return "";
  }

  const value = getProfileScalarValue(field.key, profile);

  if (field.type === "boolean") {
    if (value === true) return "true";
    if (value === false) return "false";
    return "";
  }

  if (field.type === "businessNumber") {
    return formatBusinessNumber(typeof value === "string" ? value : null) ?? "";
  }

  if (field.type === "workplaceManagementNumber") {
    return (
      formatWorkplaceManagementNumber(typeof value === "string" ? value : null) ?? ""
    );
  }

  if (field.type === "phone") {
    return typeof value === "string" ? value : "";
  }

  return typeof value === "string" ? value : "";
}

export function CompanyProfileFieldRow({
  companyId,
  field,
  profile,
  className,
}: CompanyProfileFieldRowProps) {
  const router = useRouter();
  const hasExistingRrn = Boolean(getMaskedRepresentativeRrn(profile));
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(() =>
    getEditDefaultValue(field, profile),
  );
  const [revealedRrn, setRevealedRrn] = useState<string | null>(null);
  const [rrnSegments, setRrnSegments] = useState(createEmptyRrnSegments);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(getEditDefaultValue(field, profile));
      setRevealedRrn(null);
      setRrnSegments(createEmptyRrnSegments());
    }
  }, [field, profile, isEditing]);

  const displayValue = formatDisplayValue(field, profile);
  const isEmpty = displayValue === EMPTY_FIELD_LABEL;
  const toggleRepresentativeRrnReveal = () => {
    if (revealedRrn) {
      setRevealedRrn(null);
      return;
    }

    startTransition(async () => {
      try {
        const result = await revealCompanyRepresentativeRrn(companyId);
        setRevealedRrn(result.rrn);
      } catch {
        setSaveError("주민등록번호를 불러오지 못했습니다.");
      }
    });
  };

  const representativeRrnDisplayValue =
    revealedRrn ?? getMaskedRepresentativeRrn(profile) ?? "******-*******";

  const startEdit = () => {
    setDraftValue(getEditDefaultValue(field, profile));
    setRevealedRrn(null);
    setRrnSegments(createEmptyRrnSegments());
    setSaveError(null);
    setIsEditing(true);

    if (field.key === "representativeRrn" && hasExistingRrn) {
      startTransition(async () => {
        try {
          const result = await revealCompanyRepresentativeRrn(companyId);
          setRrnSegments(splitIntoSegments(result.rrn, [...RRN_SEGMENT_LENGTHS]));
        } catch {
          setSaveError("주민등록번호를 불러오지 못했습니다.");
        }
      });
    }
  };

  const cancelEdit = () => {
    setDraftValue(getEditDefaultValue(field, profile));
    setRevealedRrn(null);
    setRrnSegments(createEmptyRrnSegments());
    setSaveError(null);
    setIsEditing(false);
  };

  const saveEdit = () => {
    if (field.key === "name" && !draftValue.trim()) {
      return;
    }

    setSaveError(null);
    const formData = new FormData();
    formData.set("companyId", companyId);
    formData.set("field", field.key);

    if (field.type === "rrn") {
      formData.set(
        "value",
        joinRrnSegments(rrnSegments[0] ?? "", rrnSegments[1] ?? ""),
      );
    } else {
      formData.set("value", draftValue);
    }

    startTransition(async () => {
      const result = await updateCompanyProfileFieldAction(formData);
      if (!result.success) {
        setSaveError(result.error);
        return;
      }

      setIsEditing(false);
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/20 px-3 py-2.5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
        {isEditing ? (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelEdit}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveEdit}
              disabled={isPending}
            >
              저장
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            aria-label={`${field.label} 수정`}
            onClick={startEdit}
          >
            <Pencil className="size-4" />
          </Button>
        )}
      </div>

      <div className="mt-1">
        {saveError ? (
          <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {saveError}
          </p>
        ) : null}
        {isEditing ? (
          field.type === "textarea" ? (
            <textarea
              id={`profile-${companyId}-${field.key}`}
              value={draftValue}
              onChange={(event) => {
                setDraftValue(event.target.value);
                if (field.key === "businessAddress") {
                  resizeCompactTextarea(event.target);
                }
              }}
              maxLength={field.maxLength}
              rows={field.key === "businessAddress" ? 1 : 3}
              disabled={isPending}
              ref={(element) => {
                if (field.key === "businessAddress" && element) {
                  resizeCompactTextarea(element);
                }
              }}
              className={
                field.key === "businessAddress"
                  ? compactTextareaClassName
                  : textareaClassName
              }
            />
          ) : field.type === "boolean" ? (
            <select
              id={`profile-${companyId}-${field.key}`}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              disabled={isPending}
              className={selectClassName}
            >
              <option value="">{EMPTY_FIELD_LABEL}</option>
              <option value="true">관리 함</option>
              <option value="false">관리 안 함</option>
            </select>
          ) : field.type === "businessNumber" ? (
            <BusinessNumberInput
              idPrefix={`profile-${companyId}-${field.key}`}
              value={draftValue}
              onChange={setDraftValue}
              disabled={isPending}
            />
          ) : field.type === "workplaceManagementNumber" ? (
            <WorkplaceManagementNumberInput
              idPrefix={`profile-${companyId}-${field.key}`}
              value={draftValue}
              onChange={setDraftValue}
              disabled={isPending}
            />
          ) : field.type === "phone" ? (
            <Input
              id={`profile-${companyId}-${field.key}`}
              type="tel"
              inputMode="numeric"
              value={formatPhone(draftValue)}
              onChange={(event) =>
                setDraftValue(parsePhoneInput(event.target.value))
              }
              disabled={isPending}
              placeholder="010-1234-5678"
            />
          ) : field.type === "rrn" ? (
            <SegmentedDigitFields
              idPrefix={`profile-${companyId}-${field.key}`}
              segmentLengths={RRN_SEGMENT_LENGTHS}
              values={rrnSegments}
              onChange={setRrnSegments}
              disabled={isPending}
            />
          ) : (
            <Input
              id={`profile-${companyId}-${field.key}`}
              type={
                field.type === "password"
                  ? "password"
                  : field.type === "email"
                    ? "email"
                    : "text"
              }
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              maxLength={field.maxLength}
              required={field.key === "name"}
              disabled={isPending}
            />
          )
        ) : field.key === "representativeRrn" && hasExistingRrn ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              {representativeRrnDisplayValue}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={isPending}
              aria-label={revealedRrn ? "주민등록번호 숨기기" : "주민등록번호 보기"}
              onClick={toggleRepresentativeRrnReveal}
            >
              {revealedRrn ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </div>
        ) : (
          <p
            className={cn(
              "text-sm break-words whitespace-pre-wrap",
              (field.type === "businessNumber" ||
                field.type === "workplaceManagementNumber" ||
                field.type === "phone") &&
                "font-mono",
              isEmpty ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {displayValue}
          </p>
        )}
      </div>
    </div>
  );
}
