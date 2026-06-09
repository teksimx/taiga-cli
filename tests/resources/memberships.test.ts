import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup.js";
import { TaigaClient } from "../../src/lib/client.js";
import { MembershipsResource } from "../../src/lib/resources/memberships.js";

const members = new MembershipsResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("MembershipsResource", () => {
  it("lists and invites members", async () => {
    const list = await members.list(1);
    expect(list[0]?.username).toBe("devuser");
    const invited = await members.invite(1, "new@example.com", 1);
    expect(invited.email).toBe("new@example.com");
  });

  it("updates and removes memberships", async () => {
    server.use(
      http.patch("*/api/v1/memberships/1", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 1, role: (body as { role: number }).role, role_name: "Admin" });
      }),
      http.delete("*/api/v1/memberships/1", () => new HttpResponse(null, { status: 204 })),
    );
    const updated = await members.update(1, { role: 2 });
    expect(updated.role).toBe(2);
    await expect(members.remove(1)).resolves.toBeUndefined();
  });
});
