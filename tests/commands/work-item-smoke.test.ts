import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createWorkItemCommands } from "../../src/commands/shared/work-item-commands.js";
import { runCliCommand } from "../helpers/cli.js";
import { authenticatedEnv } from "../helpers/env.js";

describe("work item command smoke", () => {
  beforeEach(() => {
    process.env.TAIGA_URL = authenticatedEnv.TAIGA_URL;
    process.env.TAIGA_TOKEN = authenticatedEnv.TAIGA_TOKEN;
    process.env.TAIGA_PROJECT = authenticatedEnv.TAIGA_PROJECT;
  });

  afterEach(() => {
    delete process.env.TAIGA_URL;
    delete process.env.TAIGA_TOKEN;
    delete process.env.TAIGA_PROJECT;
  });

  it.each([
    ["tasks", createWorkItemCommands({ name: "tasks", type: "task", statusKind: "task" })],
    ["issues", createWorkItemCommands({ name: "issues", type: "issue", statusKind: "issue" })],
  ])("%s list command runs", async (_name, command) => {
    const listCmd = command.subCommands?.list;
    const { stdout } = await runCliCommand(listCmd!, ["--project", "demo"]);
    expect(stdout).toBeDefined();
  });
});
