export type CompensationInfoFilterValues = {
  name: string;
};

export const EMPTY_COMPENSATION_INFO_FILTERS: CompensationInfoFilterValues = {
  name: "",
};

export function filterCompensationInfos<T extends { name: string }>(
  items: T[],
  filters: CompensationInfoFilterValues,
): T[] {
  const needle = filters.name.trim().toLowerCase();
  if (!needle) {
    return items;
  }
  return items.filter((row) => row.name.toLowerCase().includes(needle));
}
