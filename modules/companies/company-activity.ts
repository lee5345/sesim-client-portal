"use server";

import { listHireIntakes } from "@/modules/hire-intakes/actions";
import { listTerminations } from "@/modules/terminations/actions";
import { listDailyWorkers } from "@/modules/daily-workers/actions";

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
