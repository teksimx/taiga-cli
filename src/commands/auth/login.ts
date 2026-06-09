import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import {
  ensureInstance,
  normalizeInstanceUrl,
  resolveActiveConfig,
  setAuthToken,
} from "../../lib/config.js";
import { TaigaClient } from "../../lib/client.js";
import { extractFlags } from "../../lib/flags.js";
import { handleCommandError } from "../../lib/errors.js";

export const loginCommand = defineCommand({
  meta: { description: "Authenticate with Taiga" },
  args: {
    url: { type: "string", alias: "u", description: "Taiga instance URL" },
    username: { type: "string", description: "Username or email" },
    instance: { type: "string", description: "Config instance name", default: "default" },
  },
  async run({ args }) {
    try {
      p.intro("Taiga CLI login");
      const flags = extractFlags(args as Record<string, unknown>);
      const url =
        args.url ??
        process.env.TAIGA_URL ??
        resolveActiveConfig(flags, args.instance as string).instance.url;

      const username =
        args.username ??
        (await p.text({ message: "Username or email", validate: (v) => (v ? undefined : "Required") }));
      if (p.isCancel(username)) {
        p.cancel("Login cancelled.");
        process.exit(0);
      }

      const password = await p.password({
        message: "Password",
        validate: (v) => (v ? undefined : "Required"),
      });
      if (p.isCancel(password)) {
        p.cancel("Login cancelled.");
        process.exit(0);
      }

      const client = new TaigaClient({ baseUrl: url });
      const auth = await client.login(username as string, password as string);

      const instanceName = args.instance as string;
      ensureInstance(instanceName, url);
      setAuthToken(auth.auth_token, instanceName);

      const savedUrl = normalizeInstanceUrl(url);
      p.outro(
        `Logged in as ${auth.full_name || auth.username} on ${savedUrl}`,
      );
    } catch (error) {
      handleCommandError(error);
    }
  },
});
