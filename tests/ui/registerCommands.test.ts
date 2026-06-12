import { beforeEach, describe, expect, it } from "vitest";

import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { createDefaultLeifPluginData, type LeifPluginData } from "@/domain/types/LeifPluginData";
import { getRecordedNotices, resetRecordedNotices } from "../mocks/obsidian";
import { registerCommands } from "@/ui/commands/registerCommands";

class InMemoryPluginDataStore implements PluginDataStore {
  constructor(private data: LeifPluginData = createDefaultLeifPluginData()) {}

  async load(): Promise<LeifPluginData> {
    return this.data;
  }

  async save(data: LeifPluginData): Promise<void> {
    this.data = data;
  }
}

interface RegisteredCommand {
  id: string;
  name: string;
  callback: () => Promise<void>;
}

class FakePlugin {
  commands: RegisteredCommand[] = [];

  addCommand(command: RegisteredCommand): void {
    this.commands.push(command);
  }
}

function getCommand(plugin: FakePlugin, id: string): RegisteredCommand {
  const command = plugin.commands.find((candidate) => candidate.id === id);

  if (!command) {
    throw new Error(`Command "${id}" was not registered.`);
  }

  return command;
}

function getLastNotice(): string | undefined {
  const notices = getRecordedNotices();
  return notices[notices.length - 1];
}

describe("registerCommands", () => {
  beforeEach(() => {
    resetRecordedNotices();
  });

  it("registers the expected POC commands", () => {
    const plugin = new FakePlugin();
    const dataStore = new InMemoryPluginDataStore();

    registerCommands(plugin as never, dataStore);

    expect(plugin.commands.map((command) => command.id)).toEqual([
      "leif-show-active-contest",
      "leif-seed-demo-data",
      "leif-switch-active-contest",
      "leif-show-active-subjects",
      "leif-reorder-active-subjects",
      "leif-toggle-first-subject-active",
      "leif-update-first-subject-config",
      "leif-advance-cycle",
      "leif-show-cycle-snapshot",
      "leif-show-active-contest-wall",
      "leif-show-summary",
      "leif-register-demo-question-session",
      "leif-register-demo-video-session",
      "leif-reset-demo-data"
    ]);
  });

  it("seeds demo data, toggles the active contest, and resets plugin data", async () => {
    const plugin = new FakePlugin();
    const dataStore = new InMemoryPluginDataStore();

    registerCommands(plugin as never, dataStore);

    await getCommand(plugin, "leif-seed-demo-data").callback();
    expect(getLastNotice()).toBe("Leif demo data created.");

    const seededData = await dataStore.load();
    expect(seededData.contests.map((contest) => contest.id)).toEqual([
      "tce-sp-2026",
      "sefaz-sp-2026",
      "trt-2-2026"
    ]);
    expect(seededData.activeContestId).toBe("tce-sp-2026");
    expect(seededData.subjects).toHaveLength(9);
    expect(seededData.studyItems).toHaveLength(18);
    expect(seededData.topics).toHaveLength(18);
    expect(seededData.studySessions).toHaveLength(36);
    expect(seededData.topics.every((topic) => topic.questionNotebook)).toBe(true);

    await getCommand(plugin, "leif-switch-active-contest").callback();
    expect(getLastNotice()).toBe("Active contest switched to: SEFAZ-SP Fiscal 2026");
    expect((await dataStore.load()).activeContestId).toBe("sefaz-sp-2026");

    await getCommand(plugin, "leif-reset-demo-data").callback();
    expect(getLastNotice()).toBe("Leif data reset.");
    await expect(dataStore.load()).resolves.toEqual(createDefaultLeifPluginData());
  });

  it("shows wall and summary information and registers a demo question session", async () => {
    const plugin = new FakePlugin();
    const dataStore = new InMemoryPluginDataStore();

    registerCommands(plugin as never, dataStore);

    await getCommand(plugin, "leif-seed-demo-data").callback();
    await getCommand(plugin, "leif-show-active-contest-wall").callback();
    expect(getLastNotice()).toContain("TCE-SP Auditor 2026: notices 1, exams 1");

    await getCommand(plugin, "leif-register-demo-question-session").callback();
    expect(getLastNotice()).toBe("Demo question session registered for: Português");

    await getCommand(plugin, "leif-show-summary").callback();
    expect(getLastNotice()).toContain("Português: PDF 50, Questions 85, Accuracy 85%");
  });

  it("shows, reorders, toggles and updates active contest subjects, and registers a demo video session", async () => {
    const plugin = new FakePlugin();
    const dataStore = new InMemoryPluginDataStore();

    registerCommands(plugin as never, dataStore);

    await getCommand(plugin, "leif-seed-demo-data").callback();

    await getCommand(plugin, "leif-show-active-subjects").callback();
    expect(getLastNotice()).toContain("1. Português [active] 90m");

    await getCommand(plugin, "leif-reorder-active-subjects").callback();
    expect(getLastNotice()).toBe("Active contest subjects reordered.");

    await getCommand(plugin, "leif-show-active-subjects").callback();
    expect(getLastNotice()).toContain("1. Controle Externo [active] 80m");

    await getCommand(plugin, "leif-toggle-first-subject-active").callback();
    expect(getLastNotice()).toBe("Subject Controle Externo is now inactive.");

    await getCommand(plugin, "leif-update-first-subject-config").callback();
    expect(getLastNotice()).toBe("Subject Controle Externo updated to 95 minutes and stage Review.");

    await getCommand(plugin, "leif-register-demo-video-session").callback();
    expect(getLastNotice()).toBe("Demo video session registered for: Controle Externo");
  });
});
