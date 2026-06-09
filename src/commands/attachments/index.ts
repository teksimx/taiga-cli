import { defineCommand } from "citty";
import { AttachmentsResource } from "../../lib/resources/attachments.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import type { WorkItemType } from "../../types/taiga-api.js";
import { confirmDelete, withContext } from "../shared/helpers.js";

function parseType(type: string): WorkItemType {
  const valid: WorkItemType[] = ["user-story", "task", "issue", "epic"];
  if (!valid.includes(type as WorkItemType)) {
    throw new Error(`Invalid type: ${type}. Use user-story, task, issue, or epic.`);
  }
  return type as WorkItemType;
}

const listCmd = defineCommand({
  meta: { description: "List attachments" },
  args: {
    type: { type: "string", required: true },
    ref: { type: "string", description: "Work item ref" },
    id: { type: "string", description: "Work item internal ID" },
    project: { type: "string", alias: "p", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const type = parseType(args.type as string);
      const objectId = args.id
        ? Number(args.id)
        : (await ctx.resolver.resolveWorkItem(type, args.ref as string, slug)).id;
      const attachments = new AttachmentsResource(ctx.client);
      const items = await attachments.list(type, objectId, project.id);
      printData(items, ctx.flags, {
        head: ["ID", "Name", "Size", "URL"],
        rows: items.map((a) => [String(a.id), a.name, String(a.size), a.url]),
      });
    });
  },
});

const uploadCmd = defineCommand({
  meta: { description: "Upload attachment" },
  args: {
    type: { type: "string", required: true },
    ref: { type: "string" },
    id: { type: "string" },
    file: { type: "string", required: true },
    project: { type: "string", alias: "p", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const type = parseType(args.type as string);
      const objectId = args.id
        ? Number(args.id)
        : (await ctx.resolver.resolveWorkItem(type, args.ref as string, slug)).id;
      const attachments = new AttachmentsResource(ctx.client);
      const uploaded = await attachments.upload(type, objectId, project.id, args.file as string);
      printData(uploaded, ctx.flags);
    });
  },
});

const deleteCmd = defineCommand({
  meta: { description: "Delete attachment" },
  args: {
    type: { type: "string", required: true },
    "attachment-id": { type: "string", required: true },
    yes: { type: "boolean", alias: "y" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      await confirmDelete(args.yes as boolean | undefined, `attachment ${args["attachment-id"]}`);
      const attachments = new AttachmentsResource(ctx.client);
      await attachments.delete(parseType(args.type as string), Number(args["attachment-id"]));
      console.log("Attachment deleted.");
    });
  },
});

export const attachmentsCommand = defineCommand({
  meta: { description: "Manage attachments" },
  subCommands: { list: listCmd, upload: uploadCmd, delete: deleteCmd },
});
