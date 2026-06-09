import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseFormat,
  printData,
  projectTableRows,
  workItemTableRows,
} from "../../src/lib/output.js";

describe("output", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses supported formats", () => {
    expect(parseFormat("json")).toBe("json");
    expect(parseFormat("YAML")).toBe("yaml");
    expect(parseFormat("unknown")).toBe("table");
  });

  it("prints JSON output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    printData({ ok: true }, { format: "json" });
    expect(spy).toHaveBeenCalledWith(JSON.stringify({ ok: true }, null, 2));
  });

  it("prints YAML output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    printData({ ok: true }, { format: "yaml" });
    expect(spy.mock.calls[0]?.[0]).toContain("ok: true");
  });

  it("prints configured table rows", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const table = projectTableRows([
      { id: 1, slug: "demo", name: "Demo", is_private: false },
    ]);
    printData([], { format: "table" }, table);
    const output = String(spy.mock.calls[0]?.[0]);
    expect(output).toContain("Slug");
    expect(output).toContain("demo");
  });

  it("builds work item table rows", () => {
    const table = workItemTableRows([
      {
        ref: 1,
        subject: "Story",
        status_extra_info: { name: "New" },
        assigned_to_extra_info: { full_name_display: "Dev" },
      },
    ]);
    expect(table.rows[0]).toEqual(["1", "Story", "New", "Dev"]);
  });
});
