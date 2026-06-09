import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { TaigaClient } from "../../src/lib/client.js";
import { ProjectsResource } from "../../src/lib/resources/projects.js";
import { server } from "../setup.js";

const projects = new ProjectsResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("ProjectsResource", () => {
  it("lists and gets by slug", async () => {
    const list = await projects.list();
    expect(list[0]?.slug).toBe("demo");
    const project = await projects.getBySlug("demo");
    expect(project.name).toBe("Demo");
  });

  it("lists all projects when all option is set", async () => {
    server.use(
      http.get("*/api/v1/projects", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.has("member")) {
          return HttpResponse.json([{ id: 1, name: "Mine", slug: "mine", is_private: true }]);
        }
        return HttpResponse.json([{ id: 2, name: "All", slug: "all", is_private: false }]);
      }),
    );
    const mine = await projects.list();
    expect(mine[0]?.slug).toBe("mine");
    const all = await projects.list({ all: true });
    expect(all[0]?.slug).toBe("all");
  });

  it("creates project and reads stats", async () => {
    const created = await projects.create({ name: "New Project" });
    expect(created.slug).toBe("new-project");
    const stats = await projects.stats(1);
    expect(stats.total_milestones).toBe(2);
  });

  it("manages tags", async () => {
    const tags = await projects.tagsColors(1);
    expect(tags.bug).toBe("#ff0000");
    await expect(projects.createTag(1, "hotfix", "#000000")).resolves.toBeDefined();
    await expect(projects.editTag(1, "bug", "defect")).resolves.toBeDefined();
    await expect(projects.deleteTag(1, "obsolete")).resolves.toBeDefined();
    await expect(projects.mixTags(1, ["a", "b"], "merged")).resolves.toBeDefined();
  });

  it("updates and deletes projects", async () => {
    server.use(
      http.patch("*/api/v1/projects/1", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 1, slug: "demo", ...(body as object) });
      }),
      http.delete("*/api/v1/projects/1", () => new HttpResponse(null, { status: 204 })),
    );
    const updated = await projects.update(1, { name: "Renamed" });
    expect(updated.name).toBe("Renamed");
    await expect(projects.delete(1)).resolves.toBeUndefined();
  });
});
