import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { TaigaClient } from "../../src/lib/client.js";
import { TaigaAPIError } from "../../src/lib/errors.js";
import { server } from "../setup.js";

describe("TaigaClient", () => {
  const baseUrl = "https://api.taiga.io";

  it("logs in and stores auth token", async () => {
    const client = new TaigaClient({ baseUrl });
    const auth = await client.login("testuser", "password");
    expect(auth.auth_token).toBe("test-token");
  });

  it("normalizes base URL without /api/v1 suffix", () => {
    const client = new TaigaClient({ baseUrl });
    expect(client.apiUrl).toBe("https://api.taiga.io/api/v1");
  });

  it("sends Bearer token on authenticated GET", async () => {
    let authHeader = "";
    server.use(
      http.get("*/api/v1/projects", ({ request }) => {
        authHeader = request.headers.get("Authorization") ?? "";
        return HttpResponse.json([]);
      }),
    );
    const client = new TaigaClient({ baseUrl, authToken: "my-token" });
    await client.get("projects");
    expect(authHeader).toBe("Bearer my-token");
  });

  it("refreshes token on 401 and retries request", async () => {
    let projectCalls = 0;
    server.use(
      http.get("*/api/v1/projects", () => {
        projectCalls += 1;
        if (projectCalls === 1) {
          return HttpResponse.json({ _error_message: "Unauthorized" }, { status: 401 });
        }
        return HttpResponse.json([{ id: 1, slug: "demo" }]);
      }),
    );

    const refreshed: string[] = [];
    const client = new TaigaClient({
      baseUrl,
      authToken: "expired-token",
      onTokenRefresh: (token) => refreshed.push(token),
    });

    const projects = await client.get<unknown[]>("projects");
    expect(projects).toHaveLength(1);
    expect(projectCalls).toBe(2);
    expect(refreshed).toEqual(["refreshed-token"]);
  });

  it("throws when refresh is not possible", async () => {
    const client = new TaigaClient({ baseUrl });
    await expect(client.refreshToken()).rejects.toBeInstanceOf(TaigaAPIError);
  });

  it("parses API error message from response body", async () => {
    const client = new TaigaClient({ baseUrl, authToken: "test-token" });
    await expect(client.login("testuser", "wrong")).rejects.toMatchObject({
      message: "Invalid credentials",
      status: 400,
    });
  });

  it("retries on 429 and eventually succeeds", async () => {
    vi.useFakeTimers();
    let calls = 0;
    server.use(
      http.get("*/api/v1/projects", () => {
        calls += 1;
        if (calls < 3) {
          return HttpResponse.json({}, { status: 429 });
        }
        return HttpResponse.json([{ id: 1 }]);
      }),
    );

    const client = new TaigaClient({ baseUrl, authToken: "test-token", maxRetries: 3 });
    const promise = client.get("projects");
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toHaveLength(1);
    expect(calls).toBe(3);
    vi.useRealTimers();
  });

  it("fails after max 429 retries", async () => {
    vi.useFakeTimers();
    server.use(
      http.get("*/api/v1/projects", () => HttpResponse.json({}, { status: 429 })),
    );

    const client = new TaigaClient({ baseUrl, authToken: "test-token", maxRetries: 2 });
    const promise = client.get("projects");
    const expectation = expect(promise).rejects.toThrow(/Rate limited/);
    await vi.runAllTimersAsync();
    await expectation;
    vi.useRealTimers();
  });

  it("uploads multipart without JSON content-type", async () => {
    let contentType = "";
    server.use(
      http.post("*/api/v1/userstories/attachments", ({ request }) => {
        contentType = request.headers.get("Content-Type") ?? "";
        return HttpResponse.json({ id: 9, name: "f.txt" });
      }),
    );

    const client = new TaigaClient({ baseUrl, authToken: "test-token" });
    const form = new FormData();
    form.append("file", new Blob(["hi"]), "f.txt");
    await client.upload("userstories/attachments", form);
    expect(contentType).toContain("multipart/form-data");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useRealTimers();
  });
});
