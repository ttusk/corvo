import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Leif styles", () => {
  it("keeps accumulated tables inside a scrollable viewport", () => {
    const styles = readFileSync(resolve(process.cwd(), "styles.css"), "utf8");

    expect(styles).toMatch(/\.leif-table-wrapper\s*{[^}]*max-height:\s*min\(52vh,\s*520px\);/s);
    expect(styles).toMatch(/\.leif-table-wrapper\s*{[^}]*overflow:\s*auto;/s);
    expect(styles).toMatch(/\.leif-table thead th\s*{[^}]*position:\s*sticky;/s);
  });
});
