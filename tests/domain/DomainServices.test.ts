import { describe, expect, it } from "vitest";

import { SubjectService } from "@/domain/services/SubjectService";
import { StudySessionService } from "@/domain/services/StudySessionService";
import { QuestionNotebookService } from "@/domain/services/QuestionNotebookService";

describe("SubjectService", () => {
  const service = new SubjectService();
  const baseSubject = { id: "sub-1", contestId: "c-1", name: "Portuguese", order: 1, isActive: true, plannedStudyMinutes: 60, itemIds: [], topicIds: [] };

  it("adds a study item to a subject", () => {
    const item = { id: "item-1", subjectId: "sub-1", title: "Syntax", order: 1 };
    const result = service.addStudyItem(baseSubject, item);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.itemIds).toContain("item-1");
    }
  });

  it("fails when adding an item that belongs to another subject", () => {
    const item = { id: "item-1", subjectId: "sub-2", title: "Syntax", order: 1 };
    const result = service.addStudyItem(baseSubject, item);

    expect(result.success).toBe(false);
  });

  it("fails when adding a duplicate item", () => {
    const item = { id: "item-1", subjectId: "sub-1", title: "Syntax", order: 1 };
    const subjectWithItem = { ...baseSubject, itemIds: ["item-1"] };
    const result = service.addStudyItem(subjectWithItem, item);

    expect(result.success).toBe(false);
  });

  it("removes a study item from a subject", () => {
    const subjectWithItem = { ...baseSubject, itemIds: ["item-1"] };
    const result = service.removeStudyItem(subjectWithItem, "item-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.itemIds).toHaveLength(0);
    }
  });

  it("fails when removing an item that does not exist", () => {
    const result = service.removeStudyItem(baseSubject, "item-1");
    expect(result.success).toBe(false);
  });

  it("adds a topic to a subject", () => {
    const topic = { id: "topic-1", subjectId: "sub-1", name: "Clauses", order: 1, resourceReferences: [] };
    const result = service.addTopic(baseSubject, topic);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.topicIds).toContain("topic-1");
    }
  });

  it("reorders subjects", () => {
    const subjects = [
      { ...baseSubject, id: "sub-1", order: 1 },
      { ...baseSubject, id: "sub-2", order: 2 },
      { ...baseSubject, id: "sub-3", order: 3 }
    ];
    const result = service.reorderSubjects(subjects, ["sub-3", "sub-1", "sub-2"]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value[0].id).toBe("sub-3");
      expect(result.value[0].order).toBe(1);
      expect(result.value[1].id).toBe("sub-1");
      expect(result.value[1].order).toBe(2);
      expect(result.value[2].id).toBe("sub-2");
      expect(result.value[2].order).toBe(3);
    }
  });

  it("fails reordering when a subject is missing", () => {
    const subjects = [{ ...baseSubject, id: "sub-1", order: 1 }];
    const result = service.reorderSubjects(subjects, ["sub-1", "sub-2"]);

    expect(result.success).toBe(false);
  });
});

describe("StudySessionService", () => {
  const service = new StudySessionService();

  it("validates a correct session", () => {
    const session = {
      id: "s-1", contestId: "c-1", type: "pdf" as const, studiedAt: "2026-06-11",
      subjectId: undefined, studyItemId: undefined, topicId: undefined, pagesOrCount: 10, correctAnswers: undefined, completed: true
    };
    const result = service.validateSession(session);
    expect(result.success).toBe(true);
  });

  it("fails when session type is invalid", () => {
    const session = {
      id: "s-1", contestId: "c-1", type: "invalid" as any, studiedAt: "2026-06-11",
      subjectId: undefined, studyItemId: undefined, topicId: undefined, pagesOrCount: undefined, correctAnswers: undefined, completed: true
    };
    const result = service.validateSession(session);
    expect(result.success).toBe(false);
  });

  it("fails when pagesOrCount is negative", () => {
    const session = {
      id: "s-1", contestId: "c-1", type: "pdf" as const, studiedAt: "2026-06-11",
      subjectId: undefined, studyItemId: undefined, topicId: undefined, pagesOrCount: -1, correctAnswers: undefined, completed: true
    };
    const result = service.validateSession(session);
    expect(result.success).toBe(false);
  });

  it("fails when correctAnswers exceeds pagesOrCount", () => {
    const session = {
      id: "s-1", contestId: "c-1", type: "questions" as const, studiedAt: "2026-06-11",
      subjectId: undefined, studyItemId: undefined, topicId: undefined, pagesOrCount: 10, correctAnswers: 15, completed: true
    };
    const result = service.validateSession(session);
    expect(result.success).toBe(false);
  });

  it("calculates accuracy for a question session", () => {
    const session = {
      id: "s-1", contestId: "c-1", type: "questions" as const, studiedAt: "2026-06-11",
      subjectId: undefined, studyItemId: undefined, topicId: undefined, pagesOrCount: 20, correctAnswers: 16, completed: true
    };
    const accuracy = service.calculateAccuracy(session);
    expect(accuracy).toBe(0.8);
  });

  it("groups question sessions by date", () => {
    const sessions = [
      { id: "s-1", contestId: "c-1", type: "questions" as const, studiedAt: "2026-06-11T10:00:00Z", pagesOrCount: 10, correctAnswers: 8, completed: true },
      { id: "s-2", contestId: "c-1", type: "questions" as const, studiedAt: "2026-06-11T14:00:00Z", pagesOrCount: 5, correctAnswers: 4, completed: true },
      { id: "s-3", contestId: "c-1", type: "pdf" as const, studiedAt: "2026-06-12T10:00:00Z", pagesOrCount: 30, completed: true }
    ];
    const grouped = service.groupQuestionSessionsByDate(sessions);
    expect(grouped.get("2026-06-11")).toEqual({ questionCount: 15, correctAnswers: 12 });
    expect(grouped.get("2026-06-12")).toBeUndefined();
  });
});

