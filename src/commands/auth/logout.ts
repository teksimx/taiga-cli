import { defineCommand } from "citty";
import { clearAuthToken } from "../../lib/config.js";
import { handleCommandError } from "../../lib/errors.js";

export const logoutCommand = defineCommand({
  meta: { description: "Clear stored auth token" },
  args: {
    instance: { type: "string", description: "Config instance name" },
  },
  async run({ args }) {
    try {
      clearAuthToken(args.instance as string | undefined);
      console.log("Logged out.");
    } catch (error) {
      handleCommandError(error);
    }
  },
});
