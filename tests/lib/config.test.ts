import { mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "pathe";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureInstance,
  loadConfig,
  normalizeInstanceUrl,
  resolveActiveConfig,
  resolveInstance,
  saveConfig,
  setAuthToken,
  setDefaultInstance,
} from "../../src/lib/config.js";
import { ConfigError } from "../../src/lib/errors.js";

const CONFIG_DIR = join(homedir(), ".config", "taiga-cli");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

function resetConfig(): void {
  try {
    rmSync(CONFIG_PATH, { force: true });
  } catch {
    // ignore
  }
}

describe("config", () => {
  beforeEach(() => {
    resetConfig();
    mkdirSync(CONFIG_DIR, { recursive: true });
  });

  afterEach(() => {
    resetConfig();
    delete process.env.TAIGA_URL;
    delete process.env.TAIGA_TOKEN;
    delete process.env.TAIGA_PROJECT;
    delete process.env.TAIGA_INSTANCE;
  });

  it("persists auth token for default instance", () => {
    saveConfig({
      defaultInstance: "default",
      instances: { default: { url: "https://api.taiga.io" } },
    });
    setAuthToken("secret-token");
    expect(loadConfig().instances.default?.authToken).toBe("secret-token");
  });

  it("switches default instance", () => {
    saveConfig({
      defaultInstance: "default",
      instances: {
        default: { url: "https://api.taiga.io" },
        staging: { url: "https://staging.taiga.io" },
      },
    });
    setDefaultInstance("staging");
    expect(loadConfig().defaultInstance).toBe("staging");
  });

  it("throws for unknown instance", () => {
    const config = loadConfig();
    expect(() => resolveInstance(config, "missing")).toThrow(ConfigError);
  });

  it("normalizes instance URL by stripping /api/v1", () => {
    expect(normalizeInstanceUrl("https://taiga.teksi.mx/api/v1/")).toBe(
      "https://taiga.teksi.mx",
    );
    expect(normalizeInstanceUrl("https://api.taiga.io")).toBe("https://api.taiga.io");
  });

  it("overwrites existing instance URL on login ensureInstance", () => {
    saveConfig({
      defaultInstance: "default",
      instances: { default: { url: "https://api.taiga.io" } },
    });
    ensureInstance("default", "https://taiga.teksi.mx/api/v1");
    expect(loadConfig().instances.default?.url).toBe("https://taiga.teksi.mx");
  });

  it("applies env overrides in resolveActiveConfig", () => {
    saveConfig({
      defaultInstance: "default",
      instances: { default: { url: "https://api.taiga.io", authToken: "file-token" } },
    });
    process.env.TAIGA_TOKEN = "env-token";
    process.env.TAIGA_URL = "https://self-hosted.test";
    process.env.TAIGA_PROJECT = "myproj";

    const { instance } = resolveActiveConfig();
    expect(instance.authToken).toBe("env-token");
    expect(instance.url).toBe("https://self-hosted.test");
    expect(instance.defaultProject).toBe("myproj");
  });
});
