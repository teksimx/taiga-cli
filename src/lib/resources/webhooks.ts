import type { TaigaClient } from "../client.js";
import type { TaigaWebhook } from "../../types/taiga-api.js";

export class WebhooksResource {
  constructor(private readonly client: TaigaClient) {}

  list(projectId: number): Promise<TaigaWebhook[]> {
    return this.client.get<TaigaWebhook[]>("webhooks", { project: projectId });
  }

  get(id: number): Promise<TaigaWebhook> {
    return this.client.get<TaigaWebhook>(`webhooks/${id}`);
  }

  create(payload: Partial<TaigaWebhook> & { project: number; name: string; url: string; key: string }): Promise<TaigaWebhook> {
    return this.client.post<TaigaWebhook>("webhooks", payload);
  }

  update(id: number, payload: Partial<TaigaWebhook>): Promise<TaigaWebhook> {
    return this.client.patch<TaigaWebhook>(`webhooks/${id}`, payload);
  }

  delete(id: number): Promise<void> {
    return this.client.delete(`webhooks/${id}`);
  }

  test(id: number): Promise<unknown> {
    return this.client.post(`webhooks/${id}/test`);
  }
}
