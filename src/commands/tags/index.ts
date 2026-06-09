import { defineCommand } from "citty";
import { ProjectsResource } from "../../lib/resources/projects.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import { withContext } from "../shared/helpers.js";

const listCmd = defineCommand({
  meta: { description: "List project tags" },
  args: { project: { type: "string", alias: "p", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const projects = new ProjectsResource(ctx.client);
      printData(await projects.tagsColors(project.id), ctx.flags);
    });
  },
});

const createCmd = defineCommand({
  meta: { description: "Create tag" },
  args: {
    project: { type: "string", alias: "p", required: true },
    name: { type: "string", required: true },
    color: { type: "string", default: "#cccccc" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const projects = new ProjectsResource(ctx.client);
      printData(await projects.createTag(project.id, args.name as string, args.color as string), ctx.flags);
    });
  },
});

const updateCmd = defineCommand({
  meta: { description: "Rename/update tag" },
  args: {
    project: { type: "string", alias: "p", required: true },
    from: { type: "string", required: true },
    to: { type: "string", required: true },
    color: { type: "string" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const projects = new ProjectsResource(ctx.client);
      printData(
        await projects.editTag(project.id, args.from as string, args.to as string, args.color as string | undefined),
        ctx.flags,
      );
    });
  },
});

const deleteCmd = defineCommand({
  meta: { description: "Delete tag" },
  args: {
    project: { type: "string", alias: "p", required: true },
    name: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const projects = new ProjectsResource(ctx.client);
      await projects.deleteTag(project.id, args.name as string);
      console.log(`Deleted tag ${args.name}`);
    });
  },
});

const mixCmd = defineCommand({
  meta: { description: "Merge tags" },
  args: {
    project: { type: "string", alias: "p", required: true },
    from: { type: "string", required: true, description: "Comma-separated source tags" },
    to: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const projects = new ProjectsResource(ctx.client);
      const fromTags = (args.from as string).split(",").map((t) => t.trim());
      printData(await projects.mixTags(project.id, fromTags, args.to as string), ctx.flags);
    });
  },
});

export const tagsCommand = defineCommand({
  meta: { description: "Manage project tags" },
  subCommands: { list: listCmd, create: createCmd, update: updateCmd, delete: deleteCmd, mix: mixCmd },
});
