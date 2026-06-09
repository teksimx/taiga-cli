import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { WebhooksResource } from "../../src/lib/resources/webhooks.js";

const webhooks = new WebhooksResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("WebhooksResource", () => {
  it("lists, creates and tests webhooks", async () => {
    const list = await webhooks.list(1);
    expect(list[0]?.name).toBe("CI");
    const created = await webhooks.create({
      project: 1,
      name: "Deploy",
      url: "https://hooks.test/deploy",
      key: "k",
    });
    expect(created.name).toBe("Deploy");
    await expect(webhooks.test(1)).resolves.toMatchObject({ ok: true });
  });
});
