import type { HireIntakeFilterValues } from "@/components/hire-intakes/hire-intakes-filters";
import type { HireIntakeTableRow } from "@/components/hire-intakes/hire-intakes-data-table";

function parseFilterDate(value: string, endOfDay = false) {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export function filterHireIntakes(
  hireIntakes: HireIntakeTableRow[],
  filters: HireIntakeFilterValues,
) {
  const nameQuery = filters.name.trim().toLowerCase();
  const hireDateFrom = parseFilterDate(filters.hireDateFrom);
  const hireDateTo = parseFilterDate(filters.hireDateTo, true);
  const selectedDepartments = new Set(filters.departments);

  return hireIntakes.filter((hireIntake) => {
    if (nameQuery && !hireIntake.name.toLowerCase().includes(nameQuery)) {
      return false;
    }

    if (hireDateFrom && hireIntake.hireDate < hireDateFrom) {
      return false;
    }

    if (hireDateTo && hireIntake.hireDate > hireDateTo) {
      return false;
    }

    if (selectedDepartments.size > 0) {
      const department = hireIntake.department?.trim();
      if (!department || !selectedDepartments.has(department)) {
        return false;
      }
    }

    return true;
  });
}
