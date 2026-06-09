import { readFileSync } from "node:fs";
import { dirname, join } from "pathe";
import { fileURLToPath } from "node:url";
import { http, HttpResponse } from "msw";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

function loadFixture<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(fixturesDir, ...parts), "utf-8")) as T;
}

export const API_BASE = "https://api.taiga.io/api/v1";

export const defaultHandlers = [
  http.post("*/api/v1/auth", async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string };
    if (body.password === "wrong") {
      return HttpResponse.json({ _error_message: "Invalid credentials" }, { status: 400 });
    }
    return HttpResponse.json(loadFixture("auth", "login-success.json"));
  }),

  http.post("*/api/v1/auth/refresh", () => {
    return HttpResponse.json({ auth_token: "refreshed-token" });
  }),

  http.get("*/api/v1/users/me", () => {
    return HttpResponse.json({
      id: 1,
      username: "testuser",
      full_name: "Test User",
      full_name_display: "Test User",
      email: "test@example.com",
    });
  }),

  http.get("*/api/v1/users", ({ request }) => {
    const url = new URL(request.url);
    void url.searchParams.get("project");
    return HttpResponse.json([
      {
        id: 2,
        username: "devuser",
        full_name: "Dev User",
        full_name_display: "Dev User",
        email: "dev@example.com",
      },
    ]);
  }),

  http.get("*/api/v1/projects", () => {
    return HttpResponse.json(loadFixture("projects", "list.json"));
  }),

  http.get("*/api/v1/projects/by_slug", ({ request }) => {
    const slug = new URL(request.url).searchParams.get("slug");
    if (slug === "demo") {
      return HttpResponse.json(loadFixture("projects", "by-slug.json"));
    }
    return HttpResponse.json(loadFixture("errors", "not-found.json"), { status: 404 });
  }),

  http.get("*/api/v1/projects/:id", ({ params }) => {
    if (params.id === "9999") {
      return HttpResponse.json(loadFixture("projects", "by-slug.json"));
    }
    return HttpResponse.json(loadFixture("errors", "not-found.json"), { status: 404 });
  }),

  http.post("*/api/v1/projects", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({
      id: 2,
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, "-"),
      description: "",
      is_private: false,
    });
  }),

  http.get("*/api/v1/projects/:id/stats", () => {
    return HttpResponse.json({ total_milestones: 2, total_points: 10 });
  }),

  http.get("*/api/v1/userstories", () => {
    return HttpResponse.json([
      {
        id: 100,
        ref: 1,
        subject: "First story",
        project: 1,
        status: 10,
        status_extra_info: { name: "New", color: "#fff" },
        assigned_to_extra_info: null,
      },
    ]);
  }),

  http.get("*/api/v1/userstories/by_ref", () => {
    return HttpResponse.json(loadFixture("userstories", "by-ref.json"));
  }),

  http.get("*/api/v1/userstories/filters_data", () => {
    return HttpResponse.json({ statuses: [{ id: 10, name: "New" }] });
  }),

  http.get("*/api/v1/userstories/:id", ({ params }) => {
    if (params.id === "100") {
      return HttpResponse.json(loadFixture("userstories", "by-ref.json"));
    }
    return HttpResponse.json(loadFixture("errors", "not-found.json"), { status: 404 });
  }),

  http.post("*/api/v1/userstories", async ({ request }) => {
    const body = (await request.json()) as { subject: string; project: number };
    return HttpResponse.json({
      id: 101,
      ref: 2,
      subject: body.subject,
      project: body.project,
      status: 10,
    });
  }),

  http.patch("*/api/v1/userstories/:id", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: 100, ref: 1, ...body });
  }),

  http.delete("*/api/v1/userstories/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/v1/userstories/bulk_create", async ({ request }) => {
    const body = (await request.json()) as unknown[];
    return HttpResponse.json(
      body.map((item, i) => ({
        ...(item as object),
        id: 200 + i,
        ref: 10 + i,
      })),
    );
  }),

  http.post("*/api/v1/userstories/:id/watch", () => HttpResponse.json({ ok: true })),
  http.post("*/api/v1/userstories/:id/unwatch", () => HttpResponse.json({ ok: true })),
  http.post("*/api/v1/userstories/:id/upvote", () => HttpResponse.json({ ok: true })),
  http.post("*/api/v1/userstories/:id/downvote", () => HttpResponse.json({ ok: true })),
  http.post("*/api/v1/userstories/bulk_update_milestone", () => HttpResponse.json({ ok: true })),

  http.get("*/api/v1/tasks", () => HttpResponse.json([])),
  http.post("*/api/v1/tasks", async ({ request }) => {
    const body = (await request.json()) as { subject: string };
    return HttpResponse.json({ id: 300, ref: 1, subject: body.subject, project: 1, status: 20 });
  }),

  http.get("*/api/v1/issues", () => HttpResponse.json([])),
  http.get("*/api/v1/epics", () => HttpResponse.json([])),

  http.get("*/api/v1/milestones", () => {
    return HttpResponse.json([
      { id: 5, name: "Sprint 1", slug: "sprint-1", project: 1, closed: false },
    ]);
  }),

  http.get("*/api/v1/milestones/:id/stats", () => {
    return HttpResponse.json({ total_points: 5 });
  }),

  http.get("*/api/v1/memberships", () => {
    return HttpResponse.json([
      {
        id: 1,
        project: 1,
        role: 1,
        role_name: "Developer",
        user: 2,
        username: "devuser",
        email: "dev@example.com",
      },
    ]);
  }),

  http.post("*/api/v1/memberships", async ({ request }) => {
    const body = (await request.json()) as { email: string; role: number; project: number };
    return HttpResponse.json({ id: 2, ...body, role_name: "Developer" });
  }),

  http.get("*/api/v1/roles", () => {
    return HttpResponse.json([{ id: 1, name: "Developer", slug: "developer", project: 1, order: 1 }]);
  }),

  http.get("*/api/v1/roles/:id", () => {
    return HttpResponse.json({ id: 1, name: "Developer", slug: "developer", project: 1, order: 1 });
  }),

  http.get("*/api/v1/users/:id", () => {
    return HttpResponse.json({
      id: 2,
      username: "devuser",
      full_name: "Dev User",
      full_name_display: "Dev User",
      email: "dev@example.com",
    });
  }),

  http.get("*/api/v1/search", () => {
    return HttpResponse.json({ user_stories: [{ ref: 1, subject: "First story" }] });
  }),

  http.get("*/api/v1/resolver", () => {
    return HttpResponse.json({ id: 100, ref: 1, type: "userstory" });
  }),

  http.get("*/api/v1/history/userstory/:id", () => {
    return HttpResponse.json([
      {
        id: "h1",
        type: 1,
        created_at: "2026-01-01T00:00:00Z",
        comment: "Initial comment",
        user: { username: "testuser" },
      },
    ]);
  }),

  http.post("*/api/v1/userstories/attachments", () => {
    return HttpResponse.json({ id: 1, name: "file.txt", size: 10, url: "http://x/file.txt", project: 1 });
  }),

  http.get("*/api/v1/projects/:id/tags_colors", () => {
    return HttpResponse.json({ bug: "#ff0000", feature: "#00ff00" });
  }),

  http.post("*/api/v1/projects/:id/create_tag", () => HttpResponse.json({ ok: true })),
  http.post("*/api/v1/projects/:id/edit_tag", () => HttpResponse.json({ ok: true })),
  http.post("*/api/v1/projects/:id/delete_tag", () => HttpResponse.json({ ok: true })),
  http.post("*/api/v1/projects/:id/mix_tags", () => HttpResponse.json({ ok: true })),

  http.get("*/api/v1/userstory-statuses", () => {
    return HttpResponse.json([
      { id: 10, name: "New", slug: "new", color: "#fff", order: 1, is_closed: false, project: 1 },
    ]);
  }),

  http.get("*/api/v1/points", () => {
    return HttpResponse.json([{ id: 60, name: "3", order: 1 }]);
  }),

  http.get("*/api/v1/wiki", () => {
    return HttpResponse.json([{ id: 1, slug: "home", project: 1, content: "# Home", version: 1 }]);
  }),

  http.post("*/api/v1/wiki", async ({ request }) => {
    const body = (await request.json()) as { slug: string; content: string; project: number };
    return HttpResponse.json({ id: 2, version: 1, ...body });
  }),

  http.get("*/api/v1/wiki-links", () => HttpResponse.json([])),

  http.get("*/api/v1/webhooks", () => {
    return HttpResponse.json([{ id: 1, project: 1, name: "CI", url: "https://hook.test", key: "secret" }]);
  }),

  http.post("*/api/v1/webhooks", async ({ request }) => {
    const body = (await request.json()) as { name: string; url: string; key: string; project: number };
    return HttpResponse.json({ id: 2, ...body });
  }),

  http.post("*/api/v1/webhooks/:id/test", () => HttpResponse.json({ ok: true })),
];
