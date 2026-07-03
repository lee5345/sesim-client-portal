"use server";

import { z } from "zod";

import type { HireIntakeFilterValues } from "@/components/hire-intakes/hire-intakes-filters";
import { buildHireIntakesExportBuffer } from "@/lib/export/hire-intakes";
import {
  summarizeHireIntakeFilters,
} from "@/lib/export/filter-summaries";
import { sanitizeExportFilename } from "@/lib/export/sanitize-filename";
import {
  compactFilterSummary,
  toExportBase64,
  type ExcelExportResult,
} from "@/lib/export/types";
import { filterHireIntakes } from "@/lib/filters/hire-intakes";
import {
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import { getCompanyById } from "@/modules/companies/companies";
import { listHireIntakes, revealRRNs } from "@/modules/hire-intakes/actions";

const hireIntakeFiltersSchema = z.object({
  name: z.string(),
  hireDateFrom: z.string(),
  hireDateTo: z.string(),
  departments: z.array(z.string()),
});

const exportInputSchema = z.object({
  title: z.string().trim().min(1, "파일 제목을 입력해 주세요."),
  filters: hireIntakeFiltersSchema,
  companyId: z.string().uuid().optional(),
});

export async function exportHireIntakesExcel(input: {
  title: string;
  filters: HireIntakeFilterValues;
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

    const records = await listHireIntakes(companyId);
    const filtered = filterHireIntakes(records, parsed.filters);

    if (filtered.length === 0) {
      return { success: false, error: "다운로드할 입사자 정보가 없습니다." };
    }

    const { rrnsById } = await revealRRNs(
      filtered.map((record) => record.id),
      companyId,
    );

    const filterItems = summarizeHireIntakeFilters(parsed.filters);
    const buffer = buildHireIntakesExportBuffer({
      title: parsed.title,
      companyName: company.name,
      exportedAt: new Date(),
      filterSummary: compactFilterSummary(filterItems),
      records: filtered.map((record) => ({
        name: record.name,
        employeeNumber: record.employeeNumber,
        rrn: rrnsById[record.id]!,
        hireDate: record.hireDate,
        department: record.department,
        salaryType: record.salaryType,
        salaryBasis: record.salaryBasis,
        salaryAmount: record.salaryAmount,
        isContract: record.isContract,
        contractStart: record.contractStart,
        contractEnd: record.contractEnd,
        nonTaxableAllowances: record.nonTaxableAllowances,
        bankName: record.bankName,
        accountNumber: record.accountNumber,
        email: record.email,
        phone: record.phone,
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
