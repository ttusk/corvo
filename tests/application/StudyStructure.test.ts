import { describe, expect, it } from "vitest";

import type { PersistentStorageAdapter } from "@/application/ports/PersistentStorageAdapter";
import { AdvanceCycleUseCase } from "@/application/use-cases/AdvanceCycleUseCase";
import { AddStudyItemResourceReferenceUseCase } from "@/application/use-cases/AddStudyItemResourceReferenceUseCase";
import { AddTopicResourceReferenceUseCase } from "@/application/use-cases/AddTopicResourceReferenceUseCase";
import { CreateContestUseCase } from "@/application/use-cases/CreateContestUseCase";
import { CreateStudyItemUseCase } from "@/application/use-cases/CreateStudyItemUseCase";
import { CreateSubjectUseCase } from "@/application/use-cases/CreateSubjectUseCase";
import { CreateTopicUseCase } from "@/application/use-cases/CreateTopicUseCase";
import { DeleteStudySessionUseCase } from "@/application/use-cases/DeleteStudySessionUseCase";
import { GetActiveCycleSnapshotUseCase } from "@/application/use-cases/GetActiveCycleSnapshotUseCase";
import { LinkQuestionNotebookUseCase } from "@/application/use-cases/LinkQuestionNotebookUseCase";
import { RegisterStudySessionUseCase } from "@/application/use-cases/RegisterStudySessionUseCase";
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

