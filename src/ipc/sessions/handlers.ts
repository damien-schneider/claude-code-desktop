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
interface SessionSummary {
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
      sessionFiles.map(async (file) => {
        try {
          const filePath = join(sessionDir, file);
          const content = await readFile(filePath, "utf-8");
          const lines = content.split("\n").filter(Boolean);

          if (lines.length === 0) {
            return null;
          }

          // Find the first user message for preview (skip file-history-snapshot)
          let previewMessage = "";
          let firstUserTimestamp = "";
          let lastTimestamp = "";
          let gitBranch = "";

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.timestamp) {
                if (!firstUserTimestamp && parsed.type === "user") {
                  firstUserTimestamp = parsed.timestamp;
                }
                lastTimestamp = parsed.timestamp;
              }
              if (parsed.gitBranch && !gitBranch) {
                gitBranch = parsed.gitBranch;
              }
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
                const msgContent =
                  typeof parsed.message.content === "string"
                    ? parsed.message.content
                    : JSON.stringify(parsed.message.content);
                previewMessage = msgContent.slice(0, 100);
              }
            } catch {
              // Skip invalid lines
            }
          }

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
      })
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
  .handler(async ({ input: { projectPath } }) => {
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
