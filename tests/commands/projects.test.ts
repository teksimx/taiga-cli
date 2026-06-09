import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { projectsCommand } from "../../src/commands/projects/index.js";
import { runCliCommand } from "../helpers/cli.js";
import { authenticatedEnv } from "../helpers/env.js";

describe("projects commands", () => {
  beforeEach(() => {
    process.env.TAIGA_URL = authenticatedEnv.TAIGA_URL;
    process.env.TAIGA_TOKEN = authenticatedEnv.TAIGA_TOKEN;
  });

  afterEach(() => {
    delete process.env.TAIGA_URL;
    delete process.env.TAIGA_TOKEN;
  });

  it("lists projects as JSON", async () => {
    const listCmd = projectsCommand.subCommands?.list;
    expect(listCmd).toBeDefined();
    const { stdout } = await runCliCommand(listCmd!, ["--format", "json"]);
    const data = JSON.parse(stdout) as Array<{ slug: string }>;
    expect(data[0]?.slug).toBe("demo");
  });
});
