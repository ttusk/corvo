export type CsvRecord = Record<string, string | number | undefined | null>;

/**
 * Service for exporting data to CSV format.
 * Handles escaping, header generation, and UTF-8 BOM for Excel compatibility.
 */
export class CsvExportService {
  private static readonly DELIMITER = ",";
  private static readonly LINE_BREAK = "\n";
  private static readonly BOM = "\uFEFF";

  /**
   * Converts an array of records to a CSV string.
   * @param records - Array of objects to convert
   * @returns CSV string with BOM prefix
   */
  static export(records: CsvRecord[]): string {
    if (records.length === 0) {
      return this.BOM;
    }

    const headers = Object.keys(records[0]);
    const lines: string[] = [this.formatRow(headers)];

    records.forEach((record) => {
      const values = headers.map((header) => this.formatValue(record[header]));
      lines.push(this.formatRow(values));
    });

    return this.BOM + lines.join(this.LINE_BREAK);
  }

  /**
   * Triggers a browser download of a CSV file.
   * @param csvContent - The CSV content string
   * @param filename - The desired filename (without extension)
   */
  static download(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static formatRow(values: string[]): string {
    return values.join(this.DELIMITER);
  }

  private static formatValue(value: string | number | undefined | null): string {
    if (value === undefined || value === null) {
      return "";
    }

    const stringValue = String(value);

    // Escape values containing delimiter, quotes, or newlines
    if (
      stringValue.includes(this.DELIMITER) ||
      stringValue.includes('"') ||
      stringValue.includes(this.LINE_BREAK)
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }
}
