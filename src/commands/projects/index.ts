import { defineCommand } from "citty";
import { writeFileSync } from "node:fs";
import { ProjectsResource } from "../../lib/resources/projects.js";
import { printData, projectTableRows } from "../../lib/output.js";
import { readJsonFile } from "../../lib/config.js";
import { confirmDelete, withContext } from "../shared/helpers.js";

const listCmd = defineCommand({
  meta: { description: "List projects" },
  args: {
    format: { type: "string", alias: "f", default: "table" },
    all: {
      type: "boolean",
      default: false,
      description: "List all visible projects instead of only your memberships",
    },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const projects = new ProjectsResource(ctx.client);
      const items = await projects.list({ all: args.all as boolean });
      printData(items, ctx.flags, projectTableRows(items));
    });
  },
});

const showCmd = defineCommand({
  meta: { description: "Show project details" },
  args: { slug: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const project = await ctx.resolver.resolveProject(args.slug as string);
      printData(project, ctx.flags);
    });
  },
});

const createCmd = defineCommand({
  meta: { description: "Create project" },
  args: {
    name: { type: "string", required: true },
    description: { type: "string" },
    template: { type: "string", description: "Project template ID" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const projects = new ProjectsResource(ctx.client);
      const created = await projects.create({
        name: args.name as string,
        description: (args.description as string) ?? "",
        creation_template: args.template ? Number(args.template) : undefined,
      } as never);
      printData(created, ctx.flags);
    });
  },
});

const updateCmd = defineCommand({
  meta: { description: "Update project" },
  args: {
    slug: { type: "positional", required: true },
    name: { type: "string" },
    description: { type: "string" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const project = await ctx.resolver.resolveProject(args.slug as string);
      const projects = new ProjectsResource(ctx.client);
      const payload: Record<string, unknown> = {};
      if (args.name) payload.name = args.name;
      if (args.description) payload.description = args.description;
      const updated = await projects.update(project.id, payload);
      printData(updated, ctx.flags);
    });
  },
});

const deleteCmd = defineCommand({
  meta: { description: "Delete project" },
  args: {
    slug: { type: "positional", required: true },
    yes: { type: "boolean", alias: "y", default: false },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const project = await ctx.resolver.resolveProject(args.slug as string);
      await confirmDelete(args.yes as boolean | undefined, `project ${project.slug}`);
      const projects = new ProjectsResource(ctx.client);
      await projects.delete(project.id);
      console.log(`Deleted project ${project.slug}`);
    });
  },
});

const statsCmd = defineCommand({
  meta: { description: "Project statistics" },
  args: { slug: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const project = await ctx.resolver.resolveProject(args.slug as string);
      const projects = new ProjectsResource(ctx.client);
      printData(await projects.stats(project.id), ctx.flags);
    });
  },
});

const modulesListCmd = defineCommand({
  meta: { description: "List project modules" },
  args: { slug: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const project = await ctx.resolver.resolveProject(args.slug as string);
      const projects = new ProjectsResource(ctx.client);
      printData(await projects.getModules(project.id), ctx.flags);
    });
  },
});

const modulesUpdateCmd = defineCommand({
  meta: { description: "Update project modules" },
  args: {
    slug: { type: "positional", required: true },
    json: { type: "string", required: true, description: "JSON object of module flags" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const project = await ctx.resolver.resolveProject(args.slug as string);
      const projects = new ProjectsResource(ctx.client);
      const modules = JSON.parse(args.json as string) as Record<string, boolean>;
      printData(await projects.updateModules(project.id, modules), ctx.flags);
    });
  },
});

const duplicateCmd = defineCommand({
  meta: { description: "Duplicate project" },
  args: {
    slug: { type: "positional", required: true },
    name: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const project = await ctx.resolver.resolveProject(args.slug as string);
      const projects = new ProjectsResource(ctx.client);
      const dup = await projects.duplicate(project.id, args.name as string);
      printData(dup, ctx.flags);
    });
  },
});

const exportCmd = defineCommand({
  meta: { description: "Export project to JSON file" },
  args: {
    slug: { type: "positional", required: true },
    output: { type: "string", alias: "o", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const project = await ctx.resolver.resolveProject(args.slug as string);
      const projects = new ProjectsResource(ctx.client);
      const data = await projects.export(project.id);
      writeFileSync(args.output as string, JSON.stringify(data, null, 2));
      console.log(`Exported to ${args.output}`);
    });
  },
});

const importCmd = defineCommand({
  meta: { description: "Import project from JSON file" },
  args: { input: { type: "string", alias: "i", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const data = readJsonFile(args.input as string);
      const projects = new ProjectsResource(ctx.client);
      const imported = await projects.import(data);
      printData(imported, ctx.flags);
    });
  },
});

const modulesCmd = defineCommand({
  meta: { description: "Project modules" },
  subCommands: { list: modulesListCmd, update: modulesUpdateCmd },
});

export const projectsCommand = defineCommand({
  meta: { description: "Manage projects" },
  subCommands: {
    list: listCmd,
    show: showCmd,
    create: createCmd,
    update: updateCmd,
    delete: deleteCmd,
    stats: statsCmd,
    modules: modulesCmd,
    duplicate: duplicateCmd,
    export: exportCmd,
    import: importCmd,
  },
});
