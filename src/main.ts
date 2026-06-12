import { Plugin } from "obsidian";

import { PluginDataStore } from "@/infrastructure/persistence/PluginDataStore";
import { ObsidianStorageAdapter } from "@/infrastructure/obsidian/ObsidianStorageAdapter";
import { registerCommands } from "@/ui/commands/registerCommands";
import { CorvoSettingTab } from "@/ui/settings/CorvoSettingTab";
import { registerCorvoView } from "@/ui/view/registerCorvoView";

export default class CorvoPlugin extends Plugin {
  private dataStore!: PluginDataStore;

  override async onload(): Promise<void> {
    this.dataStore = new PluginDataStore(new ObsidianStorageAdapter(this));
    await this.dataStore.load();

    registerCorvoView(this, this.dataStore);
    registerCommands(this, this.dataStore);
    this.addSettingTab(new CorvoSettingTab(this.app, this));
  }
}
