import type {
  ClaudeSettings,
  EnabledPlugins,
  EnvVars,
} from "@/renderer/components/settings/settings-types";

describe("Settings Types", () => {
  it("should support env vars with all Claude Code environment variables", () => {
    const env: EnvVars = {
      ANTHROPIC_AUTH_TOKEN: "test-token",
      ANTHROPIC_BASE_URL: "https://api.test.com",
      API_TIMEOUT_MS: "3000000",
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-4.5-air",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-4.7",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "glm-4.7",
    };

    expect(env.ANTHROPIC_AUTH_TOKEN).toBe("test-token");
  });

  it("should support enabled plugins map", () => {
    const plugins: EnabledPlugins = {
      "ralph-wiggum@claude-code-plugins": true,
      "rust-analyzer-lsp@claude-plugins-official": true,
      "superpowers@superpowers-marketplace": true,
    };

    expect(plugins["superpowers@superpowers-marketplace"]).toBe(true);
  });

  it("should support complete settings structure", () => {
    const settings: ClaudeSettings = {
      env: {
        ANTHROPIC_AUTH_TOKEN: "token",
      },
      permissions: {
        allow: ["Bash(cat:*)"],
        deny: ["Bash(rm -rf:*)"],
      },
      mcpServers: {
        "test-server": {
          command: "node",
          args: ["server.js"],
        },
      },
      hooks: {
        "user-prompt-submit": [
          { type: "user-prompt", command: 'echo "starting"' },
        ],
      },
      enabledPlugins: {
        "test-plugin": true,
      },
      alwaysThinkingEnabled: false,
    };

    expect(settings.env?.ANTHROPIC_AUTH_TOKEN).toBe("token");
    expect(settings.alwaysThinkingEnabled).toBe(false);
  });
});
