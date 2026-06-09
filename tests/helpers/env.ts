import { afterEach, beforeEach } from "vitest";

const ENV_KEYS = ["TAIGA_URL", "TAIGA_TOKEN", "TAIGA_PROJECT", "TAIGA_INSTANCE"] as const;

export function withTaigaEnv(
  vars: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
): void {
  beforeEach(() => {
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });
}

export const authenticatedEnv = {
  TAIGA_URL: "https://api.taiga.io",
  TAIGA_TOKEN: "test-token",
  TAIGA_PROJECT: "demo",
};
