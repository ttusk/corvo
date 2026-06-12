import type { Plugin } from "obsidian";
import { Notice } from "obsidian";

import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { AdvanceCycleUseCase } from "@/application/use-cases/AdvanceCycleUseCase";
import { CreateContestUseCase } from "@/application/use-cases/CreateContestUseCase";
import { CreateStudyItemUseCase } from "@/application/use-cases/CreateStudyItemUseCase";
import { CreateSubjectUseCase } from "@/application/use-cases/CreateSubjectUseCase";
import { CreateTopicUseCase } from "@/application/use-cases/CreateTopicUseCase";
import { GetActiveContestSummaryUseCase } from "@/application/use-cases/GetActiveContestSummaryUseCase";
import { GetActiveCycleSnapshotUseCase } from "@/application/use-cases/GetActiveCycleSnapshotUseCase";
import { ListSubjectsForActiveContestUseCase } from "@/application/use-cases/ListSubjectsForActiveContestUseCase";
import { ReorderSubjectsUseCase } from "@/application/use-cases/ReorderSubjectsUseCase";
import { RegisterStudySessionUseCase } from "@/application/use-cases/RegisterStudySessionUseCase";
import { SetSubjectActiveStateUseCase } from "@/application/use-cases/SetSubjectActiveStateUseCase";
import { SetActiveContestUseCase } from "@/application/use-cases/SetActiveContestUseCase";
import { UpdateContestWallUseCase } from "@/application/use-cases/UpdateContestWallUseCase";
import { UpdateSubjectConfigurationUseCase } from "@/application/use-cases/UpdateSubjectConfigurationUseCase";
import { createDefaultCorvoPluginData } from "@/domain/types/CorvoPluginData";

