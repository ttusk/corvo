import type { Plugin } from "obsidian";

import type { PersistentStorageAdapter } from "@/application/ports/PersistentStorageAdapter";
import type { CorvoPluginData } from "@/domain/types/CorvoPluginData";

export class ObsidianStorageAdapter implements PersistentStorageAdapter<CorvoPluginData> {
  constructor(private readonly plugin: Plugin) {}

  async load(): Promise<CorvoPluginData | null> {
    return (await this.plugin.loadData()) as CorvoPluginData | null;
  }

  async save(data: CorvoPluginData): Promise<void> {
    await this.plugin.saveData(data);
  }
}

