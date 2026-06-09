import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { HistoryResource } from "../../src/lib/resources/history.js";

const history = new HistoryResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("HistoryResource", () => {
  it("lists history entries", async () => {
    const entries = await history.list("user-story", 100);
    expect(entries[0]?.comment).toBe("Initial comment");
  });

  it("adds comment via patch", async () => {
    const result = await history.addComment("user-story", 100, "New comment");
    expect(result).toMatchObject({ comment: "New comment" });
  });
});
