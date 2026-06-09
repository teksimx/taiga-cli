import { defineCommand } from "citty";
import { UsersResource } from "../../lib/resources/users.js";
import { RolesResource } from "../../lib/resources/roles.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import { withContext } from "../shared/helpers.js";

const listCmd = defineCommand({
  meta: { description: "List users" },
  args: { project: { type: "string", alias: "p" } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const users = new UsersResource(ctx.client);
      let projectId: number | undefined;
      if (args.project) {
        const project = await ctx.resolver.resolveProject(resolveProjectSlug(ctx, args.project as string));
        projectId = project.id;
      }
      const items = await users.list(projectId);
      printData(items, ctx.flags, {
        head: ["ID", "Username", "Full name", "Email"],
        rows: items.map((u) => [String(u.id), u.username, u.full_name_display, u.email]),
      });
    });
  },
});

const showCmd = defineCommand({
  meta: { description: "Show user" },
  args: { id: { type: "positional", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const users = new UsersResource(ctx.client);
      const idOrName = args.id as string;
      if (/^\d+$/.test(idOrName)) {
        printData(await users.get(Number(idOrName)), ctx.flags);
      } else {
        const all = await users.list();
        const user = all.find((u) => u.username === idOrName);
        if (!user) throw new Error(`User not found: ${idOrName}`);
        printData(user, ctx.flags);
      }
    });
  },
});

const rolesListCmd = defineCommand({
  meta: { description: "List project roles" },
  args: { project: { type: "string", alias: "p", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const roles = new RolesResource(ctx.client);
      const items = await roles.list(project.id);
      printData(items, ctx.flags, {
        head: ["ID", "Name", "Slug"],
        rows: items.map((r) => [String(r.id), r.name, r.slug]),
      });
    });
  },
});

const rolesCmd = defineCommand({
  meta: { description: "Project roles" },
  subCommands: { list: rolesListCmd },
});

export const usersCommand = defineCommand({
  meta: { description: "Manage users" },
  subCommands: { list: listCmd, show: showCmd, roles: rolesCmd },
});
