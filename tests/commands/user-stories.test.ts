import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUserStoriesCommand } from "../../src/commands/shared/work-item-commands.js";
import { mockProcessExit, runCliCommand } from "../helpers/cli.js";
import { authenticatedEnv } from "../helpers/env.js";

const userStoriesCommand = createUserStoriesCommand();

describe("user-stories commands", () => {
  beforeEach(() => {
    process.env.TAIGA_URL = authenticatedEnv.TAIGA_URL;
    process.env.TAIGA_TOKEN = authenticatedEnv.TAIGA_TOKEN;
    process.env.TAIGA_PROJECT = authenticatedEnv.TAIGA_PROJECT;
  });

  afterEach(() => {
    delete process.env.TAIGA_URL;
    delete process.env.TAIGA_TOKEN;
    delete process.env.TAIGA_PROJECT;
    vi.restoreAllMocks();
  });

  it("lists user stories in table format", async () => {
    const listCmd = userStoriesCommand.subCommands?.list;
    const { stdout } = await runCliCommand(listCmd!, []);
    expect(stdout).toContain("Ref");
    expect(stdout).toContain("First story");
  });

  it("creates user story with subject", async () => {
    const createCmd = userStoriesCommand.subCommands?.create;
    const { stdout } = await runCliCommand(createCmd!, [
      "--subject",
      "CLI story",
      "--project",
      "demo",
      "--format",
      "json",
    ]);
    const data = JSON.parse(stdout) as { subject: string; ref: number };
    expect(data.subject).toBe("CLI story");
    expect(data.ref).toBe(2);
  });

  it("exits with config error when project is missing", async () => {
    delete process.env.TAIGA_PROJECT;
    const { exit, getCode } = mockProcessExit();
    const listCmd = userStoriesCommand.subCommands?.list;

    await expect(runCliCommand(listCmd!, [])).rejects.toThrow("process.exit:2");
    expect(getCode()).toBe(2);
    exit.mockRestore();
  });
});
