import { ResourceClient } from "./base.js";
import type { TaigaClient } from "../client.js";
import type { TaigaMilestone } from "../../types/taiga-api.js";

export class MilestonesResource extends ResourceClient<TaigaMilestone> {
  constructor(client: TaigaClient) {
    super(client, { endpoint: "milestones", supportsRef: false });
  }

  stats(id: number): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(`milestones/${id}/stats`);
  }
}
