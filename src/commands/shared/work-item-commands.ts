import { defineCommand } from "citty";
import { readFileSync } from "node:fs";
import { resolveProjectSlug } from "../../lib/context.js";
import {
  parseFormat,
  printData,
  workItemSummary,
  workItemSummaryRows,
  workItemTableRows,
} from "../../lib/output.js";
import { ResourceClient } from "../../lib/resources/base.js";
import { EpicsResource, UserStoriesResource } from "../../lib/resources/work-items.js";
import type { WorkItem, WorkItemType } from "../../types/taiga-api.js";
import { confirmDelete, withContext } from "./helpers.js";

type StatusKind = "user-story" | "task" | "issue" | "epic";

interface WorkItemCommandConfig {
  name: string;
  type: WorkItemType;
  statusKind: StatusKind;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraSubCommands?: Record<string, any>;
}

export function createWorkItemCommands(config: WorkItemCommandConfig) {
  const listCmd = defineCommand({
    meta: { description: `List ${config.name}` },
    args: {
      project: { type: "string", alias: "p", description: "Project slug" },
      status: { type: "string", description: "Filter by status name" },
      assigned: { type: "string", description: "Filter by assignee username" },
      milestone: { type: "string", description: "Filter by milestone ID" },
      format: { type: "string", alias: "f", default: "table" },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const resource = new ResourceClient<WorkItem>(ctx.client, {
          endpoint: endpointFor(config.type),
          supportsRef: true,
        });
        const filters: Record<string, string | number | undefined> = {};
        if (args.status) {
          filters.status = await ctx.resolver.resolveStatusId(project, args.status as string, config.statusKind);
        }
        if (args.assigned) {
          const user = await ctx.resolver.resolveUser(args.assigned as string, project.id);
          filters.assigned_to = user.id;
        }
        if (args.milestone) filters.milestone = args.milestone as string;
        const items = await resource.list(project.id, filters);
        printData(items, ctx.flags, workItemTableRows(items));
      });
    },
  });

  const showCmd = defineCommand({
    meta: { description: `Show ${config.name} details` },
    args: {
      ref: { type: "positional", description: "Ref or ID", required: true },
      project: { type: "string", alias: "p" },
      full: {
        type: "boolean",
        default: false,
        description: "Show full API response instead of summary",
      },
      format: { type: "string", alias: "f", default: "table" },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const resource = new ResourceClient<WorkItem>(ctx.client, {
          endpoint: endpointFor(config.type),
          supportsRef: true,
        });
        const item = await resource.resolve(args.ref as string, project.id);
        if (args.full) {
          printData(item, ctx.flags);
          return;
        }

        const raw = item as Record<string, unknown>;
        if (parseFormat(ctx.flags.format) === "table") {
          printData(item, ctx.flags, workItemSummaryRows(raw));
        } else {
          printData(workItemSummary(raw), ctx.flags);
        }
      });
    },
  });

  const createCmd = defineCommand({
    meta: { description: `Create ${config.name}` },
    args: {
      project: { type: "string", alias: "p" },
      subject: { type: "string", required: true },
      description: { type: "string" },
      status: { type: "string" },
      assigned: { type: "string" },
      tags: { type: "string", description: "Comma-separated tags" },
      milestone: { type: "string" },
      type: { type: "string", description: "Issue type (issues only)" },
      priority: { type: "string", description: "Priority (issues only)" },
      severity: { type: "string", description: "Severity (issues only)" },
      "user-story": { type: "string", description: "User story ref (tasks only)" },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const payload: Record<string, unknown> = {
          project: project.id,
          subject: args.subject,
        };
        if (args.description) payload.description = args.description;
        if (args.status) {
          payload.status = await ctx.resolver.resolveStatusId(
            project,
            args.status as string,
            config.statusKind,
          );
        }
        if (args.assigned) {
          const user = await ctx.resolver.resolveUser(args.assigned as string, project.id);
          payload.assigned_to = user.id;
        }
        if (args.tags) {
          payload.tags = (args.tags as string).split(",").map((t) => t.trim());
        }
        if (args.milestone) payload.milestone = Number(args.milestone);
        if (config.type === "issue") {
          if (args.type) payload.type = await ctx.resolver.resolveNamedEntity(project, args.type as string, "issue_types");
          if (args.priority) payload.priority = await ctx.resolver.resolveNamedEntity(project, args.priority as string, "priorities");
          if (args.severity) payload.severity = await ctx.resolver.resolveNamedEntity(project, args.severity as string, "severities");
        }
        if (config.type === "task" && args["user-story"]) {
          const us = await ctx.resolver.resolveWorkItem("user-story", args["user-story"] as string, slug);
          payload.user_story = us.id;
        }
        const resource = new ResourceClient<WorkItem>(ctx.client, {
          endpoint: endpointFor(config.type),
          supportsRef: true,
        });
        const created = await resource.create(payload as Partial<WorkItem>);
        printData(created, ctx.flags);
      });
    },
  });

  const updateCmd = defineCommand({
    meta: { description: `Update ${config.name}` },
    args: {
      ref: { type: "positional", description: "Ref or ID", required: true },
      project: { type: "string", alias: "p" },
      subject: { type: "string" },
      description: { type: "string" },
      status: { type: "string" },
      assigned: { type: "string" },
      comment: { type: "string", description: "Add a comment" },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const resource = new ResourceClient<WorkItem>(ctx.client, {
          endpoint: endpointFor(config.type),
          supportsRef: true,
        });
        const item = await resource.resolve(args.ref as string, project.id);
        const payload: Record<string, unknown> = {};
        if (args.subject) payload.subject = args.subject;
        if (args.description) payload.description = args.description;
        if (args.status) {
          payload.status = await ctx.resolver.resolveStatusId(
            project,
            args.status as string,
            config.statusKind,
          );
        }
        if (args.assigned) {
          const user = await ctx.resolver.resolveUser(args.assigned as string, project.id);
          payload.assigned_to = user.id;
        }
        if (args.comment) payload.comment = args.comment;
        const updated = await resource.update(item.id, payload as Partial<WorkItem>);
        printData(updated, ctx.flags);
      });
    },
  });

  const deleteCmd = defineCommand({
    meta: { description: `Delete ${config.name}` },
    args: {
      ref: { type: "positional", description: "Ref or ID", required: true },
      project: { type: "string", alias: "p" },
      yes: { type: "boolean", alias: "y", default: false },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const resource = new ResourceClient<WorkItem>(ctx.client, {
          endpoint: endpointFor(config.type),
          supportsRef: true,
        });
        const item = await resource.resolve(args.ref as string, project.id);
        await confirmDelete(args.yes as boolean | undefined, `${config.name} #${item.ref}`);
        await resource.delete(item.id);
        console.log(`Deleted ${config.name} #${item.ref}`);
      });
    },
  });

  const bulkCreateCmd = defineCommand({
    meta: { description: `Bulk create ${config.name} from JSON file` },
    args: {
      file: { type: "string", required: true, description: "JSON file with items array" },
      project: { type: "string", alias: "p" },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const items = JSON.parse(readFileSync(args.file as string, "utf-8")) as Partial<WorkItem>[];
        const withProject = items.map((i) => ({ ...i, project: project.id }));
        const resource = new ResourceClient<WorkItem>(ctx.client, {
          endpoint: endpointFor(config.type),
          supportsRef: true,
        });
        const created = await resource.bulkCreate(withProject);
        printData(created, ctx.flags, workItemTableRows(created));
      });
    },
  });

  return defineCommand({
    meta: { description: `Manage ${config.name}` },
    subCommands: {
      list: listCmd,
      show: showCmd,
      create: createCmd,
      update: updateCmd,
      delete: deleteCmd,
      "bulk-create": bulkCreateCmd,
      ...config.extraSubCommands,
    },
  });
}

