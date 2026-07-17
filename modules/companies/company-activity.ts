"use server";

import { listHireIntakes } from "@/modules/hire-intakes/actions";
import { listTerminations } from "@/modules/terminations/actions";
import { listDailyWorkers } from "@/modules/daily-workers/actions";
import { listBusinessIncomes } from "@/modules/business-income/actions";
import { listCompensationChanges } from "@/modules/compensation-changes/actions";
import { listCompensationInfos } from "@/modules/compensation-info/actions";
import { listDependentRecords } from "@/modules/dependents/actions";
import { listLeaveRecords } from "@/modules/leave-records/actions";

export async function listCompanyNewHires(companyId: string) {
  return listHireIntakes(companyId);
}

export async function listCompanyTerminations(companyId: string) {
  return listTerminations(companyId);
}

export async function listCompanyDailyWorkers(
  companyId: string,
  year: number,
  month: number,
) {
  return listDailyWorkers(companyId, year, month);
}

export async function listCompanyCompensationChanges(companyId: string) {
  return listCompensationChanges(companyId);
}

export async function listCompanyCompensationInfos(
  companyId: string,
  year: number,
  month: number,
) {
  return listCompensationInfos(companyId, year, month);
}

export async function listCompanyBusinessIncomes(
  companyId: string,
  year: number,
  month: number,
) {
  return listBusinessIncomes(companyId, year, month);
}

export async function listCompanyLeaveRecords(companyId: string) {
  return listLeaveRecords(companyId);
}

export async function listCompanyDependents(companyId: string) {
  return listDependentRecords(companyId);
}
