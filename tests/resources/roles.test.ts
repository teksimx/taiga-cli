import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { RolesResource } from "../../src/lib/resources/roles.js";

const roles = new RolesResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("RolesResource", () => {
  it("lists and gets roles", async () => {
    const list = await roles.list(1);
    expect(list[0]?.name).toBe("Developer");
    const role = await roles.get(1);
    expect(role.slug).toBe("developer");
  });
});
