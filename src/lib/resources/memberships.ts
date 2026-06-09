import type { TaigaClient } from "../client.js";
import type { TaigaMembership } from "../../types/taiga-api.js";

export class MembershipsResource {
  constructor(private readonly client: TaigaClient) {}

  list(projectId: number): Promise<TaigaMembership[]> {
    return this.client.get<TaigaMembership[]>("memberships", { project: projectId });
  }

  get(id: number): Promise<TaigaMembership> {
    return this.client.get<TaigaMembership>(`memberships/${id}`);
  }

  invite(projectId: number, email: string, role: number): Promise<TaigaMembership> {
    return this.client.post<TaigaMembership>("memberships", {
      project: projectId,
      email,
      role,
    });
  }

  update(id: number, payload: Partial<TaigaMembership>): Promise<TaigaMembership> {
    return this.client.patch<TaigaMembership>(`memberships/${id}`, payload);
  }

  remove(id: number): Promise<void> {
    return this.client.delete(`memberships/${id}`);
  }
}
