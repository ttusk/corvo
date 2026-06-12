import type { CorvoPluginData } from "@/domain/types/CorvoPluginData";

/**
 * Versioned plugin data with schema version tracking
 */
export interface VersionedData extends CorvoPluginData {
  schemaVersion: number;
}

/**
 * Service for migrating plugin data between schema versions.
 * Handles backward compatibility when the data structure changes.
 */
export class DataMigrationService {
  private readonly CURRENT_VERSION = 1;

  /**
   * Migrates data from any previous version to the current version.
   * 
   * @param data - The data to migrate (may be from any version)
   * @returns Migrated data at the current schema version
   */
  migrate(data: any): CorvoPluginData {
    const version = data.schemaVersion ?? 1;
    let current = data;

    // Apply migrations sequentially
    if (version < 2) {
      current = this.migrateV1toV2(current);
    }
    if (version < 3) {
      current = this.migrateV2toV3(current);
    }

    // Always include the current version
    return {
      ...current,
      schemaVersion: this.CURRENT_VERSION
    };
  }

  /**
   * Migration from version 1 to version 2.
   * Add future migrations here when schema changes.
   */
  private migrateV1toV2(data: any): any {
    // Example: If we added a new field, we'd initialize it here
    // return { ...data, newField: defaultValue };
    return data;
  }

  /**
   * Migration from version 2 to version 3.
   * Placeholder for future migrations.
   */
  private migrateV2toV3(data: any): any {
    return data;
  }

  /**
   * Gets the current schema version.
   */
  getCurrentVersion(): number {
    return this.CURRENT_VERSION;
  }
}
