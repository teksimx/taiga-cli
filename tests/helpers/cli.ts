import { runCommand } from "citty";
import type { CommandDef } from "citty";
import { vi } from "vitest";

export async function runCliCommand(
  command: CommandDef,
  args: string[] = [],
): Promise<{ stdout: string; stderr: string }> {
  const stdout: string[] = [];
  const stderr: string[] = [];

  const logSpy = vi.spyOn(console, "log").mockImplementation((...msgs: unknown[]) => {
    stdout.push(msgs.map(String).join(" "));
  });
  const errorSpy = vi.spyOn(console, "error").mockImplementation((...msgs: unknown[]) => {
    stderr.push(msgs.map(String).join(" "));
  });

  try {
    await runCommand(command, { rawArgs: args });
  } finally {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  }

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
  };
}

export function mockProcessExit(): { exit: ReturnType<typeof vi.spyOn>; getCode: () => number | undefined } {
  let exitCode: number | undefined;
  const exit = vi.spyOn(process, "exit").mockImplementation((code?: string | number | null) => {
    exitCode = Number(code ?? 0);
    throw new Error(`process.exit:${exitCode}`);
  });
  return {
    exit,
    getCode: () => exitCode,
  };
}
