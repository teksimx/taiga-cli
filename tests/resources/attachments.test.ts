import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { describe, expect, it } from "vitest";
import { TaigaClient } from "../../src/lib/client.js";
import { AttachmentsResource } from "../../src/lib/resources/attachments.js";

const attachments = new AttachmentsResource(
  new TaigaClient({ baseUrl: "https://api.taiga.io", authToken: "test-token" }),
);

describe("AttachmentsResource", () => {
  it("uploads a file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "taiga-cli-"));
    const filePath = join(dir, "note.txt");
    writeFileSync(filePath, "hello");

    const uploaded = await attachments.upload("user-story", 100, 1, filePath);
    expect(uploaded.name).toBe("file.txt");
  });
});
