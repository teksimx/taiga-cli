import type { TaigaClient } from "../client.js";
import type { TaigaWikiLink, TaigaWikiPage } from "../../types/taiga-api.js";

export class WikiResource {
  constructor(private readonly client: TaigaClient) {}

  listPages(projectId: number): Promise<TaigaWikiPage[]> {
    return this.client.get<TaigaWikiPage[]>("wiki", { project: projectId });
  }

  getPage(id: number): Promise<TaigaWikiPage> {
    return this.client.get<TaigaWikiPage>(`wiki/${id}`);
  }

  createPage(payload: Partial<TaigaWikiPage> & { project: number; slug: string; content: string }): Promise<TaigaWikiPage> {
    return this.client.post<TaigaWikiPage>("wiki", payload);
  }

  updatePage(id: number, payload: Partial<TaigaWikiPage>): Promise<TaigaWikiPage> {
    return this.client.patch<TaigaWikiPage>(`wiki/${id}`, payload);
  }

  deletePage(id: number): Promise<void> {
    return this.client.delete(`wiki/${id}`);
  }

  listLinks(projectId: number): Promise<TaigaWikiLink[]> {
    return this.client.get<TaigaWikiLink[]>("wiki-links", { project: projectId });
  }

  createLink(payload: Partial<TaigaWikiLink> & { project: number; title: string; href: string }): Promise<TaigaWikiLink> {
    return this.client.post<TaigaWikiLink>("wiki-links", payload);
  }

  deleteLink(id: number): Promise<void> {
    return this.client.delete(`wiki-links/${id}`);
  }
}
