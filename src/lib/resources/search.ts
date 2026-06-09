import type { TaigaClient } from "../client.js";

export class SearchResource {
  constructor(private readonly client: TaigaClient) {}

  search(projectId: number, text: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>("search", { project: projectId, text });
  }

  resolve(projectId: number, ref: number, type: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>("resolver", {
      project: projectId,
      ref,
      type,
    });
  }
}
