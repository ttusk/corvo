import type { PluginDataStore as PluginDataStorePort } from "@/application/ports/PluginDataStore";
import type { PersistentStorageAdapter } from "@/application/ports/PersistentStorageAdapter";
import {
  createDefaultCorvoPluginData,
  type CorvoPluginData
} from "@/domain/types/CorvoPluginData";
import { DataMigrationService } from "@/infrastructure/persistence/DataMigrations";

/**
 * Implementation of the plugin data store.
 * Handles loading, saving, and migrating plugin data.
 */
export class PluginDataStore implements PluginDataStorePort {
  private readonly migrationService: DataMigrationService;

  constructor(private readonly storageAdapter: PersistentStorageAdapter<CorvoPluginData>) {
    this.migrationService = new DataMigrationService();
  }

  /**
   * Loads plugin data from storage, applying migrations if necessary.
   * 
   * @returns The loaded and migrated plugin data
   */
  async load(): Promise<CorvoPluginData> {
    const storedData = await this.storageAdapter.load();

    if (!storedData) {
      return createDefaultCorvoPluginData();
    }

    // Migrate data to current schema version
    const migratedData = this.migrationService.migrate(storedData);

    // Merge with defaults to ensure all required fields exist
    return {
      ...createDefaultCorvoPluginData(),
      ...migratedData
    };
  }

  /**
   * Saves plugin data to storage.
   * 
   * @param data - The data to save
   */
  async save(data: CorvoPluginData): Promise<void> {
    await this.storageAdapter.save(data);
  }
}

