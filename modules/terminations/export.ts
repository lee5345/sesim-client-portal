"use server";

import { z } from "zod";

import {
  summarizeTerminationFilters,
} from "@/lib/export/filter-summaries";
import { buildTerminationsExportBuffer } from "@/lib/export/terminations";
import { sanitizeExportFilename } from "@/lib/export/sanitize-filename";
import {
  compactFilterSummary,
  toExportBase64,
  type ExcelExportResult,
} from "@/lib/export/types";
import { filterTerminations } from "@/lib/filters/terminations";
import type { TerminationFilterValues } from "@/lib/filters/terminations";
import {
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import { getCompanyById } from "@/modules/companies/companies";
import {
  listTerminations,
  revealTerminationRRNs,
} from "@/modules/terminations/actions";

const terminationFiltersSchema = z.object({
  name: z.string(),
  terminationDateFrom: z.string(),
  terminationDateTo: z.string(),
  retirementPayTypes: z.array(
    z.enum(["NOT_APPLICABLE", "SEVERANCE_PAY", "SEVERANCE_PENSION"]),
  ),
});

const exportInputSchema = z.object({
  title: z.string().trim().min(1, "파일 제목을 입력해 주세요."),
  filters: terminationFiltersSchema,
  companyId: z.string().uuid().optional(),
});

export async function exportTerminationsExcel(input: {
  title: string;
  filters: TerminationFilterValues;
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

    const records = await listTerminations(companyId);
    const filtered = filterTerminations(records, parsed.filters);

    if (filtered.length === 0) {
      return { success: false, error: "다운로드할 퇴사자 정보가 없습니다." };
    }

    const { rrnsById } = await revealTerminationRRNs(
      filtered.map((record) => record.id),
      companyId,
    );

    const filterItems = summarizeTerminationFilters(parsed.filters);
    const buffer = buildTerminationsExportBuffer({
      title: parsed.title,
      companyName: company.name,
      exportedAt: new Date(),
      filterSummary: compactFilterSummary(filterItems),
      records: filtered.map((record) => ({
        name: record.name,
        rrn: rrnsById[record.id]!,
        hireDate: record.hireDate,
        terminationDate: record.terminationDate,
        reason: record.reason,
        retirementPayType: record.retirementPayType,
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
