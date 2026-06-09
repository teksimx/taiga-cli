import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup.js";
import { TaigaClient } from "../../src/lib/client.js";
import { MetadataResource } from "../../src/lib/resources/metadata.js";

const metadata = new MetadataResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("MetadataResource", () => {
  it("lists statuses and points", async () => {
    const statuses = await metadata.listStatuses("user-story", 1);
    expect(statuses[0]?.name).toBe("New");
    const points = await metadata.listPoints(1);
    expect(points[0]?.name).toBe("3");
  });

  it("creates status and sets custom attribute values", async () => {
    server.use(
      http.post("*/api/v1/userstory-statuses", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        return HttpResponse.json({ id: 11, name: body.name, project: 1 });
      }),
      http.patch("*/api/v1/userstories/custom-attributes-values/:id", async ({ request }) => {
        return HttpResponse.json(await request.json());
      }),
    );
    const created = await metadata.createStatus("user-story", {
      project: 1,
      name: "Review",
      color: "#ccc",
    });
    expect(created.name).toBe("Review");
    const values = await metadata.setCustomAttributeValues("user-story", 100, {
      estimacion: 3,
    });
    expect(values).toMatchObject({ estimacion: 3 });
  });

  it("lists priorities severities and issue types", async () => {
    server.use(
      http.get("*/api/v1/priorities", () => HttpResponse.json([{ id: 40, name: "High", order: 1 }])),
      http.get("*/api/v1/severities", () =>
        HttpResponse.json([{ id: 50, name: "Critical", order: 1 }]),
      ),
      http.get("*/api/v1/issue-types", () => HttpResponse.json([{ id: 30, name: "Bug", order: 1 }])),
    );
    expect((await metadata.listPriorities(1))[0]?.name).toBe("High");
    expect((await metadata.listSeverities(1))[0]?.name).toBe("Critical");
    expect((await metadata.listIssueTypes(1))[0]?.name).toBe("Bug");
  });
});
