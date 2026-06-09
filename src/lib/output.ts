import Table from "cli-table3";
import { stringify as yamlStringify } from "yaml";
import type { GlobalFlags } from "../types/config.js";

export type OutputFormat = "table" | "json" | "yaml";

export function parseFormat(format?: string): OutputFormat {
  const value = (format ?? "table").toLowerCase();
  if (value === "json" || value === "yaml" || value === "table") {
    return value;
  }
  return "table";
}

export function printData(
  data: unknown,
  flags: Pick<GlobalFlags, "format">,
  tableConfig?: { head: string[]; rows: string[][] },
): void {
  const format = parseFormat(flags.format);

  if (format === "json") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (format === "yaml") {
    console.log(yamlStringify(data));
    return;
  }

  if (tableConfig) {
    const table = new Table({ head: tableConfig.head });
    for (const row of tableConfig.rows) {
      table.push(row);
    }
    console.log(table.toString());
    return;
  }

  if (Array.isArray(data)) {
    const table = new Table();
    for (const item of data) {
      if (typeof item === "object" && item !== null) {
        table.push(Object.values(item as Record<string, unknown>).map(String));
      }
    }
    console.log(table.toString());
    return;
  }

  if (typeof data === "object" && data !== null) {
    const table = new Table();
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      table.push([key, formatCell(value)]);
    }
    console.log(table.toString());
    return;
  }

  console.log(String(data));
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function workItemTableRows(
  items: Array<{
    ref: number;
    subject: string;
    status_extra_info?: { name: string };
    assigned_to_extra_info?: { full_name_display: string } | null;
  }>,
): { head: string[]; rows: string[][] } {
  return {
    head: ["Ref", "Subject", "Status", "Assigned"],
    rows: items.map((item) => [
      String(item.ref),
      item.subject,
      item.status_extra_info?.name ?? "",
      item.assigned_to_extra_info?.full_name_display ?? "",
    ]),
  };
}

export function projectTableRows(
  projects: Array<{ id: number; slug: string; name: string; is_private: boolean }>,
): { head: string[]; rows: string[][] } {
  return {
    head: ["ID", "Slug", "Name", "Private"],
    rows: projects.map((p) => [String(p.id), p.slug, p.name, String(p.is_private)]),
  };
}
