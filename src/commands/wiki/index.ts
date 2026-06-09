import { defineCommand } from "citty";
import { WikiResource } from "../../lib/resources/wiki.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import { confirmDelete, withContext } from "../shared/helpers.js";

const listCmd = defineCommand({
  meta: { description: "List wiki pages" },
  args: { project: { type: "string", alias: "p", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const wiki = new WikiResource(ctx.client);
      const pages = await wiki.listPages(project.id);
      printData(pages, ctx.flags, {
        head: ["ID", "Slug", "Version"],
        rows: pages.map((p) => [String(p.id), p.slug, String(p.version)]),
      });
    });
  },
});

const showCmd = defineCommand({
  meta: { description: "Show wiki page" },
  args: { id: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const wiki = new WikiResource(ctx.client);
      printData(await wiki.getPage(Number(args.id)), ctx.flags);
    });
  },
});

const createCmd = defineCommand({
  meta: { description: "Create wiki page" },
  args: {
    project: { type: "string", alias: "p", required: true },
    slug: { type: "string", required: true },
    content: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const wiki = new WikiResource(ctx.client);
      printData(
        await wiki.createPage({
          project: project.id,
          slug: args.slug as string,
          content: args.content as string,
        }),
        ctx.flags,
      );
    });
  },
});

const updateCmd = defineCommand({
  meta: { description: "Update wiki page" },
  args: {
    id: { type: "positional", required: true },
    content: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const wiki = new WikiResource(ctx.client);
      printData(await wiki.updatePage(Number(args.id), { content: args.content as string }), ctx.flags);
    });
  },
});

const deleteCmd = defineCommand({
  meta: { description: "Delete wiki page" },
  args: { id: { type: "positional", required: true }, yes: { type: "boolean", alias: "y" } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      await confirmDelete(args.yes as boolean | undefined, `wiki page ${args.id}`);
      const wiki = new WikiResource(ctx.client);
      await wiki.deletePage(Number(args.id));
      console.log("Wiki page deleted.");
    });
  },
});

const linksListCmd = defineCommand({
  meta: { description: "List wiki links" },
  args: { project: { type: "string", alias: "p", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const wiki = new WikiResource(ctx.client);
      printData(await wiki.listLinks(project.id), ctx.flags);
    });
  },
});

const linksCreateCmd = defineCommand({
  meta: { description: "Create wiki link" },
  args: {
    project: { type: "string", alias: "p", required: true },
    title: { type: "string", required: true },
    href: { type: "string", required: true },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const wiki = new WikiResource(ctx.client);
      printData(
        await wiki.createLink({
          project: project.id,
          title: args.title as string,
          href: args.href as string,
        }),
        ctx.flags,
      );
    });
  },
});

const linksDeleteCmd = defineCommand({
  meta: { description: "Delete wiki link" },
  args: { id: { type: "positional", required: true }, yes: { type: "boolean", alias: "y" } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      await confirmDelete(args.yes as boolean | undefined, `wiki link ${args.id}`);
      const wiki = new WikiResource(ctx.client);
      await wiki.deleteLink(Number(args.id));
      console.log("Wiki link deleted.");
    });
  },
});

const linksCmd = defineCommand({
  meta: { description: "Wiki links" },
  subCommands: { list: linksListCmd, create: linksCreateCmd, delete: linksDeleteCmd },
});

export const wikiCommand = defineCommand({
  meta: { description: "Manage wiki" },
  subCommands: {
    list: listCmd,
    show: showCmd,
    create: createCmd,
    update: updateCmd,
    delete: deleteCmd,
    links: linksCmd,
  },
});
