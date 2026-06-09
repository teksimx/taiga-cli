import * as p from "@clack/prompts";
import type { CommandContext } from "../../lib/context.js";
import { createContext, requireAuth, resolveProjectSlug } from "../../lib/context.js";
import { extractFlags } from "../../lib/flags.js";
import { handleCommandError } from "../../lib/errors.js";

export async function withContext<T>(
  args: Record<string, unknown>,
  fn: (ctx: CommandContext) => Promise<T>,
  options: { requireAuth?: boolean; requireProject?: boolean } = {},
): Promise<T> {
  try {
    const flags = extractFlags(args);
    const ctx = createContext(flags);
    if (options.requireAuth !== false) {
      requireAuth(ctx);
    }
    if (options.requireProject) {
      resolveProjectSlug(ctx, flags.project);
    }
    return await fn(ctx);
  } catch (error) {
    handleCommandError(error);
  }
}

export async function confirmDelete(yes: boolean | undefined, label: string): Promise<boolean> {
  if (yes) return true;
  const result = await p.confirm({ message: `Delete ${label}?` });
  if (p.isCancel(result) || !result) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }
  return true;
}
