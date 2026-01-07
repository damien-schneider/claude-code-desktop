import { constants } from "node:fs";
import { access, readdir, readFile, stat, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { os } from "@orpc/server";
import { z } from "zod";

/**
 * Session metadata from history.jsonl
 */
interface SessionHistoryEntry {
  sessionId: string;
  projectPath: string;
  display?: string;
}

/**
 * Get all user sessions from history.jsonl with their project paths
 * This is the source of truth for session → projectPath mapping
 * Also filters out subagent/warmup sessions
 */
async function getSessionsFromHistory(): Promise<
  Map<string, SessionHistoryEntry>
> {
  const historyFile = join(homedir(), ".claude", "history.jsonl");

  try {
    const content = await readFile(historyFile, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    const sessions = new Map<string, SessionHistoryEntry>();

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        // Skip entries that look like sub-agent content
        if (parsed.display) {
          const displayLower = parsed.display.toLowerCase();

          // Skip if display contains isSidechain or agentId markers
          if (
            displayLower.includes('"issidechain":true') ||
            displayLower.includes('"agentid"') ||
            displayLower.includes('"issidechain"') ||
            displayLower.includes('"agentid"')
          ) {
            continue;
          }
        }

        if (parsed.sessionId && parsed.project) {
          sessions.set(parsed.sessionId, {
            sessionId: parsed.sessionId,
            projectPath: parsed.project,
            display: parsed.display,
          });
        }
      } catch {
        // Skip invalid lines
      }
    }

    return sessions;
  } catch (error) {
    console.error("[getSessionsFromHistory] Failed to read history:", error);
    return new Map();
  }
}

/**
 * Get all user session IDs from history.jsonl (for backwards compatibility)
 */
async function getUserSessionIds(): Promise<Set<string>> {
  const sessions = await getSessionsFromHistory();
  return new Set(sessions.keys());
}

/**
 * Get all unique project paths from history.jsonl
 */
async function getProjectPathsFromHistory(): Promise<Set<string>> {
  const sessions = await getSessionsFromHistory();
  const paths = new Set<string>();
  for (const entry of sessions.values()) {
    paths.add(entry.projectPath);
  }
  return paths;
}

/**
 * List all session directories in ~/.claude/projects/
 * Returns sanitized directory names (with slashes replaced by dashes)
 */
export const listSessionDirectories = os.handler(async () => {
  const sessionsDir = join(homedir(), ".claude", "projects");

  try {
    const dirs = await readdir(sessionsDir, { withFileTypes: true });
    return dirs.filter((d) => d.isDirectory()).map((d) => d.name);
  } catch (error) {
    // Directory doesn't exist yet
    console.error("[listSessionDirectories] Error:", error);
    return [];
  }
});

/**
 * Session summary type for internal use
 */
export interface SessionSummary {
  sessionId: string;
  projectPath: string;
  projectName: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  gitBranch?: string;
  previewMessage?: string;
}

/**
 * Extract message content safely
 */
function extractMessageContent(message: unknown): string | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const msg = message as {
    content?: unknown;
    isSidechain?: boolean;
    isMeta?: boolean;
  };

  // Skip sidechain/subagent messages
  if (msg.isSidechain || msg.isMeta) {
    return null;
  }

  if (!msg.content) {
    return null;
  }

  // Convert to string
  const content =
    typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);

  // Skip tool results containing subagent data
  if (content.includes('"isSidechain":true') || content.includes('"agentId"')) {
    return null;
  }

  return content.slice(0, 100);
}

/**
 * Parse session lines to extract metadata
 */
