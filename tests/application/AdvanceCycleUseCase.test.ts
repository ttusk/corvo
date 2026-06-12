import { describe, expect, it } from "vitest";

import type { PersistentStorageAdapter } from "@/application/ports/PersistentStorageAdapter";
import { AdvanceCycleUseCase } from "@/application/use-cases/AdvanceCycleUseCase";
import { CreateContestUseCase } from "@/application/use-cases/CreateContestUseCase";
import { CreateSubjectUseCase } from "@/application/use-cases/CreateSubjectUseCase";
import { SetSubjectActiveStateUseCase } from "@/application/use-cases/SetSubjectActiveStateUseCase";
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

describe("AdvanceCycleUseCase", () => {
  it("persists the next active subject for the active contest and skips inactive subjects", async () => {
    const store = createStore();
    const createContest = new CreateContestUseCase(store);
    const createSubject = new CreateSubjectUseCase(store);
    const setSubjectActiveState = new SetSubjectActiveStateUseCase(store);
    const advanceCycle = new AdvanceCycleUseCase(store);

    await createContest.execute({ id: "contest-1", name: "TRT" });
    await createSubject.execute({
      id: "subject-1",
      contestId: "contest-1",
      name: "Portuguese",
      plannedStudyMinutes: 60
    });
    await createSubject.execute({
      id: "subject-2",
      contestId: "contest-1",
      name: "Constitutional Law",
      plannedStudyMinutes: 45
    });
    await createSubject.execute({
      id: "subject-3",
      contestId: "contest-1",
      name: "Administrative Law",
      plannedStudyMinutes: 30
    });

    await setSubjectActiveState.execute({ subjectId: "subject-2", isActive: false });

    await expect(advanceCycle.execute()).resolves.toMatchObject({ currentSubjectId: "subject-1" });
    await expect(advanceCycle.execute()).resolves.toMatchObject({ currentSubjectId: "subject-3" });
    await expect(advanceCycle.execute()).resolves.toMatchObject({ currentSubjectId: "subject-1" });
  });
});
