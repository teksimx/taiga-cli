import { defineCommand } from "citty";
import { UsersResource } from "../../lib/resources/users.js";
import { printData } from "../../lib/output.js";
import { withContext } from "../shared/helpers.js";

export const whoamiCommand = defineCommand({
  meta: { description: "Show current authenticated user" },
  args: {
    format: { type: "string", alias: "f", default: "table" },
  },
  async run({ args }) {
    await withContext(args as Record<string, unknown>, async (ctx) => {
      const users = new UsersResource(ctx.client);
      const me = await users.me();
      printData(me, ctx.flags);
    });
  },
});
