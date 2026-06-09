import { describe, expect, it, vi } from "vitest";
import {
  ConfigError,
  ExitCode,
  NotFoundError,
  TaigaAPIError,
  handleCommandError,
} from "../../src/lib/errors.js";

describe("errors", () => {
  it("assigns correct exit codes", () => {
    expect(new TaigaAPIError("api", 500).exitCode).toBe(ExitCode.API_ERROR);
    expect(new ConfigError("cfg").exitCode).toBe(ExitCode.CONFIG_ERROR);
    expect(new NotFoundError("missing").exitCode).toBe(ExitCode.NOT_FOUND);
  });

  it("handleCommandError exits with TaigaCLIError code", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    handleCommandError(new ConfigError("bad config"));

    expect(errorSpy).toHaveBeenCalledWith("bad config");
    expect(exit).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);

    exit.mockRestore();
    errorSpy.mockRestore();
  });
});