function endpointFor(type: WorkItemType): string {
  const map = { "user-story": "userstories", task: "tasks", issue: "issues", epic: "epics" };
  return map[type];
}

export function createUserStoriesCommand() {
  const watchCmd = defineCommand({
    meta: { description: "Watch a user story" },
    args: { ref: { type: "positional", required: true }, project: { type: "string", alias: "p" } },
    async run({ args }) {
      await runUserStoryAction(args as Record<string, unknown>, "watch");
    },
  });
  const unwatchCmd = defineCommand({
    meta: { description: "Unwatch a user story" },
    args: { ref: { type: "positional", required: true }, project: { type: "string", alias: "p" } },
    async run({ args }) {
      await runUserStoryAction(args as Record<string, unknown>, "unwatch");
    },
  });
  const voteCmd = defineCommand({
    meta: { description: "Upvote a user story" },
    args: { ref: { type: "positional", required: true }, project: { type: "string", alias: "p" } },
    async run({ args }) {
      await runUserStoryAction(args as Record<string, unknown>, "upvote");
    },
  });
  const unvoteCmd = defineCommand({
    meta: { description: "Remove vote from user story" },
    args: { ref: { type: "positional", required: true }, project: { type: "string", alias: "p" } },
    async run({ args }) {
      await runUserStoryAction(args as Record<string, unknown>, "downvote");
    },
  });
  const filtersCmd = defineCommand({
    meta: { description: "Get filter metadata for user stories" },
    args: { project: { type: "string", alias: "p" } },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const resource = new UserStoriesResource(ctx.client);
        printData(await resource.filtersData(project.id), ctx.flags);
      });
    },
  });

  return createWorkItemCommands({
    name: "user stories",
    type: "user-story",
    statusKind: "user-story",
    extraSubCommands: {
      watch: watchCmd,
      unwatch: unwatchCmd,
      vote: voteCmd,
      unvote: unvoteCmd,
      filters: filtersCmd,
    },
  });
}

