import { defineCommand } from "citty";
import { HistoryResource } from "../../lib/resources/history.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import type { WorkItemType } from "../../types/taiga-api.js";
import type { CommandContext } from "../../lib/context.js";
import { confirmDelete, withContext } from "../shared/helpers.js";

function parseType(type: string): WorkItemType {
  const valid: WorkItemType[] = ["user-story", "task", "issue", "epic"];
  if (!valid.includes(type as WorkItemType)) {
    throw new Error(`Invalid type: ${type}`);
  }
  return type as WorkItemType;
}

async function resolveObjectId(
  ctx: CommandContext,
  type: WorkItemType,
  args: Record<string, unknown>,
): Promise<number> {
  if (args.id) return Number(args.id);
  const slug = resolveProjectSlug(ctx, args.project as string | undefined);
  const item = await ctx.resolver.resolveWorkItem(type, args.ref as string, slug);
  return item.id;
}

const listCmd = defineCommand({
  meta: { description: "List history and comments" },
  args: {
    type: { type: "string", required: true },
    ref: { type: "string" },
    id: { type: "string" },
    project: { type: "string", alias: "p" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const type = parseType(args.type as string);
      const objectId = await resolveObjectId(ctx, type, args as Record<string, unknown>);
      const history = new HistoryResource(ctx.client);
      const entries = await history.list(type, objectId);
      printData(entries, ctx.flags, {
        head: ["Date", "User", "Comment"],
        rows: entries.map((e) => [
          e.created_at,
          e.user?.username ?? "",
          (e.comment ?? "").slice(0, 80),
        ]),
      });
    });
  },
});

const addCmd = defineCommand({
  meta: { description: "Add comment" },
  args: {
    type: { type: "string", required: true },
    ref: { type: "string" },
    id: { type: "string" },
    project: { type: "string", alias: "p" },
    text: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const type = parseType(args.type as string);
      const objectId = await resolveObjectId(ctx, type, args as Record<string, unknown>);
      const history = new HistoryResource(ctx.client);
      printData(await history.addComment(type, objectId, args.text as string), ctx.flags);
    });
  },
});

const editCmd = defineCommand({
  meta: { description: "Edit comment" },
  args: {
    type: { type: "string", required: true },
    id: { type: "string", required: true },
    "comment-id": { type: "string", required: true },
    text: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const type = parseType(args.type as string);
      const history = new HistoryResource(ctx.client);
      printData(
        await history.editComment(type, Number(args.id), args["comment-id"] as string, args.text as string),
        ctx.flags,
      );
    });
  },
});

const deleteCmd = defineCommand({
  meta: { description: "Delete comment" },
  args: {
    type: { type: "string", required: true },
    id: { type: "string", required: true },
    "comment-id": { type: "string", required: true },
    yes: { type: "boolean", alias: "y" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      await confirmDelete(args.yes as boolean | undefined, `comment ${args["comment-id"]}`);
      const type = parseType(args.type as string);
      const history = new HistoryResource(ctx.client);
      await history.deleteComment(type, Number(args.id), args["comment-id"] as string);
      console.log("Comment deleted.");
    });
  },
});

export const commentsCommand = defineCommand({
  meta: { description: "Manage comments and history" },
  subCommands: { list: listCmd, add: addCmd, edit: editCmd, delete: deleteCmd },
});
