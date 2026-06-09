import type { TaigaClient } from "../client.js";
import type { TaigaRole } from "../../types/taiga-api.js";

export class RolesResource {
  constructor(private readonly client: TaigaClient) {}

  list(projectId: number): Promise<TaigaRole[]> {
    return this.client.get<TaigaRole[]>("roles", { project: projectId });
  }

  get(id: number): Promise<TaigaRole> {
    return this.client.get<TaigaRole>(`roles/${id}`);
  }
}
