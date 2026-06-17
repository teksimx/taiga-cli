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

function extraInfoName(value: unknown): string | undefined {
  if (typeof value === "object" && value !== null && "name" in value) {
    return String((value as { name: string }).name);
  }
  return undefined;
}

function extraInfoDisplayName(value: unknown): string | undefined {
  if (typeof value === "object" && value !== null && "full_name_display" in value) {
    return String((value as { full_name_display: string }).full_name_display);
  }
  return undefined;
}

export function formatWorkItemTags(tags: unknown): string {
  if (!Array.isArray(tags)) return "";
  return tags
    .map((tag) => (Array.isArray(tag) ? tag[0] : tag))
    .filter((tag) => tag !== null && tag !== undefined && tag !== "")
    .map(String)
    .join(", ");
}

function omitEmptyFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    result[key] = value;
  }
  return result;
}

export function workItemSummary(item: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {
    ref: item.ref,
    subject: item.subject,
    description: item.description,
    status: extraInfoName(item.status_extra_info) ?? item.status,
    assigned: extraInfoDisplayName(item.assigned_to_extra_info),
    owner: extraInfoDisplayName(item.owner_extra_info),
    project: (item.project_extra_info as { name?: string } | undefined)?.name ?? item.project,
    milestone: item.milestone_name,
    tags: formatWorkItemTags(item.tags),
    is_closed: item.is_closed,
    is_blocked: item.is_blocked,
    due_date: item.due_date,
    total_comments: item.total_comments,
    total_attachments: item.total_attachments,
    total_points: item.total_points,
    created_date: item.created_date,
    modified_date: item.modified_date,
    finish_date: item.finish_date ?? item.finished_date,
  };

  const type = extraInfoName(item.type_extra_info);
  if (type) summary.type = type;

  const priority = extraInfoName(item.priority_extra_info);
  if (priority) summary.priority = priority;

  const severity = extraInfoName(item.severity_extra_info);
  if (severity) summary.severity = severity;

  const userStory = item.user_story_extra_info as { ref?: number; subject?: string } | undefined;
  if (userStory?.ref) {
    summary.user_story = userStory.subject
      ? `#${userStory.ref} ${userStory.subject}`
      : `#${userStory.ref}`;
  }

  return omitEmptyFields(summary);
}

export function workItemSummaryRows(
  item: Record<string, unknown>,
  options?: { truncateDescription?: number },
): { head: string[]; rows: string[][] } {
  const summary = workItemSummary(item);
  const maxDescription = options?.truncateDescription ?? 300;

  return {
    head: ["Field", "Value"],
    rows: Object.entries(summary).map(([key, value]) => {
      let display = formatCell(value);
      if (key === "description" && display.length > maxDescription) {
        display = `${display.slice(0, maxDescription)}…`;
      }
      return [key, display];
    }),
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
