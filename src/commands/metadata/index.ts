import { defineCommand } from "citty";
import { MetadataResource, type MetadataEntity } from "../../lib/resources/metadata.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import { withContext } from "../shared/helpers.js";

function createStatusCommands(entity: MetadataEntity, label: string) {
  const listCmd = defineCommand({
    meta: { description: `List ${label}` },
    args: { project: { type: "string", alias: "p", required: true } },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string);
        const project = await ctx.resolver.resolveProject(slug);
        const meta = new MetadataResource(ctx.client);
        printData(await meta.listStatuses(entity, project.id), ctx.flags);
      });
    },
  });

  const createCmd = defineCommand({
    meta: { description: `Create ${label}` },
    args: {
      project: { type: "string", alias: "p", required: true },
      name: { type: "string", required: true },
      color: { type: "string", default: "#999999" },
    },
    async run({ args }) {
      await withContext(args as Record<string, unknown>, async (ctx) => {
        const slug = resolveProjectSlug(ctx, args.project as string);
        const project = await ctx.resolver.resolveProject(slug);
        const meta = new MetadataResource(ctx.client);
        printData(
          await meta.createStatus(entity, {
            project: project.id,
            name: args.name as string,
            color: args.color as string,
          }),
          ctx.flags,
        );
      });
    },
  });

  return defineCommand({
    meta: { description: label },
    subCommands: { list: listCmd, create: createCmd },
  });
}

function createNamedListCommand(
  label: string,
  listFn: (meta: MetadataResource, projectId: number) => Promise<unknown>,
) {
  return defineCommand({
    meta: { description: label },
    subCommands: {
      list: defineCommand({
        meta: { description: `List ${label}` },
        args: { project: { type: "string", alias: "p", required: true } },
        async run({ args }) {
          await withContext(args as Record<string, unknown>, async (ctx) => {
            const slug = resolveProjectSlug(ctx, args.project as string);
            const project = await ctx.resolver.resolveProject(slug);
            const meta = new MetadataResource(ctx.client);
            printData(await listFn(meta, project.id), ctx.flags);
          });
        },
      }),
    },
  });
}

const customAttrsListCmd = defineCommand({
  meta: { description: "List custom attributes" },
  args: {
    project: { type: "string", alias: "p", required: true },
    entity: { type: "string", required: true, description: "user-story|task|issue|epic" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const meta = new MetadataResource(ctx.client);
      printData(
        await meta.listCustomAttributes(args.entity as MetadataEntity, project.id),
        ctx.flags,
      );
    });
  },
});

const customAttrsCreateCmd = defineCommand({
  meta: { description: "Create custom attribute" },
  args: {
    project: { type: "string", alias: "p", required: true },
    entity: { type: "string", required: true },
    name: { type: "string", required: true },
    type: { type: "string", default: "text" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const meta = new MetadataResource(ctx.client);
      printData(
        await meta.createCustomAttribute(args.entity as MetadataEntity, {
          project: project.id,
          name: args.name as string,
          type: args.type as string,
        }),
        ctx.flags,
      );
    });
  },
});

const customAttrsSetValueCmd = defineCommand({
  meta: { description: "Set custom attribute value on work item" },
  args: {
    entity: { type: "string", required: true },
    id: { type: "string", required: true },
    attr: { type: "string", required: true },
    value: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const meta = new MetadataResource(ctx.client);
      const entity = args.entity as MetadataEntity;
      printData(
        await meta.setCustomAttributeValues(entity, Number(args.id), {
          [args.attr as string]: args.value,
        }),
        ctx.flags,
      );
    });
  },
});

const customAttributesCmd = defineCommand({
  meta: { description: "Custom attributes" },
  subCommands: {
    list: customAttrsListCmd,
    create: customAttrsCreateCmd,
    "set-value": customAttrsSetValueCmd,
  },
});

export const metadataCommand = defineCommand({
  meta: { description: "Project metadata" },
  subCommands: {
    "user-story-statuses": createStatusCommands("user-story", "user story statuses"),
    "task-statuses": createStatusCommands("task", "task statuses"),
    "issue-statuses": createStatusCommands("issue", "issue statuses"),
    "epic-statuses": createStatusCommands("epic", "epic statuses"),
    points: createNamedListCommand("story points", (m, id) => m.listPoints(id)),
    priorities: createNamedListCommand("priorities", (m, id) => m.listPriorities(id)),
    severities: createNamedListCommand("severities", (m, id) => m.listSeverities(id)),
    "issue-types": createNamedListCommand("issue types", (m, id) => m.listIssueTypes(id)),
    "custom-attributes": customAttributesCmd,
  },
});
