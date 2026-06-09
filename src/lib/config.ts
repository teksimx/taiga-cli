import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "pathe";
import { defu } from "defu";
import type { AppConfig, GlobalFlags, InstanceConfig } from "../types/config.js";
import { ConfigError } from "./errors.js";

const CONFIG_DIR = join(homedir(), ".config", "taiga-cli");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: AppConfig = {
  defaultInstance: "default",
  instances: {
    default: {
      url: "https://api.taiga.io",
    },
  },
};

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(): AppConfig {
  if (!existsSync(CONFIG_PATH)) {
    return structuredClone(DEFAULT_CONFIG);
  }
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return defu(JSON.parse(raw) as AppConfig, DEFAULT_CONFIG);
  } catch {
    throw new ConfigError(`Invalid config file at ${CONFIG_PATH}`);
  }
}

export function saveConfig(config: AppConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
    encoding: "utf-8",
    mode: 0o600,
  });
  try {
    chmodSync(CONFIG_PATH, 0o600);
  } catch {
    // ignore on platforms without chmod support
  }
}

export function resolveInstance(
  config: AppConfig,
  instanceName?: string,
): { name: string; instance: InstanceConfig } {
  const name = instanceName ?? process.env.TAIGA_INSTANCE ?? config.defaultInstance;
  const instance = config.instances[name];
  if (!instance) {
    throw new ConfigError(`Unknown instance "${name}". Use "taiga config use <name>".`);
  }
  return { name, instance };
}

export function resolveActiveConfig(
  flags: GlobalFlags = {},
  instanceName?: string,
): { config: AppConfig; instanceName: string; instance: InstanceConfig } {
  const config = loadConfig();
  const resolved = resolveInstance(config, instanceName);
  const instance: InstanceConfig = {
    ...resolved.instance,
    url: flags.url ?? process.env.TAIGA_URL ?? resolved.instance.url,
    authToken: process.env.TAIGA_TOKEN ?? resolved.instance.authToken,
    defaultProject:
      flags.project ?? process.env.TAIGA_PROJECT ?? resolved.instance.defaultProject,
  };
  return { config, instanceName: resolved.name, instance };
}

export function normalizeInstanceUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed.slice(0, -"/api/v1".length) : trimmed;
}

export function setInstanceValue(
  key: keyof InstanceConfig,
  value: string,
  instanceName?: string,
): void {
  const config = loadConfig();
  const { name, instance } = resolveInstance(config, instanceName);
  const stored = key === "url" ? normalizeInstanceUrl(value) : value;
  config.instances[name] = { ...instance, [key]: stored };
  saveConfig(config);
}

export function clearAuthToken(instanceName?: string): void {
  const config = loadConfig();
  const { name, instance } = resolveInstance(config, instanceName);
  const { authToken: _removed, ...rest } = instance;
  config.instances[name] = rest;
  saveConfig(config);
}

export function setAuthToken(token: string, instanceName?: string): void {
  setInstanceValue("authToken", token, instanceName);
}

export function setDefaultInstance(name: string): void {
  const config = loadConfig();
  if (!config.instances[name]) {
    throw new ConfigError(`Instance "${name}" does not exist.`);
  }
  config.defaultInstance = name;
  saveConfig(config);
}

export function ensureInstance(name: string, url: string): void {
  const config = loadConfig();
  const normalizedUrl = normalizeInstanceUrl(url);
  config.instances[name] = {
    ...(config.instances[name] ?? {}),
    url: normalizedUrl,
  };
  saveConfig(config);
}

export function readJsonFile<T>(path: string): T {
  if (!existsSync(path)) {
    throw new ConfigError(`File not found: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export function writeJsonFile(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