describe("QuestionNotebookService", () => {
  const service = new QuestionNotebookService();
  const baseTopic = {
    id: "topic-1", subjectId: "sub-1", name: "Clauses", order: 1, resourceReferences: []
  };

  it("adds session stats to a notebook", () => {
    const topic = {
      ...baseTopic,
      questionNotebook: { id: "nb-1", name: "Tec", url: "https://example.com", solvedQuestions: 10, correctAnswers: 8 }
    };
    const session = {
      id: "s-1", contestId: "c-1", type: "questions" as const, studiedAt: "2026-06-11",
      subjectId: "sub-1", topicId: "topic-1", pagesOrCount: 5, correctAnswers: 4, completed: true
    };
    const result = service.addSessionStats(topic, session);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.questionNotebook?.solvedQuestions).toBe(15);
      expect(result.value.questionNotebook?.correctAnswers).toBe(12);
    }
  });

  it("removes session stats from a notebook", () => {
    const topic = {
      ...baseTopic,
      questionNotebook: { id: "nb-1", name: "Tec", url: "https://example.com", solvedQuestions: 10, correctAnswers: 8 }
    };
    const session = {
      id: "s-1", contestId: "c-1", type: "questions" as const, studiedAt: "2026-06-11",
      subjectId: "sub-1", topicId: "topic-1", pagesOrCount: 5, correctAnswers: 4, completed: true
    };
    const result = service.removeSessionStats(topic, session);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.questionNotebook?.solvedQuestions).toBe(5);
      expect(result.value.questionNotebook?.correctAnswers).toBe(4);
    }
  });

  it("prevents negative stats on removal", () => {
    const topic = {
      ...baseTopic,
      questionNotebook: { id: "nb-1", name: "Tec", url: "https://example.com", solvedQuestions: 3, correctAnswers: 2 }
    };
    const session = {
      id: "s-1", contestId: "c-1", type: "questions" as const, studiedAt: "2026-06-11",
      subjectId: "sub-1", topicId: "topic-1", pagesOrCount: 5, correctAnswers: 4, completed: true
    };
    const result = service.removeSessionStats(topic, session);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.questionNotebook?.solvedQuestions).toBe(0);
      expect(result.value.questionNotebook?.correctAnswers).toBe(0);
    }
  });

  it("calculates accuracy for a notebook", () => {
    const topic = {
      ...baseTopic,
      questionNotebook: { id: "nb-1", name: "Tec", url: "https://example.com", solvedQuestions: 20, correctAnswers: 16 }
    };
    const accuracy = service.calculateAccuracy(topic);
    expect(accuracy).toBe(0.8);
  });

  it("returns null accuracy when no questions solved", () => {
    const topic = {
      ...baseTopic,
      questionNotebook: { id: "nb-1", name: "Tec", url: "https://example.com", solvedQuestions: 0, correctAnswers: 0 }
    };
    const accuracy = service.calculateAccuracy(topic);
    expect(accuracy).toBeNull();
  });

  it("returns null accuracy when topic has no notebook", () => {
    const accuracy = service.calculateAccuracy(baseTopic);
    expect(accuracy).toBeNull();
  });
});