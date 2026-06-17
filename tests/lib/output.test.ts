import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatWorkItemTags,
  parseFormat,
  printData,
  projectTableRows,
  workItemSummary,
  workItemSummaryRows,
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

  it("formats work item tags", () => {
    expect(formatWorkItemTags([["bug", "#f00"], ["feature", "#0f0"]])).toBe("bug, feature");
    expect(formatWorkItemTags([])).toBe("");
  });

  it("builds work item summary from API payload", () => {
    const summary = workItemSummary({
      ref: 1,
      subject: "Story",
      description: "Details",
      status_extra_info: { name: "New" },
      assigned_to_extra_info: { full_name_display: "Dev" },
      owner_extra_info: { full_name_display: "Owner" },
      project_extra_info: { name: "Demo" },
      tags: [["bug", "#f00"]],
      is_closed: false,
      total_comments: 1,
      backlog_order: 999,
      assigned_to: 2,
    });

    expect(summary).toEqual({
      ref: 1,
      subject: "Story",
      description: "Details",
      status: "New",
      assigned: "Dev",
      owner: "Owner",
      project: "Demo",
      tags: "bug",
      is_closed: false,
      total_comments: 1,
    });
    expect(summary).not.toHaveProperty("backlog_order");
    expect(summary).not.toHaveProperty("assigned_to");
  });

  it("builds work item summary rows for show output", () => {
    const table = workItemSummaryRows({
      ref: 1,
      subject: "Story",
      status_extra_info: { name: "New" },
    });
    expect(table.head).toEqual(["Field", "Value"]);
    expect(table.rows).toContainEqual(["ref", "1"]);
    expect(table.rows).toContainEqual(["status", "New"]);
  });
});
