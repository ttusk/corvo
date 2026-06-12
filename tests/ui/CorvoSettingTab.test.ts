// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { App, Plugin } from "../mocks/obsidian";
import { createDefaultCorvoPluginData } from "@/domain/types/CorvoPluginData";
import { PluginDataStore } from "@/infrastructure/persistence/PluginDataStore";
import { CorvoSettingTab } from "@/ui/settings/CorvoSettingTab";
import { CORVO_VIEW_TYPE, registerCorvoView } from "@/ui/view/registerCorvoView";

describe("CorvoSettingTab", () => {
  it("renders an explicit button to open the Corvo panel", async () => {
    const app = new App();
    const plugin = new Plugin(app);
    const dataStore = new PluginDataStore({
      async load() {
        return createDefaultCorvoPluginData();
      },
      async save() {}
    });

    registerCorvoView(plugin as never, dataStore);

    const settingTab = new CorvoSettingTab(app as never, plugin as never);
    settingTab.display();

    const openButton = settingTab.containerEl.querySelector<HTMLButtonElement>("button");

    expect(settingTab.containerEl.textContent).toContain("Abrir painel do Corvo");
    expect(openButton).not.toBeNull();

    openButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(app.workspace.getLeavesOfType(CORVO_VIEW_TYPE)).toHaveLength(1);
  });
});
