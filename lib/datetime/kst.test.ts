import { describe, expect, it } from "vitest";

import {
  formatKstDateKey,
  isOverdueInKst,
  parseKstDueAt,
} from "@/lib/datetime/kst";

describe("parseKstDueAt", () => {
  it("stores date-only deadlines at KST end of day", () => {
    const { dueAt, hasDueTime } = parseKstDueAt({ dueDate: "2026-08-14" });

    expect(hasDueTime).toBe(false);
    expect(dueAt.toISOString()).toBe("2026-08-14T14:59:59.999Z");
  });

  it("stores explicit times in KST", () => {
    const { dueAt, hasDueTime } = parseKstDueAt({
      dueDate: "2026-08-14",
      dueTime: "15:30",
    });

    expect(hasDueTime).toBe(true);
    expect(dueAt.toISOString()).toBe("2026-08-14T06:30:00.000Z");
  });
});

describe("isOverdueInKst", () => {
  it("treats date-only tasks as due through the KST calendar day", () => {
    const dueAt = parseKstDueAt({ dueDate: "2026-08-14" }).dueAt;
    const middayKst = new Date("2026-08-14T03:00:00.000Z");

    expect(isOverdueInKst(dueAt, false, middayKst)).toBe(false);
    expect(
      isOverdueInKst(
        dueAt,
        false,
        new Date("2026-08-14T15:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("compares timed deadlines against the exact instant", () => {
    const dueAt = parseKstDueAt({
      dueDate: "2026-08-14",
      dueTime: "09:00",
    }).dueAt;

    expect(
      isOverdueInKst(dueAt, true, new Date("2026-08-14T00:00:00.000Z")),
    ).toBe(false);
    expect(
      isOverdueInKst(dueAt, true, new Date("2026-08-14T00:00:01.000Z")),
    ).toBe(true);
  });
});

describe("formatKstDateKey", () => {
  it("formats using Asia/Seoul", () => {
    expect(formatKstDateKey(new Date("2026-08-13T17:00:00.000Z"))).toBe(
      "2026-08-14",
    );
  });
});
