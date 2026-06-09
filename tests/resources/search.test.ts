import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { SearchResource } from "../../src/lib/resources/search.js";

const search = new SearchResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("SearchResource", () => {
  it("searches project text", async () => {
    const result = await search.search(1, "story");
    expect(result.user_stories).toHaveLength(1);
  });

  it("resolves refs", async () => {
    const resolved = await search.resolve(1, 1, "userstory");
    expect(resolved.ref).toBe(1);
  });
});
