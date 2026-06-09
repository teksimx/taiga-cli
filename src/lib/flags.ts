import type { GlobalFlags } from "../types/config.js";

export const globalArgs = {
  url: { type: "string" as const, alias: "u", description: "Taiga instance URL override" },
  project: { type: "string" as const, alias: "p", description: "Project slug" },
  format: { type: "string" as const, alias: "f", default: "table", description: "Output: table|json|yaml" },
  verbose: { type: "boolean" as const, alias: "v", default: false, description: "Verbose HTTP logging" },
  yes: { type: "boolean" as const, alias: "y", default: false, description: "Skip confirmation prompts" },
};

export function extractFlags(args: Record<string, unknown>): GlobalFlags {
  return {
    url: args.url as string | undefined,
    project: args.project as string | undefined,
    format: args.format as string | undefined,
    verbose: args.verbose as boolean | undefined,
    yes: args.yes as boolean | undefined,
  };
}