function parseSessionLines(lines: string[]): {
  previewMessage: string;
  firstUserTimestamp: string;
  lastTimestamp: string;
  gitBranch: string;
} {
  let previewMessage = "";
  let firstUserTimestamp = "";
  let lastTimestamp = "";
  let gitBranch = "";

  for (const line of lines) {
    const parsed = tryParseLine(line);
    if (!parsed) {
      continue;
    }

    updateTimestamps(parsed, firstUserTimestamp, (timestamp) => {
      if (!firstUserTimestamp) {
        firstUserTimestamp = timestamp;
      }
    });
    lastTimestamp = parsed.timestamp || lastTimestamp;

    if (!gitBranch && parsed.gitBranch) {
      gitBranch = parsed.gitBranch;
    }

    if (!previewMessage && shouldExtractPreview(parsed)) {
      previewMessage = extractMessageContent(parsed.message) || "";
    }
  }

  return { previewMessage, firstUserTimestamp, lastTimestamp, gitBranch };
}

/**
 * Try to parse a JSON line, returning null on failure
 */
function tryParseLine(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Update first user timestamp if this is a user message with timestamp
 */
function updateTimestamps(
  parsed: Record<string, unknown>,
  firstUserTimestamp: string,
  setFirstTimestamp: (timestamp: string) => void
): void {
  if (parsed.timestamp && !firstUserTimestamp && parsed.type === "user") {
    setFirstTimestamp(parsed.timestamp as string);
  }
}

/**
 * Check if this line should be used for preview message
 */
function shouldExtractPreview(parsed: Record<string, unknown>): boolean {
  return (
    parsed.type === "user" &&
    !!parsed.message?.content &&
    typeof parsed.message === "object"
  );
}

/**
 * Parse a single session file to extract metadata
 */
async function parseSessionFile(
  sessionDir: string,
  file: string,
  projectPath: string
): Promise<SessionSummary | null> {
  try {
    const filePath = join(sessionDir, file);
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n").filter(Boolean);

    if (lines.length === 0) {
      return null;
    }

    const { previewMessage, firstUserTimestamp, lastTimestamp, gitBranch } =
      parseSessionLines(lines);

    const sessionId = file.replace(".jsonl", "");
    const fileStat = await stat(filePath);

    // Use fileStat.mtime for lastMessageAt if no valid timestamp found
    const fallbackTimestamp = fileStat.mtime.toISOString();
    const result: SessionSummary = {
      sessionId,
      projectPath,
      projectName:
        projectPath.split("/").pop() ||
        projectPath.split("\\").pop() ||
        projectPath,
      createdAt:
        firstUserTimestamp ||
        fileStat.birthtime.toISOString() ||
        new Date(0).toISOString(),
      lastMessageAt: lastTimestamp || fallbackTimestamp,
      messageCount: lines.length,
    };

    // Only add optional fields if they have values
    if (gitBranch) {
      result.gitBranch = gitBranch;
    }
    if (previewMessage) {
      result.previewMessage = previewMessage;
    }

    return result;
  } catch (error) {
    console.error(
      `[getProjectSessionsInternal] Error parsing session file ${file}:`,
      error
    );
    return null;
  }
}

/**
 * Internal function to get sessions for a project path
 * This can be called from other internal functions
 */
async function getProjectSessionsInternal(
  projectPath: string
): Promise<SessionSummary[]> {
  // Get user session IDs from history to filter out subagent/warmup sessions
  const userSessionIds = await getUserSessionIds();

  // Sanitize path to match Claude's format (replace / with -)
  const sanitized = projectPath.replace(/\//g, "-").replace(/\\/g, "-");
  const sessionDir = join(homedir(), ".claude", "projects", sanitized);

  // Check if directory exists first to avoid ENOENT errors
  try {
    await access(sessionDir, constants.F_OK);
  } catch {
    // Directory doesn't exist - this is normal for projects that were deleted
    // or for entries in history.jsonl that point to non-existent directories
    return [];
  }

  try {
    const files = await readdir(sessionDir);
    // Filter out subagent sessions (files starting with "agent-")
    // Claude Code stores main sessions as UUID.jsonl and subagent sessions as agent-{id}.jsonl
    const sessionFiles = files.filter(
      (f) => f.endsWith(".jsonl") && !f.startsWith("agent-")
    );

    // Parse metadata from each file
    const sessions = await Promise.all(
      sessionFiles.map((file) =>
        parseSessionFile(sessionDir, file, projectPath)
      )
    );

    // Filter out nulls from failed parses
    const validSessions = sessions.filter(
      (s): s is SessionSummary => s !== null
    );

    // Filter to only show sessions that appear in user history
    // This excludes subagent/warmup-only sessions
    return validSessions.filter((session) =>
      userSessionIds.has(session.sessionId)
    );
  } catch (error) {
    console.error("[getProjectSessionsInternal] Error:", error);
    return [];
  }
}

/**
 * Get all sessions for a specific project (metadata only)
 */
export const getProjectSessions = os
  .input(z.object({ projectPath: z.string() }))
  .handler(({ input: { projectPath } }) => {
    return getProjectSessionsInternal(projectPath);
  });

/**
 * Get full session history (all messages)
 */
export const getSessionDetails = os
  .input(
    z.object({
      sessionId: z.string(),
      projectPath: z.string(),
    })
  )
  .handler(async ({ input: { sessionId, projectPath } }) => {
    const sanitized = projectPath.replace(/\//g, "-").replace(/\\/g, "-");
    const sessionFile = join(
      homedir(),
      ".claude",
      "projects",
      sanitized,
      `${sessionId}.jsonl`
    );

    try {
      const content = await readFile(sessionFile, "utf-8");
      const messages = content
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((m) => m !== null);

      return { sessionId, messages };
    } catch (error) {
      console.error("[getSessionDetails] Error:", error);
      return { sessionId, messages: [] };
    }
  });

/**
 * Delete a session file
 */
export const deleteSession = os
  .input(
    z.object({
      sessionId: z.string(),
      projectPath: z.string(),
    })
  )
  .handler(async ({ input: { sessionId, projectPath } }) => {
    const sanitized = projectPath.replace(/\//g, "-").replace(/\\/g, "-");
    const sessionFile = join(
      homedir(),
      ".claude",
      "projects",
      sanitized,
      `${sessionId}.jsonl`
    );

    try {
      await unlink(sessionFile);
      return { success: true, sessionId };
    } catch (error) {
      console.error("[deleteSession] Error:", error);
      return {
        success: false,
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

/**
 * Search sessions across all projects by content
 */
export const searchSessions = os
  .input(z.object({ query: z.string() }))
  .handler(async ({ input: { query } }) => {
    if (!query.trim()) {
      return [];
    }

    try {
      // Get all project paths from history (the correct source)
      const projectPaths = await getProjectPathsFromHistory();

      // Search through all sessions
      const results: SessionSummary[] = [];
      const lowerQuery = query.toLowerCase();

      for (const projectPath of projectPaths) {
        const sessions = await getProjectSessionsInternal(projectPath);
        const matching = sessions.filter(
          (s) =>
            s.previewMessage?.toLowerCase().includes(lowerQuery) ||
            s.projectName.toLowerCase().includes(lowerQuery)
        );
        results.push(...matching);
      }

      return results;
    } catch (error) {
      console.error("[searchSessions] Error:", error);
      return [];
    }
  });

/**
 * Get all sessions from history.jsonl (the source of truth)
 * This returns sessions with their CORRECT project paths
 */
export const getAllSessions = os.handler(async () => {
  const sessionsFromHistory = await getSessionsFromHistory();

  // Group sessions by project path
  const sessionsByProject = new Map<string, string[]>();
  for (const [sessionId, entry] of sessionsFromHistory) {
    const existing = sessionsByProject.get(entry.projectPath) || [];
    existing.push(sessionId);
    sessionsByProject.set(entry.projectPath, existing);
  }

  // Load full metadata for each session
  const allSessions: SessionSummary[] = [];

  for (const [projectPath, sessionIds] of sessionsByProject) {
    try {
      const projectSessions = await getProjectSessionsInternal(projectPath);
      // Only include sessions that are in our history
      const validSessions = projectSessions.filter((s) =>
        sessionIds.includes(s.sessionId)
      );
      allSessions.push(...validSessions);
    } catch (error) {
      console.error(
        `[getAllSessions] Failed to load sessions for ${projectPath}:`,
        error
      );
    }
  }

  return allSessions;
});
