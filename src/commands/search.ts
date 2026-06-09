import { defineCommand } from "citty";
import { SearchResource } from "../lib/resources/search.js";
import { printData } from "../lib/output.js";
import { resolveProjectSlug } from "../lib/context.js";
import { withContext } from "./shared/helpers.js";

const searchCmd = defineCommand({
  meta: { description: "Search in project" },
  args: {
    query: { type: "positional", required: true },
    project: { type: "string", alias: "p", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const search = new SearchResource(ctx.client);
      printData(await search.search(project.id, args.query as string), ctx.flags);
    });
  },
});

const resolveCmd = defineCommand({
  meta: { description: "Resolve ref to entity" },
  args: {
    ref: { type: "positional", required: true },
    project: { type: "string", alias: "p", required: true },
    type: { type: "string", required: true, description: "user-story|task|issue|epic" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const search = new SearchResource(ctx.client);
      const typeMap: Record<string, string> = {
        "user-story": "userstory",
        task: "task",
        issue: "issue",
        epic: "epic",
      };
      printData(
        await search.resolve(project.id, Number(args.ref), typeMap[args.type as string] ?? args.type as string),
        ctx.flags,
      );
    });
  },
});

export const searchCommand = defineCommand({
  meta: { description: "Search and resolve" },
  subCommands: { search: searchCmd, resolve: resolveCmd },
});
