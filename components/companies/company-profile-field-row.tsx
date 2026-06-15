"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { EMPTY_FIELD_LABEL } from "@/lib/companies/labels";
import { formatBusinessNumber } from "@/lib/format/business-number";
import {
  type CompanyProfile,
  type CompanyProfileFieldDef,
} from "@/lib/companies/profile-fields";
import { updateCompanyProfileFieldAction } from "@/modules/companies/company-profile";
import { BusinessNumberInput } from "@/components/companies/business-number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CompanyProfileFieldRowProps = {
  companyId: string;
  field: CompanyProfileFieldDef;
  profile: CompanyProfile;
  className?: string;
};

function formatDisplayValue(
  field: CompanyProfileFieldDef,
  profile: CompanyProfile,
): string {
  const value = profile[field.key];

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

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return EMPTY_FIELD_LABEL;
}

function getEditDefaultValue(
  field: CompanyProfileFieldDef,
  profile: CompanyProfile,
): string {
  const value = profile[field.key];

  if (field.type === "boolean") {
    if (value === true) return "true";
    if (value === false) return "false";
    return "";
  }

  if (field.type === "businessNumber") {
    return formatBusinessNumber(typeof value === "string" ? value : null) ?? "";
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
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(() =>
    getEditDefaultValue(field, profile),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(getEditDefaultValue(field, profile));
    }
  }, [field, profile, isEditing]);

  const displayValue = formatDisplayValue(field, profile);
  const isEmpty = displayValue === EMPTY_FIELD_LABEL;

  const startEdit = () => {
    setDraftValue(getEditDefaultValue(field, profile));
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftValue(getEditDefaultValue(field, profile));
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
    formData.set("value", draftValue);

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
              onChange={(event) => setDraftValue(event.target.value)}
              maxLength={field.maxLength}
              rows={3}
              disabled={isPending}
              className={textareaClassName}
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
        ) : (
          <p
            className={cn(
              "text-sm break-words whitespace-pre-wrap",
              field.type === "businessNumber" && "font-mono",
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
