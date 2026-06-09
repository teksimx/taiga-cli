import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { TaigaClient } from "../../src/lib/client.js";
import { server } from "../setup.js";
import { ResourceClient } from "../../src/lib/resources/base.js";
import { EpicsResource, UserStoriesResource } from "../../src/lib/resources/work-items.js";

const client = new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" });

describe("work item resources", () => {
  it("creates tasks", async () => {
    const tasks = new ResourceClient(client, { endpoint: "tasks", supportsRef: true });
    const created = await tasks.create({ project: 1, subject: "Task one" });
    expect(created.ref).toBe(1);
  });

  it("supports user story watch and filters", async () => {
    const us = new UserStoriesResource(client);
    await expect(us.watch(100)).resolves.toMatchObject({ ok: true });
    await expect(us.unwatch(100)).resolves.toBeDefined();
    await expect(us.upvote(100)).resolves.toBeDefined();
    await expect(us.downvote(100)).resolves.toBeDefined();
    const filters = await us.filtersData(1);
    expect(filters).toBeDefined();
    await expect(us.bulkUpdateMilestone(1, [1, 2], 5)).resolves.toBeDefined();
  });

  it("manages epic relations", async () => {
    server.use(
      http.get("*/api/v1/epics/500", () =>
        HttpResponse.json({ id: 500, ref: 3, subject: "Epic", project: 1, status: 1 }),
      ),
      http.get("*/api/v1/epics/500/related_userstories", () =>
        HttpResponse.json([{ id: 100, ref: 1, subject: "First story", project: 1, status: 10 }]),
      ),
      http.post("*/api/v1/epics/500/related_userstories", () => HttpResponse.json({ ok: true })),
      http.delete("*/api/v1/epics/500/related_userstories/100", () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );
    const epics = new EpicsResource(client);
    const related = await epics.relatedUserStories(500);
    expect(related).toHaveLength(1);
    await expect(epics.linkUserStory(500, 100)).resolves.toBeDefined();
    await expect(epics.unlinkUserStory(500, 100)).resolves.toBeUndefined();
  });
});
