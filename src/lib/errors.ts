export const ExitCode = {
  OK: 0,
  API_ERROR: 1,
  CONFIG_ERROR: 2,
  NOT_FOUND: 3,
} as const;

export class TaigaCLIError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = ExitCode.API_ERROR,
  ) {
    super(message);
    this.name = "TaigaCLIError";
  }
}

export class TaigaAPIError extends TaigaCLIError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message, ExitCode.API_ERROR);
    this.name = "TaigaAPIError";
  }
}

export class ConfigError extends TaigaCLIError {
  constructor(message: string) {
    super(message, ExitCode.CONFIG_ERROR);
    this.name = "ConfigError";
  }
}

export class NotFoundError extends TaigaCLIError {
  constructor(message: string) {
    super(message, ExitCode.NOT_FOUND);
    this.name = "NotFoundError";
  }
}

export function handleCommandError(error: unknown): never {
  if (error instanceof TaigaCLIError) {
    console.error(error.message);
    process.exit(error.exitCode);
  }
  if (error instanceof Error) {
    console.error(error.message);
    process.exit(ExitCode.API_ERROR);
  }
  console.error(String(error));
  process.exit(ExitCode.API_ERROR);
}
