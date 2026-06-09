import { defineCommand } from "citty";
import { MilestonesResource } from "../../lib/resources/milestones.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import { confirmDelete, withContext } from "../shared/helpers.js";

const listCmd = defineCommand({
  meta: { description: "List milestones" },
  args: { project: { type: "string", alias: "p", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const resource = new MilestonesResource(ctx.client);
      const items = await resource.list(project.id);
      printData(items, ctx.flags, {
        head: ["ID", "Name", "Slug", "Closed"],
        rows: items.map((m) => [String(m.id), m.name, m.slug, String(m.closed)]),
      });
    });
  },
});

const showCmd = defineCommand({
  meta: { description: "Show milestone" },
  args: { id: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const resource = new MilestonesResource(ctx.client);
      printData(await resource.get(Number(args.id)), ctx.flags);
    });
  },
});

const createCmd = defineCommand({
  meta: { description: "Create milestone" },
  args: {
    project: { type: "string", alias: "p", required: true },
    name: { type: "string", required: true },
    slug: { type: "string" },
    "estimated-start": { type: "string" },
    "estimated-finish": { type: "string" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const resource = new MilestonesResource(ctx.client);
      const created = await resource.create({
        project: project.id,
        name: args.name as string,
        slug: (args.slug as string) ?? (args.name as string).toLowerCase().replace(/\s+/g, "-"),
        estimated_start: args["estimated-start"] as string | undefined,
        estimated_finish: args["estimated-finish"] as string | undefined,
      });
      printData(created, ctx.flags);
    });
  },
});

const updateCmd = defineCommand({
  meta: { description: "Update milestone" },
  args: {
    id: { type: "positional", required: true },
    name: { type: "string" },
    closed: { type: "boolean" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const resource = new MilestonesResource(ctx.client);
      const payload: Record<string, unknown> = {};
      if (args.name) payload.name = args.name;
      if (args.closed !== undefined) payload.closed = args.closed;
      printData(await resource.update(Number(args.id), payload), ctx.flags);
    });
  },
});

const deleteCmd = defineCommand({
  meta: { description: "Delete milestone" },
  args: { id: { type: "positional", required: true }, yes: { type: "boolean", alias: "y" } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      await confirmDelete(args.yes as boolean | undefined, `milestone ${args.id}`);
      const resource = new MilestonesResource(ctx.client);
      await resource.delete(Number(args.id));
      console.log(`Deleted milestone ${args.id}`);
    });
  },
});

const statsCmd = defineCommand({
  meta: { description: "Milestone statistics" },
  args: { id: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const resource = new MilestonesResource(ctx.client);
      printData(await resource.stats(Number(args.id)), ctx.flags);
    });
  },
});

export const milestonesCommand = defineCommand({
  meta: { description: "Manage milestones/sprints" },
  subCommands: { list: listCmd, show: showCmd, create: createCmd, update: updateCmd, delete: deleteCmd, stats: statsCmd },
});
