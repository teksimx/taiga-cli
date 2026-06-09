import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { NotFoundError, TaigaAPIError } from "../../src/lib/errors.js";
import { Resolver, isInternalId, parseRef } from "../../src/lib/resolver.js";
import type { TaigaProject } from "../../src/types/taiga-api.js";

const client = new TaigaClient({
  baseUrl: "https://api.taiga.io",
  authToken: "test-token",
});
const resolver = new Resolver(client);

describe("parseRef", () => {
  it("parses hash-prefixed refs", () => {
    expect(parseRef("#42")).toBe(42);
    expect(parseRef("7")).toBe(7);
  });

  it("throws NotFoundError for invalid refs", () => {
    expect(() => parseRef("abc")).toThrow(NotFoundError);
    expect(() => parseRef("#0")).toThrow(NotFoundError);
  });
});

describe("isInternalId", () => {
  it("treats large numeric ids as internal", () => {
    expect(isInternalId("1001")).toBe(true);
    expect(isInternalId("42")).toBe(false);
  });
});

describe("Resolver", () => {
  it("resolves project by slug", async () => {
    const project = await resolver.resolveProject("demo");
    expect(project.slug).toBe("demo");
  });

  it("resolves project by internal id", async () => {
    const project = await resolver.resolveProject("9999");
    expect(project.id).toBe(1);
  });

  it("throws when project slug is missing", async () => {
    await expect(resolver.resolveProject("missing")).rejects.toThrow(TaigaAPIError);
  });

  it("resolves user story by ref", async () => {
    const story = await resolver.resolveWorkItem("user-story", "1", "demo");
    expect(story.ref).toBe(1);
  });

  it("resolves user story by internal id", async () => {
    const story = await resolver.resolveWorkItem("user-story", "100", "demo");
    expect(story.id).toBe(100);
  });

  it("resolves user by username", async () => {
    const user = await resolver.resolveUser("devuser", 1);
    expect(user.id).toBe(2);
  });

  it("throws when user is not found", async () => {
    await expect(resolver.resolveUser("nobody", 1)).rejects.toThrow(NotFoundError);
  });

  it("resolves status id by name", async () => {
    const project = await resolver.resolveProject("demo");
    const statusId = await resolver.resolveStatusId(project, "new", "user-story");
    expect(statusId).toBe(10);
  });

  it("throws when status is unknown", async () => {
    const project = await resolver.resolveProject("demo");
    await expect(resolver.resolveStatusId(project, "invalid", "user-story")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("resolves named entities on project metadata", async () => {
    const project = (await resolver.resolveProject("demo")) as TaigaProject;
    expect(await resolver.resolveNamedEntity(project, "Bug", "issue_types")).toBe(30);
    expect(await resolver.resolveNamedEntity(project, "High", "priorities")).toBe(40);
  });
});
