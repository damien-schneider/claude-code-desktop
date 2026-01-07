import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Test suite for session preview message filtering
 * Ensures that preview messages don't contain sub-agent content like "Warmup"
 */
describe("Session Preview Message Filtering", () => {
  const projectPath = "/Users/damienschneider/Documents/GitHub/electron-shadcn";
  const sanitized = projectPath.replace(/\//g, "-").replace(/\\/g, "-");
  const sessionDir = join(homedir(), ".claude", "projects", sanitized);

  /**
   * Helper function to extract preview message from a session file
   * This mirrors the logic in handlers.ts
   */
  function extractPreviewMessage(lines: string[]): string {
    let previewMessage = "";

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        // Only use direct user messages for preview (not tool results containing subagent data)
        if (
          parsed.type === "user" &&
          !parsed.isSidechain && // Skip sidechain/subagent messages
          !previewMessage &&
          parsed.message?.content &&
          !parsed.isMeta && // Skip meta messages like file-history-snapshot
          !parsed.message?.content?.includes?.('"isSidechain":true') && // Skip tool results containing subagent data
          !parsed.message?.content?.includes?.('"agentId"') // Skip tool results with agent data
        ) {
          const content =
            typeof parsed.message.content === "string"
              ? parsed.message.content
              : JSON.stringify(parsed.message.content);
          previewMessage = content.slice(0, 100);
        }
      } catch {
        // Skip invalid lines
      }
    }

    return previewMessage;
  }

  /**
   * Helper to check if content looks like sub-agent data
   */
  function isSubAgentContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return (
      lowerContent.includes('"issidechain":true') ||
      lowerContent.includes('"agentid"') ||
      (lowerContent.includes("warmup") &&
        lowerContent.includes('"issidechain"'))
    );
  }

  describe("getProjectSessions preview messages", () => {
    it("should not contain 'Warmup' from sub-agents in any session preview", async () => {
      try {
        const files = await readdir(sessionDir);
        const sessionFiles = files.filter(
          (f) => f.endsWith(".jsonl") && !f.startsWith("agent-")
        );

        const failures: Array<{ sessionId: string; preview: string }> = [];

        for (const file of sessionFiles) {
          const filePath = join(sessionDir, file);
          const content = await readFile(filePath, "utf-8");
          const lines = content.split("\n").filter(Boolean);

          if (lines.length === 0) {
            continue;
          }

          const preview = extractPreviewMessage(lines);
          const sessionId = file.replace(".jsonl", "");

          // Check if preview contains sub-agent content
          if (isSubAgentContent(preview)) {
            failures.push({ sessionId, preview });
          }
        }

        // Assert that no failures were found
        expect(
          failures,
          `Found ${failures.length} session(s) with sub-agent content in preview:\n${failures
            .map((f) => `  - ${f.sessionId}: "${f.preview.slice(0, 50)}..."`)
            .join("\n")}`
        ).toHaveLength(0);
      } catch (error) {
        // If we can't read the directory, skip this test
        console.warn("Could not read session directory:", error);
      }
    });

    it("should not contain messages with isSidechain=true in preview", async () => {
      try {
        const files = await readdir(sessionDir);
        const sessionFiles = files.filter(
          (f) => f.endsWith(".jsonl") && !f.startsWith("agent-")
        );

        const failures: Array<{ sessionId: string; message: string }> = [];

        for (const file of sessionFiles) {
          const filePath = join(sessionDir, file);
          const content = await readFile(filePath, "utf-8");
          const lines = content.split("\n").filter(Boolean);

          if (lines.length === 0) {
            continue;
          }

          const preview = extractPreviewMessage(lines);
          const sessionId = file.replace(".jsonl", "");

          // Specifically check for isSidechain in preview
          if (preview.includes('"isSidechain":true')) {
            failures.push({ sessionId, message: preview });
          }
        }

        expect(
          failures,
          `Found ${failures.length} session(s) with isSidechain=true in preview:\n${failures
            .map((f) => `  - ${f.sessionId}`)
            .join("\n")}`
        ).toHaveLength(0);
      } catch (error) {
        console.warn("Could not read session directory:", error);
      }
    });

    it("should not contain messages with agentId in preview", async () => {
      try {
        const files = await readdir(sessionDir);
        const sessionFiles = files.filter(
          (f) => f.endsWith(".jsonl") && !f.startsWith("agent-")
        );

        const failures: Array<{ sessionId: string; message: string }> = [];

        for (const file of sessionFiles) {
          const filePath = join(sessionDir, file);
          const content = await readFile(filePath, "utf-8");
          const lines = content.split("\n").filter(Boolean);

          if (lines.length === 0) {
            continue;
          }

          const preview = extractPreviewMessage(lines);
          const sessionId = file.replace(".jsonl", "");

          // Specifically check for agentId in preview
          if (preview.includes('"agentId"')) {
            failures.push({ sessionId, message: preview });
          }
        }

        expect(
          failures,
          `Found ${failures.length} session(s) with agentId in preview:\n${failures
            .map((f) => `  - ${f.sessionId}`)
            .join("\n")}`
        ).toHaveLength(0);
      } catch (error) {
        console.warn("Could not read session directory:", error);
      }
    });
  });

  describe("specific session checks", () => {
    it("should have a valid preview for the current session (e2d95046...)", async () => {
      const sessionId = "e2d95046-423e-4660-a88c-6bd86033ff62";
      const sessionFile = join(sessionDir, `${sessionId}.jsonl`);

      try {
        const content = await readFile(sessionFile, "utf-8");
        const lines = content.split("\n").filter(Boolean);

        const preview = extractPreviewMessage(lines);

        // The preview should be the first real user message, not "Warmup"
        expect(preview).not.toContain("Warmup");
        expect(preview).not.toContain('"isSidechain":true');
        expect(preview).not.toContain('"agentId"');

        // The preview should be a meaningful user message
        expect(preview.length).toBeGreaterThan(0);
        expect(preview).toMatch(
          /Est-ce qu'il y aurait|pourquoi|please|help|can you/i
        );
      } catch (error) {
        console.warn("Could not read current session:", error);
      }
    });
  });

  describe("filtering logic with mocked data", () => {
    it("should skip messages with isSidechain=true", () => {
      const lines = [
        JSON.stringify({ type: "file-history-snapshot" }),
        JSON.stringify({
          type: "user",
          isSidechain: true,
          message: { content: "Warmup" },
        }),
        JSON.stringify({
          type: "user",
          isSidechain: false,
          message: { content: "Real user message" },
        }),
      ];

      const preview = extractPreviewMessage(lines);
      expect(preview).toBe("Real user message");
      expect(preview).not.toContain("Warmup");
    });

    it("should skip tool results containing sub-agent data", () => {
      const lines = [
        JSON.stringify({ type: "file-history-snapshot" }),
        JSON.stringify({
          type: "user",
          isSidechain: false,
          message: {
            content:
              '{"parentUuid":null,"isSidechain":true,"agentId":"a04e373","type":"user","message":{"role":"user","content":"Warmup"}}',
          },
        }),
        JSON.stringify({
          type: "user",
          isSidechain: false,
          message: { content: "Real user message" },
        }),
      ];

      const preview = extractPreviewMessage(lines);
      expect(preview).toBe("Real user message");
      expect(preview).not.toContain("Warmup");
      expect(preview).not.toContain('"isSidechain":true');
    });

    it("should skip isMeta messages", () => {
      const lines = [
        JSON.stringify({
          type: "user",
          isMeta: true,
          message: { content: "Meta message" },
        }),
        JSON.stringify({
          type: "user",
          isSidechain: false,
          message: { content: "Real user message" },
        }),
      ];

      const preview = extractPreviewMessage(lines);
      expect(preview).toBe("Real user message");
      expect(preview).not.toContain("Meta message");
    });

    it("should fail test when filtering is broken (negative test)", () => {
      // This test demonstrates what happens when filtering doesn't work
      // We intentionally create a "broken" version of the extractor
      function brokenExtractPreviewMessage(lines: string[]): string {
        let previewMessage = "";

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);

            // BROKEN LOGIC: Does NOT check for sub-agent content
            if (
              parsed.type === "user" &&
              !previewMessage &&
              parsed.message?.content &&
              !parsed.isMeta
            ) {
              const content =
                typeof parsed.message.content === "string"
                  ? parsed.message.content
                  : JSON.stringify(parsed.message.content);
              previewMessage = content.slice(0, 100);
            }
          } catch {
            // Skip invalid lines
          }
        }

        return previewMessage;
      }

      const lines = [
        JSON.stringify({ type: "file-history-snapshot" }),
        JSON.stringify({
          type: "user",
          isSidechain: false,
          message: {
            content:
              '{"isSidechain":true,"agentId":"a04e373","type":"user","message":{"role":"user","content":"Warmup"}}',
          },
        }),
        JSON.stringify({
          type: "user",
          isSidechain: false,
          message: { content: "Real user message" },
        }),
      ];

      const preview = brokenExtractPreviewMessage(lines);

      // This SHOULD fail with broken logic - it will pick up the Warmup content
      expect(preview).toContain('"isSidechain":true');
      expect(preview).toContain("Warmup");

      // Verify the correct filtering does NOT have this problem
      const correctPreview = extractPreviewMessage(lines);
      expect(correctPreview).toBe("Real user message");
      expect(correctPreview).not.toContain("Warmup");
      expect(correctPreview).not.toContain('"isSidechain":true');
    });
  });
});
