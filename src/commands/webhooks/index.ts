import { defineCommand } from "citty";
import { WebhooksResource } from "../../lib/resources/webhooks.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import { confirmDelete, withContext } from "../shared/helpers.js";

const listCmd = defineCommand({
  meta: { description: "List webhooks" },
  args: { project: { type: "string", alias: "p", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const webhooks = new WebhooksResource(ctx.client);
      const items = await webhooks.list(project.id);
      printData(items, ctx.flags, {
        head: ["ID", "Name", "URL"],
        rows: items.map((w) => [String(w.id), w.name, w.url]),
      });
    });
  },
});

const showCmd = defineCommand({
  meta: { description: "Show webhook" },
  args: { id: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const webhooks = new WebhooksResource(ctx.client);
      printData(await webhooks.get(Number(args.id)), ctx.flags);
    });
  },
});

const createCmd = defineCommand({
  meta: { description: "Create webhook" },
  args: {
    project: { type: "string", alias: "p", required: true },
    name: { type: "string", required: true },
    url: { type: "string", required: true },
    key: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const webhooks = new WebhooksResource(ctx.client);
      printData(
        await webhooks.create({
          project: project.id,
          name: args.name as string,
          url: args.url as string,
          key: args.key as string,
        }),
        ctx.flags,
      );
    });
  },
});

const updateCmd = defineCommand({
  meta: { description: "Update webhook" },
  args: {
    id: { type: "positional", required: true },
    name: { type: "string" },
    url: { type: "string" },
    key: { type: "string" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const webhooks = new WebhooksResource(ctx.client);
      const payload: Record<string, string> = {};
      if (args.name) payload.name = args.name as string;
      if (args.url) payload.url = args.url as string;
      if (args.key) payload.key = args.key as string;
      printData(await webhooks.update(Number(args.id), payload), ctx.flags);
    });
  },
});

const deleteCmd = defineCommand({
  meta: { description: "Delete webhook" },
  args: { id: { type: "positional", required: true }, yes: { type: "boolean", alias: "y" } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      await confirmDelete(args.yes as boolean | undefined, `webhook ${args.id}`);
      const webhooks = new WebhooksResource(ctx.client);
      await webhooks.delete(Number(args.id));
      console.log("Webhook deleted.");
    });
  },
});

const testCmd = defineCommand({
  meta: { description: "Test webhook" },
  args: { id: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const webhooks = new WebhooksResource(ctx.client);
      printData(await webhooks.test(Number(args.id)), ctx.flags);
    });
  },
});

export const webhooksCommand = defineCommand({
  meta: { description: "Manage webhooks" },
  subCommands: {
    list: listCmd,
    show: showCmd,
    create: createCmd,
    update: updateCmd,
    delete: deleteCmd,
    test: testCmd,
  },
});
