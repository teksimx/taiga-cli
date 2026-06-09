import { readFileSync } from "node:fs";
import { basename } from "pathe";
import type { TaigaClient } from "../client.js";
import type { TaigaAttachment, WorkItemType } from "../../types/taiga-api.js";
import { WORK_ITEM_ENDPOINTS } from "../../types/taiga-api.js";

export class AttachmentsResource {
  constructor(private readonly client: TaigaClient) {}

  list(type: WorkItemType, objectId: number, projectId: number): Promise<TaigaAttachment[]> {
    const endpoint = WORK_ITEM_ENDPOINTS[type];
    return this.client.get<TaigaAttachment[]>(`${endpoint}/attachments`, {
      project: projectId,
      [`${endpoint.slice(0, -1)}`]: objectId,
    });
  }

  upload(
    type: WorkItemType,
    objectId: number,
    projectId: number,
    filePath: string,
  ): Promise<TaigaAttachment> {
    const endpoint = WORK_ITEM_ENDPOINTS[type];
    const form = new FormData();
    const buffer = readFileSync(filePath);
    const blob = new Blob([buffer]);
    form.append("file", blob, basename(filePath));
    form.append("project", String(projectId));
    const fieldName = type === "user-story" ? "user_story" : type;
    form.append(fieldName, String(objectId));
    return this.client.upload<TaigaAttachment>(`${endpoint}/attachments`, form);
  }

  delete(type: WorkItemType, attachmentId: number): Promise<void> {
    const endpoint = WORK_ITEM_ENDPOINTS[type];
    return this.client.delete(`${endpoint}/attachments/${attachmentId}`);
  }
}
