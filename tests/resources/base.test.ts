import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { ResourceClient } from "../../src/lib/resources/base.js";

const client = new TaigaClient({
  baseUrl: "https://api.taiga.io",
  authToken: "test-token",
});

describe("ResourceClient", () => {
  const resource = new ResourceClient(client, { endpoint: "userstories", supportsRef: true });

  it("lists with project filter", async () => {
    const items = await resource.list(1);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ ref: 1 });
  });

  it("gets by ref and internal id", async () => {
    const byRef = await resource.getByRef(1, 1);
    expect(byRef.ref).toBe(1);
    const byId = await resource.get(100);
    expect(byId.id).toBe(100);
  });

  it("creates, updates and deletes", async () => {
    const created = await resource.create({ project: 1, subject: "New item" });
    expect(created.ref).toBe(2);
    const updated = await resource.update(100, { subject: "Updated" });
    expect(updated.subject).toBe("Updated");
    await expect(resource.delete(100)).resolves.toBeUndefined();
  });

  it("bulk creates items", async () => {
    const created = await resource.bulkCreate([{ project: 1, subject: "A" }]);
    expect(created).toHaveLength(1);
    expect(created[0]?.ref).toBe(10);
  });

  it("resolve uses ref for small numbers", async () => {
    const item = await resource.resolve("1", 1);
    expect(item.ref).toBe(1);
  });
});
