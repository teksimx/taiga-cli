import type { TaigaClient } from "../client.js";

export interface ResourceConfig {
  endpoint: string;
  supportsRef: boolean;
  refParam?: string;
}

export class ResourceClient<T = object> {
  constructor(
    protected readonly client: TaigaClient,
    protected readonly config: ResourceConfig,
  ) {}

  list(projectId: number, filters: Record<string, string | number | undefined> = {}): Promise<T[]> {
    return this.client.get<T[]>(this.config.endpoint, { project: projectId, ...filters });
  }

  get(id: number): Promise<T> {
    return this.client.get<T>(`${this.config.endpoint}/${id}`);
  }

  getByRef(ref: number, projectId: number): Promise<T> {
    return this.client.get<T>(`${this.config.endpoint}/by_ref`, {
      ref,
      project: projectId,
    });
  }

  create(payload: Partial<T>): Promise<T> {
    return this.client.post<T>(this.config.endpoint, payload);
  }

  update(id: number, payload: Partial<T>, partial = true): Promise<T> {
    if (partial) {
      return this.client.patch<T>(`${this.config.endpoint}/${id}`, payload);
    }
    return this.client.put<T>(`${this.config.endpoint}/${id}`, payload);
  }

  delete(id: number): Promise<void> {
    return this.client.delete(`${this.config.endpoint}/${id}`);
  }

  bulkCreate(items: Partial<T>[]): Promise<T[]> {
    return this.client.post<T[]>(`${this.config.endpoint}/bulk_create`, items);
  }

  async resolve(idOrRef: string, projectId: number): Promise<T> {
    const num = Number(idOrRef);
    if (Number.isInteger(num) && num > 1000) {
      return this.get(num);
    }
    const ref = Number(idOrRef.replace(/^#/, ""));
    return this.getByRef(ref, projectId);
  }
}
