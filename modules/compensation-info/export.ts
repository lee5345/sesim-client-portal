"use server";

import { z } from "zod";

import { buildCompensationInfoExportBuffer } from "@/lib/export/compensation-info";
import { summarizeCompensationInfoFilters } from "@/lib/export/filter-summaries";
import { sanitizeExportFilename } from "@/lib/export/sanitize-filename";
import {
  compactFilterSummary,
  toExportBase64,
  type ExcelExportResult,
} from "@/lib/export/types";
import {
  filterCompensationInfos,
  type CompensationInfoFilterValues,
} from "@/lib/filters/compensation-info";
import {
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import { getCompanyById } from "@/modules/companies/companies";
import { listCompensationInfos } from "@/modules/compensation-info/actions";

const compensationInfoFiltersSchema = z.object({
  name: z.string(),
});

const exportInputSchema = z.object({
  title: z.string().trim().min(1, "파일 제목을 입력해 주세요."),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  filters: compensationInfoFiltersSchema,
  companyId: z.string().uuid().optional(),
});

export async function exportCompensationInfosExcel(input: {
  title: string;
  year: number;
  month: number;
  filters: CompensationInfoFilterValues;
  companyId?: string;
}): Promise<ExcelExportResult> {
  try {
    const session = await requireDataEditAuth();
    const parsed = exportInputSchema.parse(input);
    const companyId = resolveCompanyId(session, parsed.companyId);
    const company = await getCompanyById(companyId);

    if (!company) {
      return { success: false, error: "고객사 정보를 찾을 수 없습니다." };
    }

    const records = await listCompensationInfos(
      companyId,
      parsed.year,
      parsed.month,
    );
    const filtered = filterCompensationInfos(records, parsed.filters);

    if (filtered.length === 0) {
      return { success: false, error: "다운로드할 상세급여 정보가 없습니다." };
    }

    const filterItems = summarizeCompensationInfoFilters(
      parsed.year,
      parsed.month,
      parsed.filters,
    );
    const buffer = buildCompensationInfoExportBuffer({
      title: parsed.title,
      companyName: company.name,
      year: parsed.year,
      month: parsed.month,
      exportedAt: new Date(),
      filterSummary: compactFilterSummary(filterItems),
      records: filtered.map((record) => ({
        name: record.name,
        overtimeHours: record.overtimeHours,
        holidayHours: record.holidayHours,
        nightHours: record.nightHours,
        absenceDays: record.absenceDays,
        lateEarlyLeaveHours: record.lateEarlyLeaveHours,
        incentiveAmount: record.incentiveAmount,
        unusedLeaveUnit: record.unusedLeaveUnit,
        unusedLeaveAmount: record.unusedLeaveAmount,
        notes: record.notes,
      })),
    });

    return {
      success: true,
      data: toExportBase64(buffer),
      filename: sanitizeExportFilename(parsed.title),
      rowCount: filtered.length,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "엑셀 다운로드에 실패했습니다.",
    };
  }
}