export function registerCommands(plugin: Plugin, dataStore: PluginDataStore): void {
  const createContest = new CreateContestUseCase(dataStore);
  const createSubject = new CreateSubjectUseCase(dataStore);
  const createStudyItem = new CreateStudyItemUseCase(dataStore);
  const createTopic = new CreateTopicUseCase(dataStore);
  const updateContestWall = new UpdateContestWallUseCase(dataStore);
  const registerStudySession = new RegisterStudySessionUseCase(dataStore);
  const setActiveContest = new SetActiveContestUseCase(dataStore);
  const advanceCycle = new AdvanceCycleUseCase(dataStore);
  const getActiveCycleSnapshot = new GetActiveCycleSnapshotUseCase(dataStore);
  const getActiveContestSummary = new GetActiveContestSummaryUseCase(dataStore);
  const listSubjectsForActiveContest = new ListSubjectsForActiveContestUseCase(dataStore);
  const reorderSubjects = new ReorderSubjectsUseCase(dataStore);
  const setSubjectActiveState = new SetSubjectActiveStateUseCase(dataStore);
  const updateSubjectConfiguration = new UpdateSubjectConfigurationUseCase(dataStore);

  plugin.addCommand({
    id: "corvo-show-active-contest",
    name: "Show active contest",
    callback: async () => {
      const data = await dataStore.load();
      const activeContest = data.contests.find((contest) => contest.id === data.activeContestId);

      new Notice(activeContest ? `Active contest: ${activeContest.name}` : "No active contest configured.");
    }
  });

  plugin.addCommand({
    id: "corvo-seed-demo-data",
    name: "Seed demo data",
    callback: async () => {
      const data = await dataStore.load();

      if (data.contests.length > 0) {
        new Notice("Corvo already has data. Demo seed skipped.");
        return;
      }

      await createContest.execute({ id: "demo-trt", name: "TRT Demo" });
      await createContest.execute({ id: "demo-sefaz", name: "SEFAZ Demo" });
      await createSubject.execute({
        id: "subject-portuguese",
        contestId: "demo-trt",
        name: "Portuguese",
        plannedStudyMinutes: 60
      });
      await createSubject.execute({
        id: "subject-constitutional-law",
        contestId: "demo-trt",
        name: "Constitutional Law",
        plannedStudyMinutes: 45
      });
      await createSubject.execute({
        id: "subject-tax-law",
        contestId: "demo-sefaz",
        name: "Tax Law",
        plannedStudyMinutes: 50
      });
      await createStudyItem.execute({
        id: "item-portuguese-1",
        subjectId: "subject-portuguese",
        title: "Sintaxe"
      });
      await createStudyItem.execute({
        id: "item-portuguese-2",
        subjectId: "subject-portuguese",
        title: "Pontuação"
      });
      await createTopic.execute({
        id: "topic-portuguese-1",
        subjectId: "subject-portuguese",
        name: "Orações subordinadas"
      });
      await updateContestWall.execute({
        contestId: "demo-trt",
        wall: {
          noticeLinks: [{ id: "notice-demo", label: "Edital", url: "https://example.com/edital" }],
          examLinks: [{ id: "exam-demo", label: "Prova anterior", url: "https://example.com/prova" }],
          subjectSnapshots: [{ subjectId: "subject-portuguese", weight: 2, score: 10 }],
          notes: "Dados de demonstração do Corvo."
        }
      });
      await updateContestWall.execute({
        contestId: "demo-sefaz",
        wall: {
          noticeLinks: [{ id: "notice-sefaz", label: "Edital", url: "https://example.com/sefaz-edital" }],
          examLinks: [],
          subjectSnapshots: [{ subjectId: "subject-tax-law", weight: 3, score: 15 }],
          notes: "Foco em legislação tributária."
        }
      });
      await registerStudySession.execute({
        id: "session-demo-1",
        contestId: "demo-trt",
        subjectId: "subject-portuguese",
        topicId: "topic-portuguese-1",
        type: "pdf",
        studiedAt: new Date().toISOString(),
        pagesOrCount: 25,
        completed: true
      });
      await registerStudySession.execute({
        id: "session-demo-2",
        contestId: "demo-sefaz",
        subjectId: "subject-tax-law",
        type: "questions",
        studiedAt: new Date().toISOString(),
        pagesOrCount: 10,
        correctAnswers: 8,
        completed: true
      });

      new Notice("Corvo demo data created.");
    }
  });

  plugin.addCommand({
    id: "corvo-switch-active-contest",
    name: "Switch active contest",
    callback: async () => {
      const data = await dataStore.load();

      if (data.contests.length < 2) {
        new Notice("At least two contests are required to switch the active contest.");
        return;
      }

      const currentIndex = data.contests.findIndex((contest) => contest.id === data.activeContestId);
      const nextContest = data.contests[(currentIndex + 1 + data.contests.length) % data.contests.length];

      await setActiveContest.execute({ contestId: nextContest.id });
      new Notice(`Active contest switched to: ${nextContest.name}`);
    }
  });

  plugin.addCommand({
    id: "corvo-show-active-subjects",
    name: "Show active contest subjects",
    callback: async () => {
      const subjects = await listSubjectsForActiveContest.execute();

      if (subjects.length === 0) {
        new Notice("No subjects found for the active contest.");
        return;
      }

      new Notice(
        subjects
          .map((subject) => {
            const stage = subject.currentStage ?? "no stage";
            const state = subject.isActive ? "active" : "inactive";
            return `${subject.order}. ${subject.name} [${state}] ${subject.plannedStudyMinutes}m (${stage})`;
          })
          .join(" | ")
      );
    }
  });

  plugin.addCommand({
    id: "corvo-reorder-active-subjects",
    name: "Reorder active contest subjects",
    callback: async () => {
      const data = await dataStore.load();
      const subjects = await listSubjectsForActiveContest.execute();

      if (!data.activeContestId || subjects.length < 2) {
        new Notice("At least two subjects are required to reorder the active contest.");
        return;
      }

      await reorderSubjects.execute({
        contestId: data.activeContestId,
        subjectIdsInOrder: subjects.map((subject) => subject.id).reverse()
      });

      new Notice("Active contest subjects reordered.");
    }
  });

  plugin.addCommand({
    id: "corvo-toggle-first-subject-active",
    name: "Toggle first subject active state",
    callback: async () => {
      const subjects = await listSubjectsForActiveContest.execute();
      const subject = subjects[0];

      if (!subject) {
        new Notice("No subject found for the active contest.");
        return;
      }

      const updatedSubject = await setSubjectActiveState.execute({
        subjectId: subject.id,
        isActive: !subject.isActive
      });

      new Notice(`Subject ${updatedSubject.name} is now ${updatedSubject.isActive ? "active" : "inactive"}.`);
    }
  });

  plugin.addCommand({
    id: "corvo-update-first-subject-config",
    name: "Update first subject configuration",
    callback: async () => {
      const subjects = await listSubjectsForActiveContest.execute();
      const subject = subjects[0];

      if (!subject) {
        new Notice("No subject found for the active contest.");
        return;
      }

      const updatedSubject = await updateSubjectConfiguration.execute({
        subjectId: subject.id,
        plannedStudyMinutes: subject.plannedStudyMinutes + 15,
        currentStage: "Review"
      });

      new Notice(
        `Subject ${updatedSubject.name} updated to ${updatedSubject.plannedStudyMinutes} minutes and stage ${updatedSubject.currentStage}.`
      );
    }
  });

  plugin.addCommand({
    id: "corvo-advance-cycle",
    name: "Advance cycle",
    callback: async () => {
      try {
        const state = await advanceCycle.execute();
        new Notice(`Current subject: ${state.currentSubjectId ?? "none"}`);
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Could not advance cycle.");
      }
    }
  });

  plugin.addCommand({
    id: "corvo-show-cycle-snapshot",
    name: "Show cycle snapshot",
    callback: async () => {
      try {
        const snapshot = await getActiveCycleSnapshot.execute();
        const data = await dataStore.load();
        const itemMap = new Map(data.studyItems.map((item) => [item.id, item.title]));
        const currentLabel = snapshot.currentSubject?.name ?? "none";
        const nextLabel = snapshot.nextSubject?.name ?? "none";
        const currentItemLabel = snapshot.currentItemId ? itemMap.get(snapshot.currentItemId) ?? snapshot.currentItemId : "none";
        const nextItemLabel = snapshot.nextItemId ? itemMap.get(snapshot.nextItemId) ?? snapshot.nextItemId : "none";

        new Notice(
          `Current: ${currentLabel} | Next: ${nextLabel} | Current item: ${currentItemLabel} | Next item: ${nextItemLabel}`
        );
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Could not read cycle snapshot.");
      }
    }
  });

  plugin.addCommand({
    id: "corvo-show-active-contest-wall",
    name: "Show active contest wall",
    callback: async () => {
      const data = await dataStore.load();
      const activeContest = data.contests.find((contest) => contest.id === data.activeContestId);

      if (!activeContest) {
        new Notice("No active contest configured.");
        return;
      }

      new Notice(
        `${activeContest.name}: notices ${activeContest.wall.noticeLinks.length}, exams ${activeContest.wall.examLinks.length}, notes ${activeContest.wall.notes ?? "none"}`
      );
    }
  });

  plugin.addCommand({
    id: "corvo-show-summary",
    name: "Show active contest summary",
    callback: async () => {
      try {
        const summary = await getActiveContestSummary.execute();

        if (summary.subjectSummaries.length === 0) {
          new Notice("No subject summary available for the active contest.");
          return;
        }

        const message = summary.subjectSummaries
          .map((subjectSummary) => {
            const accuracy =
              subjectSummary.questionAccuracy === null
                ? "n/a"
                : `${Math.round(subjectSummary.questionAccuracy * 100)}%`;

            return `${subjectSummary.subjectName}: PDF ${subjectSummary.pdfProgressCount}, Questions ${subjectSummary.questionProgressCount}, Accuracy ${accuracy}`;
          })
          .join(" | ");

        new Notice(message);
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Could not load active contest summary.");
      }
    }
  });

  plugin.addCommand({
    id: "corvo-register-demo-question-session",
    name: "Register demo question session",
    callback: async () => {
      const data = await dataStore.load();

      if (!data.activeContestId) {
        new Notice("No active contest configured.");
        return;
      }

      const contestState = data.contestStates.find((state) => state.contestId === data.activeContestId);
      const activeSubject =
        data.subjects.find((subject) => subject.id === contestState?.currentSubjectId) ??
        data.subjects.find((subject) => subject.contestId === data.activeContestId);

      if (!activeSubject) {
        new Notice("No subject available for the active contest.");
        return;
      }

      const topic = data.topics.find((candidate) => candidate.subjectId === activeSubject.id);

      await registerStudySession.execute({
        id: `session-demo-${Date.now()}`,
        contestId: data.activeContestId,
        subjectId: activeSubject.id,
        topicId: topic?.id,
        type: "questions",
        studiedAt: new Date().toISOString(),
        pagesOrCount: 10,
        correctAnswers: 8,
        completed: true
      });

      new Notice(`Demo question session registered for: ${activeSubject.name}`);
    }
  });

  plugin.addCommand({
    id: "corvo-register-demo-video-session",
    name: "Register demo video session",
    callback: async () => {
      const data = await dataStore.load();

      if (!data.activeContestId) {
        new Notice("No active contest configured.");
        return;
      }

      const activeSubject = (await listSubjectsForActiveContest.execute())[0];

      if (!activeSubject) {
        new Notice("No subject available for the active contest.");
        return;
      }

      await registerStudySession.execute({
        id: `session-video-${Date.now()}`,
        contestId: data.activeContestId,
        subjectId: activeSubject.id,
        type: "video",
        studiedAt: new Date().toISOString(),
        pagesOrCount: 1,
        completed: true
      });

      new Notice(`Demo video session registered for: ${activeSubject.name}`);
    }
  });

  plugin.addCommand({
    id: "corvo-reset-demo-data",
    name: "Reset plugin data",
    callback: async () => {
      await dataStore.save(createDefaultCorvoPluginData());
      new Notice("Corvo data reset.");
    }
  });
}
