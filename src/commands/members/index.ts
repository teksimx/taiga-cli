import { defineCommand } from "citty";
import { MembershipsResource } from "../../lib/resources/memberships.js";
import { RolesResource } from "../../lib/resources/roles.js";
import { printData } from "../../lib/output.js";
import { resolveProjectSlug } from "../../lib/context.js";
import { confirmDelete, withContext } from "../shared/helpers.js";

const listCmd = defineCommand({
  meta: { description: "List project members" },
  args: { project: { type: "string", alias: "p", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const members = new MembershipsResource(ctx.client);
      const items = await members.list(project.id);
      printData(items, ctx.flags, {
        head: ["ID", "User", "Role", "Email"],
        rows: items.map((m) => [
          String(m.id),
          m.username ?? m.full_name ?? String(m.user),
          m.role_name,
          m.email ?? "",
        ]),
      });
    });
  },
});

const inviteCmd = defineCommand({
  meta: { description: "Invite member to project" },
  args: {
    project: { type: "string", alias: "p", required: true },
    email: { type: "string", required: true },
    role: { type: "string", required: true, description: "Role name or ID" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const slug = resolveProjectSlug(ctx, args.project as string);
      const project = await ctx.resolver.resolveProject(slug);
      const roles = new RolesResource(ctx.client);
      const roleList = await roles.list(project.id);
      const roleArg = args.role as string;
      const role = /^\d+$/.test(roleArg)
        ? roleList.find((r) => r.id === Number(roleArg))
        : roleList.find((r) => r.name.toLowerCase() === roleArg.toLowerCase());
      if (!role) throw new Error(`Role not found: ${roleArg}`);
      const members = new MembershipsResource(ctx.client);
      const created = await members.invite(project.id, args.email as string, role.id);
      printData(created, ctx.flags);
    });
  },
});

const updateCmd = defineCommand({
  meta: { description: "Update member role" },
  args: { id: { type: "positional", required: true }, role: { type: "string", required: true } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const members = new MembershipsResource(ctx.client);
      const updated = await members.update(Number(args.id), { role: Number(args.role) });
      printData(updated, ctx.flags);
    });
  },
});

const removeCmd = defineCommand({
  meta: { description: "Remove member" },
  args: { id: { type: "positional", required: true }, yes: { type: "boolean", alias: "y" } },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      await confirmDelete(args.yes as boolean | undefined, `member ${args.id}`);
      const members = new MembershipsResource(ctx.client);
      await members.remove(Number(args.id));
      console.log(`Removed member ${args.id}`);
    });
  },
});

export const membersCommand = defineCommand({
  meta: { description: "Manage project members" },
  subCommands: { list: listCmd, invite: inviteCmd, update: updateCmd, remove: removeCmd },
});
