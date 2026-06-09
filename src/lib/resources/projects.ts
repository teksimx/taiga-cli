import type { TaigaClient } from "../client.js";
import type { TaigaProject, TaigaUser } from "../../types/taiga-api.js";

export interface ListProjectsOptions {
  /** List all visible projects instead of only the authenticated user's memberships. */
  all?: boolean;
  member?: number;
  orderBy?: string;
  light?: boolean;
}

export class ProjectsResource {
  constructor(private readonly client: TaigaClient) {}

  async list(options: ListProjectsOptions = {}): Promise<TaigaProject[]> {
    if (options.all) {
      return this.client.get<TaigaProject[]>("projects");
    }

    const memberId =
      options.member ?? (await this.client.get<TaigaUser>("users/me")).id;

    return this.client.get<TaigaProject[]>("projects", {
      member: memberId,
      order_by: options.orderBy ?? "user_order",
      light: options.light === false ? undefined : "true",
    });
  }

  get(id: number): Promise<TaigaProject> {
    return this.client.get<TaigaProject>(`projects/${id}`);
  }

  getBySlug(slug: string): Promise<TaigaProject> {
    return this.client.get<TaigaProject>("projects/by_slug", { slug });
  }

  create(payload: Partial<TaigaProject> & { name: string }): Promise<TaigaProject> {
    return this.client.post<TaigaProject>("projects", payload);
  }

  update(id: number, payload: Partial<TaigaProject>): Promise<TaigaProject> {
    return this.client.patch<TaigaProject>(`projects/${id}`, payload);
  }

  delete(id: number): Promise<void> {
    return this.client.delete(`projects/${id}`);
  }

  stats(id: number): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(`projects/${id}/stats`);
  }

  issuesStats(id: number): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(`projects/${id}/issues_stats`);
  }

  getModules(id: number): Promise<Record<string, boolean>> {
    return this.client.get<Record<string, boolean>>(`projects/${id}/modules`);
  }

  updateModules(id: number, modules: Record<string, boolean>): Promise<Record<string, boolean>> {
    return this.client.patch<Record<string, boolean>>(`projects/${id}/modules`, modules);
  }

  duplicate(id: number, name: string): Promise<TaigaProject> {
    return this.client.post<TaigaProject>(`projects/${id}/duplicate`, { name });
  }

  export(id: number): Promise<unknown> {
    return this.client.get<unknown>(`exporter/${id}`);
  }

  import(data: unknown): Promise<TaigaProject> {
    return this.client.post<TaigaProject>("importer", data);
  }

  tagsColors(id: number): Promise<Record<string, string | null>> {
    return this.client.get<Record<string, string | null>>(`projects/${id}/tags_colors`);
  }

  createTag(id: number, tag: string, color: string): Promise<unknown> {
    return this.client.post(`projects/${id}/create_tag`, { tag, color });
  }

  editTag(id: number, from: string, to: string, color?: string): Promise<unknown> {
    return this.client.post(`projects/${id}/edit_tag`, { from_tag: from, to_tag: to, color });
  }

  deleteTag(id: number, tag: string): Promise<unknown> {
    return this.client.post(`projects/${id}/delete_tag`, { tag });
  }

  mixTags(id: number, fromTags: string[], toTag: string): Promise<unknown> {
    return this.client.post(`projects/${id}/mix_tags`, {
      from_tags: fromTags,
      to_tag: toTag,
    });
  }
}
