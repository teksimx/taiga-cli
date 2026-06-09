import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup.js";
import { TaigaClient } from "../../src/lib/client.js";
import { WikiResource } from "../../src/lib/resources/wiki.js";

const wiki = new WikiResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("WikiResource", () => {
  it("lists and creates wiki pages", async () => {
    const pages = await wiki.listPages(1);
    expect(pages[0]?.slug).toBe("home");
    const created = await wiki.createPage({
      project: 1,
      slug: "guide",
      content: "# Guide",
    });
    expect(created.slug).toBe("guide");
  });

  it("updates pages and manages links", async () => {
    server.use(
      http.get("*/api/v1/wiki/1", () =>
        HttpResponse.json({ id: 1, slug: "home", project: 1, content: "# Home", version: 1 }),
      ),
      http.patch("*/api/v1/wiki/1", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 1, slug: "home", project: 1, version: 2, ...(body as object) });
      }),
      http.delete("*/api/v1/wiki/1", () => new HttpResponse(null, { status: 204 })),
      http.post("*/api/v1/wiki-links", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 3, ...(body as object) });
      }),
      http.delete("*/api/v1/wiki-links/3", () => new HttpResponse(null, { status: 204 })),
    );
    const page = await wiki.getPage(1);
    expect(page.slug).toBe("home");
    const updated = await wiki.updatePage(1, { content: "# Updated" });
    expect(updated.content).toBe("# Updated");
    await expect(wiki.deletePage(1)).resolves.toBeUndefined();
    const link = await wiki.createLink({ project: 1, title: "Docs", href: "https://docs" });
    expect(link.title).toBe("Docs");
    await expect(wiki.deleteLink(3)).resolves.toBeUndefined();
  });
});
