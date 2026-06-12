import { describe, expect, it } from "vitest";

import { CycleService } from "@/domain/services/CycleService";
import type { Subject } from "@/domain/entities/Subject";

const buildSubject = (overrides: Partial<Subject>): Subject => ({
  id: "subject-1",
  contestId: "contest-1",
  name: "Portuguese",
  order: 1,
  isActive: true,
  plannedStudyMinutes: 60,
  currentStage: "PDF",
  itemIds: [],
  topicIds: [],
  ...overrides
});

describe("CycleService", () => {
  it("returns the next active subject and wraps to the first active subject", () => {
    const service = new CycleService();
    const subjects = [
      buildSubject({ id: "subject-1", order: 1, isActive: true }),
      buildSubject({ id: "subject-2", order: 2, isActive: false }),
      buildSubject({ id: "subject-3", order: 3, isActive: true })
    ];

    expect(service.getNextActiveSubject(subjects, "subject-1")?.id).toBe("subject-3");
    expect(service.getNextActiveSubject(subjects, "subject-3")?.id).toBe("subject-1");
  });
});

