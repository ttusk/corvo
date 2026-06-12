import { beforeEach, describe, expect, it } from "vitest";

import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { createDefaultCorvoPluginData, type CorvoPluginData } from "@/domain/types/CorvoPluginData";
import { getRecordedNotices, resetRecordedNotices } from "../mocks/obsidian";
import { registerCommands } from "@/ui/commands/registerCommands";

class InMemoryPluginDataStore implements PluginDataStore {
  constructor(private data: CorvoPluginData = createDefaultCorvoPluginData()) {}

  async load(): Promise<CorvoPluginData> {
    return this.data;
  }

  async save(data: CorvoPluginData): Promise<void> {
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
      "corvo-show-active-contest",
      "corvo-seed-demo-data",
      "corvo-switch-active-contest",
      "corvo-show-active-subjects",
      "corvo-reorder-active-subjects",
      "corvo-toggle-first-subject-active",
      "corvo-update-first-subject-config",
      "corvo-advance-cycle",
      "corvo-show-cycle-snapshot",
      "corvo-show-active-contest-wall",
      "corvo-show-summary",
      "corvo-register-demo-question-session",
      "corvo-register-demo-video-session",
      "corvo-reset-demo-data"
    ]);
  });

  it("seeds demo data, toggles the active contest, and resets plugin data", async () => {
    const plugin = new FakePlugin();
    const dataStore = new InMemoryPluginDataStore();

    registerCommands(plugin as never, dataStore);

    await getCommand(plugin, "corvo-seed-demo-data").callback();
    expect(getLastNotice()).toBe("Corvo demo data created.");

    const seededData = await dataStore.load();
    expect(seededData.contests.map((contest) => contest.id)).toEqual(["demo-trt", "demo-sefaz"]);
    expect(seededData.activeContestId).toBe("demo-trt");

    await getCommand(plugin, "corvo-switch-active-contest").callback();
    expect(getLastNotice()).toBe("Active contest switched to: SEFAZ Demo");
    expect((await dataStore.load()).activeContestId).toBe("demo-sefaz");

    await getCommand(plugin, "corvo-reset-demo-data").callback();
    expect(getLastNotice()).toBe("Corvo data reset.");
    await expect(dataStore.load()).resolves.toEqual(createDefaultCorvoPluginData());
  });

  it("shows wall and summary information and registers a demo question session", async () => {
    const plugin = new FakePlugin();
    const dataStore = new InMemoryPluginDataStore();

    registerCommands(plugin as never, dataStore);

    await getCommand(plugin, "corvo-seed-demo-data").callback();
    await getCommand(plugin, "corvo-show-active-contest-wall").callback();
    expect(getLastNotice()).toContain("TRT Demo: notices 1, exams 1");

    await getCommand(plugin, "corvo-register-demo-question-session").callback();
    expect(getLastNotice()).toBe("Demo question session registered for: Portuguese");

    await getCommand(plugin, "corvo-show-summary").callback();
    expect(getLastNotice()).toContain("Portuguese: PDF 25, Questions 10, Accuracy 80%");
  });

  it("shows, reorders, toggles and updates active contest subjects, and registers a demo video session", async () => {
    const plugin = new FakePlugin();
    const dataStore = new InMemoryPluginDataStore();

    registerCommands(plugin as never, dataStore);

    await getCommand(plugin, "corvo-seed-demo-data").callback();

    await getCommand(plugin, "corvo-show-active-subjects").callback();
    expect(getLastNotice()).toContain("1. Portuguese [active] 60m");

    await getCommand(plugin, "corvo-reorder-active-subjects").callback();
    expect(getLastNotice()).toBe("Active contest subjects reordered.");

    await getCommand(plugin, "corvo-show-active-subjects").callback();
    expect(getLastNotice()).toContain("1. Constitutional Law [active] 45m");

    await getCommand(plugin, "corvo-toggle-first-subject-active").callback();
    expect(getLastNotice()).toBe("Subject Constitutional Law is now inactive.");

    await getCommand(plugin, "corvo-update-first-subject-config").callback();
    expect(getLastNotice()).toBe("Subject Constitutional Law updated to 60 minutes and stage Review.");

    await getCommand(plugin, "corvo-register-demo-video-session").callback();
    expect(getLastNotice()).toBe("Demo video session registered for: Constitutional Law");
  });
});
