import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { whoamiCommand } from "../../src/commands/auth/whoami.js";
import { runCliCommand } from "../helpers/cli.js";
import { authenticatedEnv } from "../helpers/env.js";

describe("whoami command", () => {
  beforeEach(() => {
    process.env.TAIGA_URL = authenticatedEnv.TAIGA_URL;
    process.env.TAIGA_TOKEN = authenticatedEnv.TAIGA_TOKEN;
  });

  afterEach(() => {
    delete process.env.TAIGA_URL;
    delete process.env.TAIGA_TOKEN;
  });

  it("prints current user as JSON", async () => {
    const { stdout } = await runCliCommand(whoamiCommand, ["--format", "json"]);
    const data = JSON.parse(stdout) as { username: string };
    expect(data.username).toBe("testuser");
  });
});
