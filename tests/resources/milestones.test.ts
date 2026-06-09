import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { MilestonesResource } from "../../src/lib/resources/milestones.js";

const milestones = new MilestonesResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("MilestonesResource", () => {
  it("lists milestones and returns stats", async () => {
    const list = await milestones.list(1);
    expect(list[0]?.name).toBe("Sprint 1");
    const stats = await milestones.stats(5);
    expect(stats.total_points).toBe(5);
  });
});
