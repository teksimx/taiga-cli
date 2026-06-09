import type { TaigaClient } from "../client.js";
import type { TaigaCustomAttribute, TaigaNamedEntity, TaigaStatus } from "../../types/taiga-api.js";

const STATUS_ENDPOINTS = {
  "user-story": "userstory-statuses",
  task: "task-statuses",
  issue: "issue-statuses",
  epic: "epic-statuses",
} as const;

const CUSTOM_ATTR_ENDPOINTS = {
  "user-story": "userstory-custom-attributes",
  task: "task-custom-attributes",
  issue: "issue-custom-attributes",
  epic: "epic-custom-attributes",
} as const;

const CUSTOM_VALUE_ENDPOINTS = {
  "user-story": "userstories/custom-attributes-values",
  task: "tasks/custom-attributes-values",
  issue: "issues/custom-attributes-values",
  epic: "epics/custom-attributes-values",
} as const;

export type MetadataEntity = keyof typeof STATUS_ENDPOINTS;

export class MetadataResource {
  constructor(private readonly client: TaigaClient) {}

  listStatuses(entity: MetadataEntity, projectId: number): Promise<TaigaStatus[]> {
    return this.client.get<TaigaStatus[]>(STATUS_ENDPOINTS[entity], { project: projectId });
  }

  createStatus(
    entity: MetadataEntity,
    payload: Partial<TaigaStatus> & { project: number; name: string },
  ): Promise<TaigaStatus> {
    return this.client.post<TaigaStatus>(STATUS_ENDPOINTS[entity], payload);
  }

  updateStatus(entity: MetadataEntity, id: number, payload: Partial<TaigaStatus>): Promise<TaigaStatus> {
    return this.client.patch<TaigaStatus>(`${STATUS_ENDPOINTS[entity]}/${id}`, payload);
  }

  deleteStatus(entity: MetadataEntity, id: number): Promise<void> {
    return this.client.delete(`${STATUS_ENDPOINTS[entity]}/${id}`);
  }

  listPoints(projectId: number): Promise<TaigaNamedEntity[]> {
    return this.client.get<TaigaNamedEntity[]>("points", { project: projectId });
  }

  createPoint(payload: Partial<TaigaNamedEntity> & { project: number; name: string }): Promise<TaigaNamedEntity> {
    return this.client.post<TaigaNamedEntity>("points", payload);
  }

  listPriorities(projectId: number): Promise<TaigaNamedEntity[]> {
    return this.client.get<TaigaNamedEntity[]>("priorities", { project: projectId });
  }

  createPriority(payload: Partial<TaigaNamedEntity> & { project: number; name: string }): Promise<TaigaNamedEntity> {
    return this.client.post<TaigaNamedEntity>("priorities", payload);
  }

  listSeverities(projectId: number): Promise<TaigaNamedEntity[]> {
    return this.client.get<TaigaNamedEntity[]>("severities", { project: projectId });
  }

  createSeverity(payload: Partial<TaigaNamedEntity> & { project: number; name: string }): Promise<TaigaNamedEntity> {
    return this.client.post<TaigaNamedEntity>("severities", payload);
  }

  listIssueTypes(projectId: number): Promise<TaigaNamedEntity[]> {
    return this.client.get<TaigaNamedEntity[]>("issue-types", { project: projectId });
  }

  createIssueType(payload: Partial<TaigaNamedEntity> & { project: number; name: string }): Promise<TaigaNamedEntity> {
    return this.client.post<TaigaNamedEntity>("issue-types", payload);
  }

  listCustomAttributes(entity: MetadataEntity, projectId: number): Promise<TaigaCustomAttribute[]> {
    return this.client.get<TaigaCustomAttribute[]>(CUSTOM_ATTR_ENDPOINTS[entity], {
      project: projectId,
    });
  }

  createCustomAttribute(
    entity: MetadataEntity,
    payload: Partial<TaigaCustomAttribute> & { project: number; name: string; type: string },
  ): Promise<TaigaCustomAttribute> {
    return this.client.post<TaigaCustomAttribute>(CUSTOM_ATTR_ENDPOINTS[entity], payload);
  }

  getCustomAttributeValues(entity: MetadataEntity, objectId: number): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(`${CUSTOM_VALUE_ENDPOINTS[entity]}/${objectId}`);
  }

  setCustomAttributeValues(
    entity: MetadataEntity,
    objectId: number,
    values: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(
      `${CUSTOM_VALUE_ENDPOINTS[entity]}/${objectId}`,
      values,
    );
  }
}
