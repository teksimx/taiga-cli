import type { TaigaClient } from "../client.js";
import type { TaigaUser } from "../../types/taiga-api.js";

export class UsersResource {
  constructor(private readonly client: TaigaClient) {}

  me(): Promise<TaigaUser> {
    return this.client.get<TaigaUser>("users/me");
  }

  list(projectId?: number): Promise<TaigaUser[]> {
    return this.client.get<TaigaUser[]>("users", { project: projectId });
  }

  get(id: number): Promise<TaigaUser> {
    return this.client.get<TaigaUser>(`users/${id}`);
  }
}
