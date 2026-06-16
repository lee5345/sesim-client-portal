"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { paginate } from "@/lib/pagination";

type CrudPaginatedTableProps<T> = {
  items: T[];
  children: (pageItems: T[]) => ReactNode;
};

export function CrudPaginatedTable<T>({
  items,
  children,
}: CrudPaginatedTableProps<T>) {
  const [page, setPage] = useState(1);

  const pagination = useMemo(() => paginate(items, page), [items, page]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  return (
    <div className="overflow-hidden rounded-lg border">
      {children(pagination.items)}
      <DataTablePagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        rangeStart={pagination.rangeStart}
        rangeEnd={pagination.rangeEnd}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