describe("Study structure", () => {
  it("creates items and topics in order and exposes the active cycle snapshot", async () => {
    const store = createStore();
    const createContest = new CreateContestUseCase(store);
    const createSubject = new CreateSubjectUseCase(store);
    const createStudyItem = new CreateStudyItemUseCase(store);
    const createTopic = new CreateTopicUseCase(store);
    const advanceCycle = new AdvanceCycleUseCase(store);
    const getSnapshot = new GetActiveCycleSnapshotUseCase(store);

    await createContest.execute({ id: "contest-1", name: "TRT" });
    await createSubject.execute({ id: "subject-1", contestId: "contest-1", name: "Portuguese", plannedStudyMinutes: 60 });
    await createStudyItem.execute({ id: "item-1", subjectId: "subject-1", title: "Sintaxe" });
    await createStudyItem.execute({ id: "item-2", subjectId: "subject-1", title: "Pontuação" });
    await createTopic.execute({ id: "topic-1", subjectId: "subject-1", name: "Orações subordinadas" });

    await advanceCycle.execute();

    await expect(getSnapshot.execute()).resolves.toMatchObject({
      currentSubject: { id: "subject-1" },
      nextSubject: { id: "subject-1" },
      currentItemId: "item-1",
      nextItemId: "item-2"
    });
  });

  it("adds resource references to topics and items, links a question notebook, and registers study sessions", async () => {
    const store = createStore();
    const createContest = new CreateContestUseCase(store);
    const createSubject = new CreateSubjectUseCase(store);
    const createStudyItem = new CreateStudyItemUseCase(store);
    const addStudyItemResourceReference = new AddStudyItemResourceReferenceUseCase(store);
    const createTopic = new CreateTopicUseCase(store);
    const addTopicResourceReference = new AddTopicResourceReferenceUseCase(store);
    const linkQuestionNotebook = new LinkQuestionNotebookUseCase(store);
    const registerStudySession = new RegisterStudySessionUseCase(store);

    await createContest.execute({ id: "contest-1", name: "TRT" });
    await createSubject.execute({ id: "subject-1", contestId: "contest-1", name: "Portuguese", plannedStudyMinutes: 60 });
    await createStudyItem.execute({ id: "item-1", subjectId: "subject-1", title: "Sintaxe" });
    await createTopic.execute({ id: "topic-1", subjectId: "subject-1", name: "Orações subordinadas" });

    await addStudyItemResourceReference.execute({
      studyItemId: "item-1",
      resourceReference: {
        id: "resource-item-1",
        title: "Vídeo Aula 01",
        type: "video",
        url: "https://example.com/video-aula-01"
      }
    });
    await addTopicResourceReference.execute({
      topicId: "topic-1",
      resourceReference: {
        id: "resource-1",
        title: "PDF Aula 01",
        type: "pdf",
        url: "https://example.com/pdf-aula-01"
      }
    });
    await linkQuestionNotebook.execute({
      topicId: "topic-1",
      questionNotebook: {
        id: "notebook-1",
        name: "Tec Concursos - Orações",
        url: "https://tec.example.com/notebook-1",
        solvedQuestions: 0,
        correctAnswers: 0
      }
    });
    await registerStudySession.execute({
      id: "session-1",
      contestId: "contest-1",
      subjectId: "subject-1",
      topicId: "topic-1",
      type: "questions",
      studiedAt: "2026-06-11T20:00:00.000Z",
      pagesOrCount: 20,
      correctAnswers: 16,
      completed: true
    });

    const data = await store.load();

    expect(data.topics).toMatchObject([
      {
        id: "topic-1",
        resourceReferences: [
          {
            id: "resource-1",
            title: "PDF Aula 01",
            type: "pdf"
          }
        ],
        questionNotebook: {
          id: "notebook-1",
          name: "Tec Concursos - Orações",
          solvedQuestions: 20,
          correctAnswers: 16
        }
      }
    ]);
    expect(data.studyItems).toMatchObject([
      {
        id: "item-1",
        resourceReferences: [
          {
            id: "resource-item-1",
            title: "Vídeo Aula 01",
            type: "video"
          }
        ]
      }
    ]);
    expect(data.studySessions).toMatchObject([
      {
        id: "session-1",
        type: "questions",
        pagesOrCount: 20,
        correctAnswers: 16
      }
    ]);
  });

  it("removes a question session and reverts notebook stats", async () => {
    const store = createStore();
    const createContest = new CreateContestUseCase(store);
    const createSubject = new CreateSubjectUseCase(store);
    const createTopic = new CreateTopicUseCase(store);
    const linkQuestionNotebook = new LinkQuestionNotebookUseCase(store);
    const registerStudySession = new RegisterStudySessionUseCase(store);
    const deleteStudySession = new DeleteStudySessionUseCase(store);

    await createContest.execute({ id: "contest-1", name: "TRT" });
    await createSubject.execute({ id: "subject-1", contestId: "contest-1", name: "Portuguese", plannedStudyMinutes: 60 });
    await createTopic.execute({ id: "topic-1", subjectId: "subject-1", name: "Orações subordinadas" });
    await linkQuestionNotebook.execute({
      topicId: "topic-1",
      questionNotebook: {
        id: "notebook-1",
        name: "Tec Concursos - Orações",
        url: "https://tec.example.com/notebook-1",
        solvedQuestions: 20,
        correctAnswers: 16
      }
    });
    await registerStudySession.execute({
      id: "session-1",
      contestId: "contest-1",
      subjectId: "subject-1",
      topicId: "topic-1",
      type: "questions",
      studiedAt: "2026-06-11",
      pagesOrCount: 20,
      correctAnswers: 16,
      completed: true
    });

    await deleteStudySession.execute({ sessionId: "session-1" });

    const data = await store.load();
    expect(data.studySessions).toHaveLength(0);
    expect(data.topics.find((topic) => topic.id === "topic-1")?.questionNotebook).toMatchObject({
      solvedQuestions: 20,
      correctAnswers: 16
    });
  });

  it("does not advance the current cycle when a question session is registered", async () => {
    const store = createStore();
    const createContest = new CreateContestUseCase(store);
    const createSubject = new CreateSubjectUseCase(store);
    const advanceCycle = new AdvanceCycleUseCase(store);
    const registerStudySession = new RegisterStudySessionUseCase(store);
    const getSnapshot = new GetActiveCycleSnapshotUseCase(store);

    await createContest.execute({ id: "contest-1", name: "TRT" });
    await createSubject.execute({ id: "subject-1", contestId: "contest-1", name: "Portuguese", plannedStudyMinutes: 60 });
    await createSubject.execute({ id: "subject-2", contestId: "contest-1", name: "Constitutional Law", plannedStudyMinutes: 45 });

    await advanceCycle.execute();
    await registerStudySession.execute({
      id: "session-2",
      contestId: "contest-1",
      subjectId: "subject-1",
      type: "questions",
      studiedAt: "2026-06-11T21:00:00.000Z",
      pagesOrCount: 10,
      correctAnswers: 8,
      completed: true
    });

    await expect(getSnapshot.execute()).resolves.toMatchObject({
      currentSubject: { id: "subject-1" },
      nextSubject: { id: "subject-2" }
    });
  });
});
