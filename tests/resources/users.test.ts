import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { UsersResource } from "../../src/lib/resources/users.js";

const users = new UsersResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("UsersResource", () => {
  it("returns current user and lists project users", async () => {
    const me = await users.me();
    expect(me.username).toBe("testuser");
    const list = await users.list(1);
    expect(list[0]?.username).toBe("devuser");
    const user = await users.get(2);
    expect(user.id).toBe(2);
  });
});