async function runUserStoryAction(
  args: Record<string, unknown>,
  action: "watch" | "unwatch" | "upvote" | "downvote",
): Promise<void> {
  await withContext(args, async (ctx) => {
    const slug = resolveProjectSlug(ctx, args.project as string | undefined);
    const project = await ctx.resolver.resolveProject(slug);
    const resource = new UserStoriesResource(ctx.client);
    const item = await resource.resolve(args.ref as string, project.id);
    await resource[action](item.id);
    console.log(`${action} on user story #${item.ref}`);
  });
}

export function createEpicsCommand() {
  const linkCmd = defineCommand({
    meta: { description: "Link user story to epic" },
    args: {
      epic: { type: "positional", required: true },
      "user-story": { type: "positional", required: true },
      project: { type: "string", alias: "p" },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const epics = new EpicsResource(ctx.client);
        const epic = await epics.resolve(args.epic as string, project.id);
        const us = await ctx.resolver.resolveWorkItem("user-story", args["user-story"] as string, slug);
        await epics.linkUserStory(epic.id, us.id);
        console.log(`Linked US #${us.ref} to epic #${epic.ref}`);
      });
    },
  });
  const unlinkCmd = defineCommand({
    meta: { description: "Unlink user story from epic" },
    args: {
      epic: { type: "positional", required: true },
      "user-story-id": { type: "positional", required: true },
      project: { type: "string", alias: "p" },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const epics = new EpicsResource(ctx.client);
        const epic = await epics.resolve(args.epic as string, project.id);
        await epics.unlinkUserStory(epic.id, Number(args["user-story-id"]));
        console.log("Unlinked user story from epic");
      });
    },
  });
  const relatedCmd = defineCommand({
    meta: { description: "List related user stories" },
    args: { epic: { type: "positional", required: true }, project: { type: "string", alias: "p" } },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string | undefined);
        const project = await ctx.resolver.resolveProject(slug);
        const epics = new EpicsResource(ctx.client);
        const epic = await epics.resolve(args.epic as string, project.id);
        const related = await epics.relatedUserStories(epic.id);
        printData(related, ctx.flags, workItemTableRows(related));
      });
    },
  });

  return createWorkItemCommands({
    name: "epics",
    type: "epic",
    statusKind: "epic",
    extraSubCommands: {
      "link-user-story": linkCmd,
      "unlink-user-story": unlinkCmd,
      "related-user-stories": relatedCmd,
    },
  });
}
