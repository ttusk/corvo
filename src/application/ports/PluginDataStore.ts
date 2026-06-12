import type { CorvoPluginData } from "@/domain/types/CorvoPluginData";

export interface PluginDataStore {
  load(): Promise<CorvoPluginData>;
  save(data: CorvoPluginData): Promise<void>;
}

