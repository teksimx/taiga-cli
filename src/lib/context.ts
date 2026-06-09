import type { GlobalFlags, InstanceConfig } from "../types/config.js";
import { resolveActiveConfig, setAuthToken } from "./config.js";
import { TaigaClient } from "./client.js";
import { Resolver } from "./resolver.js";
import { ConfigError } from "./errors.js";

export interface CommandContext {
  flags: GlobalFlags;
  instanceName: string;
  instance: InstanceConfig;
  client: TaigaClient;
  resolver: Resolver;
  projectSlug?: string;
}

export function createContext(flags: GlobalFlags = {}): CommandContext {
  const { instanceName, instance } = resolveActiveConfig(flags);
  const client = new TaigaClient({
    baseUrl: instance.url,
    authToken: instance.authToken,
    verbose: flags.verbose,
    onTokenRefresh: async (token) => {
      setAuthToken(token, instanceName);
    },
  });
  const resolver = new Resolver(client);
  return {
    flags,
    instanceName,
    instance,
    client,
    resolver,
    projectSlug: instance.defaultProject,
  };
}

export function requireAuth(ctx: CommandContext): void {
  if (!ctx.instance.authToken) {
    throw new ConfigError('Not authenticated. Run "taiga login" first.');
  }
}

export function resolveProjectSlug(ctx: CommandContext, project?: string): string {
  const slug = project ?? ctx.flags.project ?? ctx.projectSlug;
  if (!slug) {
    throw new ConfigError(
      'Project not specified. Use --project or "taiga config set project <slug>".',
    );
  }
  return slug;
}
