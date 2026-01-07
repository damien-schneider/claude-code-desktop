/**
 * Pragmatic tests for configStore
 * Tests Zustand store state management and actions
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  type AgentConfig,
  type HookConfig,
  type RuleConfig,
  type SettingsConfig,
  type SkillConfig,
  useConfigStore,
} from "@/renderer/stores/configStore";

describe("ConfigStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useConfigStore.getState().resetConfigs();
  });

  describe("Initial State", () => {
    it("should have empty initial state", () => {
      const state = useConfigStore.getState();

      expect(state.hooks).toEqual([]);
      expect(state.rules).toEqual([]);
      expect(state.skills).toEqual([]);
      expect(state.agents).toEqual([]);
      expect(state.settings.theme).toBe("system");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("Hooks", () => {
    it("should set hooks", () => {
      const hooks: HookConfig[] = [
        { name: "hook1", enabled: true, content: "test" },
        { name: "hook2", enabled: false, content: "test2" },
      ];

      useConfigStore.getState().setHooks(hooks);

      expect(useConfigStore.getState().hooks).toEqual(hooks);
    });

    it("should update existing hook", () => {
      const hooks: HookConfig[] = [
        { name: "hook1", enabled: true, content: "test" },
      ];
      useConfigStore.getState().setHooks(hooks);

      useConfigStore.getState().updateHook("hook1", { enabled: false });

      expect(useConfigStore.getState().hooks[0].enabled).toBe(false);
      expect(useConfigStore.getState().hooks[0].content).toBe("test");
    });

    it("should add new hook", () => {
      const newHook: HookConfig = {
        name: "new-hook",
        enabled: true,
        content: "content",
      };

      useConfigStore.getState().addHook(newHook);

      expect(useConfigStore.getState().hooks).toHaveLength(1);
      expect(useConfigStore.getState().hooks[0]).toEqual(newHook);
    });

    it("should delete hook by name", () => {
      const hooks: HookConfig[] = [
        { name: "hook1", enabled: true, content: "test" },
        { name: "hook2", enabled: false, content: "test2" },
      ];
      useConfigStore.getState().setHooks(hooks);

      useConfigStore.getState().deleteHook("hook1");

      expect(useConfigStore.getState().hooks).toHaveLength(1);
      expect(useConfigStore.getState().hooks[0].name).toBe("hook2");
    });
  });

  describe("Rules", () => {
    it("should set rules", () => {
      const rules: RuleConfig[] = [
        { name: "rule1", enabled: true, content: "test" },
        { name: "rule2", enabled: false, content: "test2" },
      ];

      useConfigStore.getState().setRules(rules);

      expect(useConfigStore.getState().rules).toEqual(rules);
    });

    it("should update existing rule", () => {
      const rules: RuleConfig[] = [
        { name: "rule1", enabled: true, content: "test" },
      ];
      useConfigStore.getState().setRules(rules);

      useConfigStore.getState().updateRule("rule1", { enabled: false });

      expect(useConfigStore.getState().rules[0].enabled).toBe(false);
    });

    it("should add new rule", () => {
      const newRule: RuleConfig = {
        name: "new-rule",
        enabled: true,
        content: "content",
      };

      useConfigStore.getState().addRule(newRule);

      expect(useConfigStore.getState().rules).toHaveLength(1);
    });

    it("should delete rule by name", () => {
      const rules: RuleConfig[] = [
        { name: "rule1", enabled: true, content: "test" },
        { name: "rule2", enabled: false, content: "test2" },
      ];
      useConfigStore.getState().setRules(rules);

      useConfigStore.getState().deleteRule("rule1");

      expect(useConfigStore.getState().rules).toHaveLength(1);
    });
  });

  describe("Skills", () => {
    it("should set skills", () => {
      const skills: SkillConfig[] = [
        { name: "skill1", description: "test", content: "content" },
      ];

      useConfigStore.getState().setSkills(skills);

      expect(useConfigStore.getState().skills).toEqual(skills);
    });

    it("should update existing skill", () => {
      const skills: SkillConfig[] = [
        { name: "skill1", description: "test", content: "content" },
      ];
      useConfigStore.getState().setSkills(skills);

      useConfigStore.getState().updateSkill("skill1", {
        description: "updated",
      });

      expect(useConfigStore.getState().skills[0].description).toBe("updated");
    });

    it("should add new skill", () => {
      const newSkill: SkillConfig = {
        name: "new-skill",
        description: "desc",
        content: "content",
      };

      useConfigStore.getState().addSkill(newSkill);

      expect(useConfigStore.getState().skills).toHaveLength(1);
    });

    it("should delete skill by name", () => {
      const skills: SkillConfig[] = [
        { name: "skill1", description: "test", content: "content" },
        { name: "skill2", description: "test2", content: "content2" },
      ];
      useConfigStore.getState().setSkills(skills);

      useConfigStore.getState().deleteSkill("skill1");

      expect(useConfigStore.getState().skills).toHaveLength(1);
    });
  });

  describe("Agents", () => {
    it("should set agents", () => {
      const agents: AgentConfig[] = [
        { name: "agent1", command: "cmd", args: [], enabled: true },
      ];

      useConfigStore.getState().setAgents(agents);

      expect(useConfigStore.getState().agents).toEqual(agents);
    });

    it("should update existing agent", () => {
      const agents: AgentConfig[] = [
        { name: "agent1", command: "cmd", args: [], enabled: true },
      ];
      useConfigStore.getState().setAgents(agents);

      useConfigStore.getState().updateAgent("agent1", { enabled: false });

      expect(useConfigStore.getState().agents[0].enabled).toBe(false);
    });

    it("should add new agent", () => {
      const newAgent: AgentConfig = {
        name: "new-agent",
        command: "command",
        args: ["-arg"],
        enabled: true,
      };

      useConfigStore.getState().addAgent(newAgent);

      expect(useConfigStore.getState().agents).toHaveLength(1);
    });

    it("should delete agent by name", () => {
      const agents: AgentConfig[] = [
        { name: "agent1", command: "cmd", args: [], enabled: true },
        { name: "agent2", command: "cmd2", args: [], enabled: false },
      ];
      useConfigStore.getState().setAgents(agents);

      useConfigStore.getState().deleteAgent("agent1");

      expect(useConfigStore.getState().agents).toHaveLength(1);
    });
  });

  describe("Settings", () => {
    it("should set settings", () => {
      const settings: SettingsConfig = {
        allowedTools: ["read", "write"],
        modelPreferences: { model: "opus" },
        theme: "dark",
      };

      useConfigStore.getState().setSettings(settings);

      expect(useConfigStore.getState().settings).toEqual(settings);
    });

    it("should update theme", () => {
      useConfigStore.getState().setSettings({
        allowedTools: [],
        modelPreferences: {},
        theme: "light",
      });

      expect(useConfigStore.getState().settings.theme).toBe("light");
    });
  });

  describe("Loading and Error States", () => {
    it("should set loading state", () => {
      useConfigStore.getState().setLoading(true);

      expect(useConfigStore.getState().isLoading).toBe(true);

      useConfigStore.getState().setLoading(false);

      expect(useConfigStore.getState().isLoading).toBe(false);
    });

    it("should set error", () => {
      useConfigStore.getState().setError("Test error");

      expect(useConfigStore.getState().error).toBe("Test error");

      useConfigStore.getState().setError(null);

      expect(useConfigStore.getState().error).toBeNull();
    });
  });

  describe("Reset", () => {
    it("should reset all configs to default", () => {
      const hooks: HookConfig[] = [
        { name: "hook1", enabled: true, content: "test" },
      ];
      useConfigStore.getState().setHooks(hooks);
      useConfigStore.getState().setLoading(true);
      useConfigStore.getState().setError("error");

      useConfigStore.getState().resetConfigs();

      expect(useConfigStore.getState().hooks).toEqual([]);
      expect(useConfigStore.getState().rules).toEqual([]);
      expect(useConfigStore.getState().skills).toEqual([]);
      expect(useConfigStore.getState().agents).toEqual([]);
      expect(useConfigStore.getState().settings.theme).toBe("system");
      expect(useConfigStore.getState().isLoading).toBe(false);
      expect(useConfigStore.getState().error).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle updating non-existent hook", () => {
      useConfigStore.getState().updateHook("non-existent", { enabled: false });

      expect(useConfigStore.getState().hooks).toEqual([]);
    });

    it("should handle deleting non-existent hook", () => {
      useConfigStore.getState().deleteHook("non-existent");

      expect(useConfigStore.getState().hooks).toEqual([]);
    });

    it("should handle empty arrays", () => {
      useConfigStore.getState().setHooks([]);
      useConfigStore.getState().setRules([]);
      useConfigStore.getState().setSkills([]);
      useConfigStore.getState().setAgents([]);

      expect(useConfigStore.getState().hooks).toEqual([]);
      expect(useConfigStore.getState().rules).toEqual([]);
      expect(useConfigStore.getState().skills).toEqual([]);
      expect(useConfigStore.getState().agents).toEqual([]);
    });
  });
});
