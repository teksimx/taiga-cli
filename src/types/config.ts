export interface InstanceConfig {
  url: string;
  authToken?: string;
  defaultProject?: string;
}

export interface AppConfig {
  defaultInstance: string;
  instances: Record<string, InstanceConfig>;
}

export interface GlobalFlags {
  url?: string;
  project?: string;
  format?: string;
  verbose?: boolean;
  yes?: boolean;
}
