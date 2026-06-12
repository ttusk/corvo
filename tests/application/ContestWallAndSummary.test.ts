import { describe, expect, it } from "vitest";

import type { PersistentStorageAdapter } from "@/application/ports/PersistentStorageAdapter";
import { CreateContestUseCase } from "@/application/use-cases/CreateContestUseCase";
import { CreateStudyItemUseCase } from "@/application/use-cases/CreateStudyItemUseCase";
import { CreateSubjectUseCase } from "@/application/use-cases/CreateSubjectUseCase";
import { GetActiveContestProgressDashboardUseCase } from "@/application/use-cases/GetActiveContestProgressDashboardUseCase";
import { GetActiveContestSummaryUseCase } from "@/application/use-cases/GetActiveContestSummaryUseCase";
import { RegisterStudySessionUseCase } from "@/application/use-cases/RegisterStudySessionUseCase";
import { UpdateContestWallUseCase } from "@/application/use-cases/UpdateContestWallUseCase";
import { createDefaultCorvoPluginData, type CorvoPluginData } from "@/domain/types/CorvoPluginData";
import { PluginDataStore } from "@/infrastructure/persistence/PluginDataStore";

class InMemoryStorageAdapter implements PersistentStorageAdapter<CorvoPluginData> {
  private data: CorvoPluginData | null;

  constructor(initialData: CorvoPluginData | null = null) {
    this.data = initialData;
  }

  async load(): Promise<CorvoPluginData | null> {
    return this.data;
  }

  async save(data: CorvoPluginData): Promise<void> {
    this.data = data;
  }
}

function createStore(): PluginDataStore {
  return new PluginDataStore(new InMemoryStorageAdapter(createDefaultCorvoPluginData()));
}

describe("Contest wall and summary", () => {
  it("updates the wall for a contest", async () => {
    const store = createStore();
    const createContest = new CreateContestUseCase(store);
    const updateContestWall = new UpdateContestWallUseCase(store);

    await createContest.execute({ id: "contest-1", name: "TRT" });

    await updateContestWall.execute({
      contestId: "contest-1",
      wall: {
        noticeLinks: [{ id: "notice-1", label: "Edital", url: "https://example.com/edital" }],
        examLinks: [{ id: "exam-1", label: "Prova anterior", url: "https://example.com/prova" }],
        subjectSnapshots: [{ subjectId: "subject-1", weight: 2, score: 10, targetItems: ["item-1"] }],
        notes: "Priorizar português e constitucional."
      }
    });

    const data = await store.load();

    expect(data.contests).toMatchObject([
      {
        id: "contest-1",
        wall: {
          noticeLinks: [{ id: "notice-1", label: "Edital" }],
          examLinks: [{ id: "exam-1", label: "Prova anterior" }],
          notes: "Priorizar português e constitucional."
        }
      }
    ]);
  });

  it("consolidates summary and progress by subject for the active contest", async () => {
    const store = createStore();
    const createContest = new CreateContestUseCase(store);
    const createStudyItem = new CreateStudyItemUseCase(store);
    const createSubject = new CreateSubjectUseCase(store);
    const registerStudySession = new RegisterStudySessionUseCase(store);
    const getSummary = new GetActiveContestSummaryUseCase(store);
    const getProgressDashboard = new GetActiveContestProgressDashboardUseCase(store);

    await createContest.execute({ id: "contest-1", name: "TRT" });
    await createSubject.execute({ id: "subject-1", contestId: "contest-1", name: "Portuguese", plannedStudyMinutes: 60 });
    await createSubject.execute({ id: "subject-2", contestId: "contest-1", name: "Constitutional Law", plannedStudyMinutes: 45 });
    await createStudyItem.execute({ id: "item-1", subjectId: "subject-1", title: "Sintaxe", weight: 2, questionCount: 30 });
    await createStudyItem.execute({ id: "item-2", subjectId: "subject-1", title: "Pontuação", weight: 1, questionCount: 20 });

    await registerStudySession.execute({
      id: "session-1",
      contestId: "contest-1",
      subjectId: "subject-1",
      studyItemId: "item-1",
      type: "pdf",
      studiedAt: "2026-06-11T20:00:00.000Z",
      pagesOrCount: 30,
      completed: true
    });
    await registerStudySession.execute({
      id: "session-2",
      contestId: "contest-1",
      subjectId: "subject-1",
      type: "questions",
      studiedAt: "2026-06-11T21:00:00.000Z",
      pagesOrCount: 20,
      correctAnswers: 16,
      completed: true
    });
    await registerStudySession.execute({
      id: "session-3",
      contestId: "contest-1",
      subjectId: "subject-2",
      type: "questions",
      studiedAt: "2026-06-12T22:00:00.000Z",
      pagesOrCount: 10,
      correctAnswers: 7,
      completed: true
    });

    await expect(getSummary.execute()).resolves.toMatchObject({
      contestId: "contest-1",
      subjectSummaries: [
        {
          subjectId: "subject-1",
          totalSessions: 2,
          pdfProgressCount: 30,
          questionProgressCount: 20,
          questionAccuracy: 0.8
        },
        {
          subjectId: "subject-2",
          totalSessions: 1,
          pdfProgressCount: 0,
          questionProgressCount: 10,
          questionAccuracy: 0.7
        }
      ]
    });
    await expect(getProgressDashboard.execute()).resolves.toMatchObject({
      contestId: "contest-1",
      pdfProgressBySubject: [
        {
          subjectId: "subject-1",
          subjectName: "Portuguese",
          totalProgressCount: 30,
          items: [
            {
              studyItemId: "item-1",
              title: "Sintaxe",
              order: 1,
              progressCount: 30,
              weight: 2,
              questionCount: 30
            },
            {
              studyItemId: "item-2",
              title: "Pontuação",
              order: 2,
              progressCount: 0,
              weight: 1,
              questionCount: 20
            }
          ]
        },
        {
          subjectId: "subject-2",
          subjectName: "Constitutional Law",
          totalProgressCount: 0,
          items: []
        }
      ],
      questionProgressBySubject: [
        {
          subjectId: "subject-1",
          points: [
            {
              date: "2026-06-11",
              questionCount: 20,
              correctAnswers: 16,
              accuracy: 0.8
            }
          ]
        },
        {
          subjectId: "subject-2",
          points: [
            {
              date: "2026-06-12",
              questionCount: 10,
              correctAnswers: 7,
              accuracy: 0.7
            }
          ]
        }
      ]
    });
  });
});
