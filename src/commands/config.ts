import { defineCommand } from "citty";
import {
  resolveActiveConfig,
  setDefaultInstance,
  setInstanceValue,
} from "../lib/config.js";
import { printData } from "../lib/output.js";
import { extractFlags } from "../lib/flags.js";
import { handleCommandError } from "../lib/errors.js";

const setCmd = defineCommand({
  meta: { description: "Set config value" },
  args: {
    key: { type: "positional", description: "url|project|instance", required: true },
    value: { type: "positional", description: "Value", required: true },
    instance: { type: "string", description: "Target instance name" },
  },
  async run({ args }) {
    try {
      const key = args.key as string;
      const value = args.value as string;
      const instance = args.instance as string | undefined;
      if (key === "url") setInstanceValue("url", value, instance);
      else if (key === "project") setInstanceValue("defaultProject", value, instance);
      else if (key === "instance") setDefaultInstance(value);
      else throw new Error(`Unknown key: ${key}. Use url, project, or instance.`);
      console.log(`Set ${key} = ${value}`);
    } catch (error) {
      handleCommandError(error);
    }
  },
});

const getCmd = defineCommand({
  meta: { description: "Show config" },
  args: {
    instance: { type: "string" },
    format: { type: "string", alias: "f", default: "json" },
  },
  async run({ args }) {
    try {
      const flags = extractFlags(args as Record<string, unknown>);
      const { config, instanceName, instance } = resolveActiveConfig(flags, args.instance as string);
      printData({ defaultInstance: config.defaultInstance, instanceName, instance }, flags);
    } catch (error) {
      handleCommandError(error);
    }
  },
});

const useCmd = defineCommand({
  meta: { description: "Switch active instance" },
  args: {
    name: { type: "positional", required: true },
  },
  async run({ args }) {
    try {
      setDefaultInstance(args.name as string);
      console.log(`Active instance: ${args.name}`);
    } catch (error) {
      handleCommandError(error);
    }
  },
});

export const configCommand = defineCommand({
  meta: { description: "Manage CLI configuration" },
  subCommands: { set: setCmd, get: getCmd, use: useCmd },
});
