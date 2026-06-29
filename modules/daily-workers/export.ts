"use server";

import { z } from "zod";

import {
  summarizeDailyWorkerFilters,
} from "@/lib/export/filter-summaries";
import { buildDailyWorkersExportBuffer } from "@/lib/export/daily-workers";
import { sanitizeExportFilename } from "@/lib/export/sanitize-filename";
import {
  compactFilterSummary,
  toExportBase64,
  type ExcelExportResult,
} from "@/lib/export/types";
import { filterDailyWorkers } from "@/lib/filters/daily-workers";
import type { DailyWorkerFilterValues } from "@/lib/filters/daily-workers";
import {
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import { getCompanyById } from "@/modules/companies/companies";
import {
  listDailyWorkers,
  revealDailyWorkerRRNs,
} from "@/modules/daily-workers/actions";

const dailyWorkerFiltersSchema = z.object({
  name: z.string(),
  occupations: z.array(
    z.enum([
      "MEDICAL_DOCTOR",
      "VETERINARIAN",
      "PHARMACIST",
      "NURSE",
      "NUTRITIONIST",
      "MEDICAL_TECHNICIAN",
      "HEALTHCARE_WORKER",
    ]),
  ),
  salaryBasis: z.union([z.literal(""), z.enum(["GROSS", "NET"])]),
});

const exportInputSchema = z.object({
  title: z.string().trim().min(1, "파일 제목을 입력해 주세요."),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  filters: dailyWorkerFiltersSchema,
  companyId: z.string().uuid().optional(),
});

export async function exportDailyWorkersExcel(input: {
  title: string;
  year: number;
  month: number;
  filters: DailyWorkerFilterValues;
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

    const records = await listDailyWorkers(
      companyId,
      parsed.year,
      parsed.month,
    );
    const filtered = filterDailyWorkers(records, parsed.filters);

    if (filtered.length === 0) {
      return { success: false, error: "다운로드할 일용직 정보가 없습니다." };
    }

    const { rrnsById } = await revealDailyWorkerRRNs(
      filtered.map((record) => record.id),
      companyId,
    );

    const filterItems = summarizeDailyWorkerFilters(
      parsed.year,
      parsed.month,
      parsed.filters,
    );
    const buffer = buildDailyWorkersExportBuffer({
      title: parsed.title,
      companyName: company.name,
      year: parsed.year,
      month: parsed.month,
      exportedAt: new Date(),
      filterSummary: compactFilterSummary(filterItems),
      records: filtered.map((record) => ({
        name: record.name,
        rrn: rrnsById[record.id]!,
        occupation: record.occupation,
        occupationCode: record.occupationCode,
        hours: record.hours,
        daysWorked: record.daysWorked,
        avgHoursPerDay: record.avgHoursPerDay,
        salaryBasis: record.salaryBasis,
        totalWage: record.totalWage,
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
