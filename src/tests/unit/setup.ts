import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock the IPC module to provide test doubles
vi.mock("@/ipc/manager", () => ({
  ipc: {
    client: {
      app: {
        getHomePath: vi.fn().mockResolvedValue("/Users/test/home"),
        getAppPath: vi.fn().mockResolvedValue("/app/path"),
        getVersions: vi.fn().mockResolvedValue({
          cli: "1.0.0",
          desktop: "1.0.0",
        }),
      },
      claude: {
        readClaudeDirectory: vi.fn().mockResolvedValue({
          files: [],
        }),
        readSessionFile: vi.fn().mockResolvedValue(null),
      },
      mcp: {
        listServers: vi.fn().mockResolvedValue([]),
      },
      theme: {
        getCurrentThemeMode: vi.fn().mockResolvedValue("light"),
        setThemeMode: vi.fn().mockResolvedValue(undefined),
        toggleThemeMode: vi.fn().mockResolvedValue(true),
      },
      scanner: {
        scanProjects: vi.fn().mockResolvedValue({
          projects: [],
          scanned: 0,
          errors: [],
        }),
      },
      sessions: {
        getProjectSessions: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));
