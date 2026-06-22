"use server";

import { listHireIntakes } from "@/modules/hire-intakes/actions";
import { listTerminations } from "@/modules/terminations/actions";

export async function listCompanyNewHires(companyId: string) {
  return listHireIntakes(companyId);
}

export async function listCompanyTerminations(companyId: string) {
  return listTerminations(companyId);
}
