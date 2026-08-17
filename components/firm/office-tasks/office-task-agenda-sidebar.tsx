"use client";

import { OfficeTaskDueLabel } from "@/components/firm/office-tasks/office-task-due-label";
import type { OfficeTaskAgenda } from "@/lib/office-tasks/agenda";
import { formatTaskCompanyName } from "@/lib/office-tasks/display";
import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";

type OfficeTaskAgendaSidebarProps = {
  agenda: OfficeTaskAgenda;
  onOpenDetails: (task: OfficeTaskTableRow) => void;
};

const AGENDA_SECTIONS: {
  key: keyof OfficeTaskAgenda;
  title: string;
}[] = [
  { key: "today", title: "오늘" },
  { key: "tomorrow", title: "내일" },
  { key: "recentlyAdded", title: "최근 등록" },
];

export function OfficeTaskAgendaSidebar({
  agenda,
  onOpenDetails,
}: OfficeTaskAgendaSidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-4">
        <h3 className="text-sm font-semibold">주요 사항</h3>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="divide-y">
          {AGENDA_SECTIONS.map((section) => {
            const items = agenda[section.key];

            return (
              <section key={section.key} className="space-y-2 px-4 py-3">
                <h4 className="text-xs font-medium text-muted-foreground">
                  {section.title}
                  <span className="ml-1 tabular-nums">{items.length}</span>
                </h4>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">해당 업무가 없습니다.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {items.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg border border-border bg-muted/70 px-2.5 py-2 text-left shadow-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          onClick={() => onOpenDetails(task)}
                        >
                          <p className="truncate text-sm font-medium">{task.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatTaskCompanyName(task.company)}
                            {" · "}
                            <OfficeTaskDueLabel task={task} compact />
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
