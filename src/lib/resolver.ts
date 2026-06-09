import type { TaigaClient } from "./client.js";
import type { TaigaProject, TaigaUser, WorkItem, WorkItemType } from "../types/taiga-api.js";
import { WORK_ITEM_ENDPOINTS } from "../types/taiga-api.js";
import { NotFoundError } from "./errors.js";

export function parseRef(input: string): number {
  const cleaned = input.replace(/^#/, "").trim();
  const ref = Number(cleaned);
  if (!Number.isInteger(ref) || ref <= 0) {
    throw new NotFoundError(`Invalid reference: ${input}`);
  }
  return ref;
}

export function isInternalId(input: string): boolean {
  const num = Number(input);
  return Number.isInteger(num) && num > 1000;
}

export class Resolver {
  constructor(private readonly client: TaigaClient) {}

  async resolveProject(slugOrId: string): Promise<TaigaProject> {
    if (/^\d+$/.test(slugOrId) && isInternalId(slugOrId)) {
      return this.client.get<TaigaProject>(`projects/${slugOrId}`);
    }
    const project = await this.client.get<TaigaProject>("projects/by_slug", { slug: slugOrId });
    if (!project?.id) {
      throw new NotFoundError(`Project not found: ${slugOrId}`);
    }
    return project;
  }

  async resolveWorkItem(
    type: WorkItemType,
    refOrId: string,
    projectSlug: string,
  ): Promise<WorkItem> {
    const endpoint = WORK_ITEM_ENDPOINTS[type];
    if (/^\d+$/.test(refOrId) && isInternalId(refOrId)) {
      return this.client.get<WorkItem>(`${endpoint}/${refOrId}`);
    }
    const project = await this.resolveProject(projectSlug);
    const ref = parseRef(refOrId);
    return this.client.get<WorkItem>(`${endpoint}/by_ref`, {
      ref,
      project: project.id,
    });
  }

  async resolveUser(username: string, projectId?: number): Promise<TaigaUser> {
    const users = await this.client.get<TaigaUser[]>("users", {
      project: projectId,
    });
    const user = users.find(
      (u) => u.username === username || u.full_name === username,
    );
    if (!user) {
      throw new NotFoundError(`User not found: ${username}`);
    }
    return user;
  }

  async resolveStatusId(
    project: TaigaProject,
    statusName: string,
    kind: "user-story" | "task" | "issue" | "epic",
  ): Promise<number> {
    const map = {
      "user-story": project.us_statuses,
      task: project.task_statuses,
      issue: project.issue_statuses,
      epic: project.epic_statuses,
    };
    const statuses = map[kind] ?? [];
    const status = statuses.find(
      (s) => s.name.toLowerCase() === statusName.toLowerCase() || s.slug === statusName,
    );
    if (!status) {
      throw new NotFoundError(`Status not found: ${statusName}`);
    }
    return status.id;
  }

  async resolveNamedEntity(
    project: TaigaProject,
    name: string,
    field: "issue_types" | "priorities" | "severities" | "points",
  ): Promise<number> {
    const entities = project[field] ?? [];
    const entity = entities.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (!entity) {
      throw new NotFoundError(`${field} not found: ${name}`);
    }
    return entity.id;
  }
}
