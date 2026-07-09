"use server";

import { z } from "zod";

import { buildCompensationChangesExportBuffer } from "@/lib/export/compensation-changes";
import { summarizeCompensationChangeFilters } from "@/lib/export/filter-summaries";
import { sanitizeExportFilename } from "@/lib/export/sanitize-filename";
import {
  compactFilterSummary,
  toExportBase64,
  type ExcelExportResult,
} from "@/lib/export/types";
import {
  filterCompensationChanges,
  type CompensationChangeFilterValues,
} from "@/lib/filters/compensation-changes";
import { formatDate } from "@/lib/format/date";
import {
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import { getCompanyById } from "@/modules/companies/companies";
import { listCompensationChanges } from "@/modules/compensation-changes/actions";

const compensationChangeFiltersSchema = z.object({
  name: z.string(),
  changeDateFrom: z.string(),
  changeDateTo: z.string(),
});

const exportInputSchema = z.object({
  title: z.string().trim().min(1, "파일 제목을 입력해 주세요."),
  filters: compensationChangeFiltersSchema,
  companyId: z.string().uuid().optional(),
});

export async function exportCompensationChangesExcel(input: {
  title: string;
  filters: CompensationChangeFilterValues;
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

    const records = await listCompensationChanges(companyId);
    const filtered = filterCompensationChanges(
      records.map((record) => ({
        ...record,
        changeDate: formatDate(record.changeDate),
      })),
      parsed.filters,
    );

    if (filtered.length === 0) {
      return { success: false, error: "다운로드할 급여변경 정보가 없습니다." };
    }

    const filterItems = summarizeCompensationChangeFilters(parsed.filters);
    const buffer = buildCompensationChangesExportBuffer({
      title: parsed.title,
      companyName: company.name,
      exportedAt: new Date(),
      filterSummary: compactFilterSummary(filterItems),
      records: filtered.map((record) => ({
        name: record.name,
        changeDate: record.changeDate,
        salaryTypeBefore: record.salaryTypeBefore,
        salaryBasisBefore: record.salaryBasisBefore,
        salaryAmountBefore: record.salaryAmountBefore,
        salaryTypeAfter: record.salaryTypeAfter,
        salaryBasisAfter: record.salaryBasisAfter,
        salaryAmountAfter: record.salaryAmountAfter,
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
