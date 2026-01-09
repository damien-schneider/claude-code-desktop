/**
 * Pragmatic tests for config atoms
 * Tests Jotai atom state management and actions
 */

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";
import {
  type AgentConfig,
  addAgentAtom,
  addHookAtom,
  addRuleAtom,
  addSkillAtom,
  agentsAtom,
  configErrorAtom,
  configLoadingAtom,
  deleteAgentAtom,
  deleteHookAtom,
  deleteRuleAtom,
  deleteSkillAtom,
  type HookConfig,
  hooksAtom,
  type RuleConfig,
  resetConfigsAtom,
  rulesAtom,
  type SkillConfig,
  setAgentsAtom,
  setHooksAtom,
  setRulesAtom,
  setSkillsAtom,
  skillsAtom,
  updateAgentAtom,
  updateHookAtom,
  updateRuleAtom,
  updateSkillAtom,
} from "@/renderer/stores/config-atoms";

describe("Config Atoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    // Create fresh store for each test
    store = createStore();
    // Reset configs before each test
    store.set(resetConfigsAtom);
  });

  describe("Initial State", () => {
    it("should have empty initial state", () => {
      expect(store.get(hooksAtom)).toEqual([]);
      expect(store.get(rulesAtom)).toEqual([]);
      expect(store.get(skillsAtom)).toEqual([]);
      expect(store.get(agentsAtom)).toEqual([]);
      expect(store.get(configLoadingAtom)).toBe(false);
      expect(store.get(configErrorAtom)).toBeNull();
    });
  });

  describe("Hooks", () => {
    it("should set hooks", () => {
      const hooks: HookConfig[] = [
        { name: "hook1", enabled: true, content: "test" },
        { name: "hook2", enabled: false, content: "test2" },
      ];

      store.set(setHooksAtom, hooks);

      expect(store.get(hooksAtom)).toEqual(hooks);
    });

    it("should update existing hook", () => {
      const hooks: HookConfig[] = [
        { name: "hook1", enabled: true, content: "test" },
      ];
      store.set(setHooksAtom, hooks);

      store.set(updateHookAtom, { name: "hook1", hook: { enabled: false } });

      expect(store.get(hooksAtom)[0].enabled).toBe(false);
      expect(store.get(hooksAtom)[0].content).toBe("test");
    });

    it("should add new hook", () => {
      const newHook: HookConfig = {
        name: "new-hook",
        enabled: true,
        content: "content",
      };

      store.set(addHookAtom, newHook);

      expect(store.get(hooksAtom)).toHaveLength(1);
      expect(store.get(hooksAtom)[0]).toEqual(newHook);
    });

    it("should delete hook by name", () => {
      const hooks: HookConfig[] = [
        { name: "hook1", enabled: true, content: "test" },
        { name: "hook2", enabled: false, content: "test2" },
      ];
      store.set(setHooksAtom, hooks);

      store.set(deleteHookAtom, "hook1");

      expect(store.get(hooksAtom)).toHaveLength(1);
      expect(store.get(hooksAtom)[0].name).toBe("hook2");
    });
  });

  describe("Rules", () => {
    it("should set rules", () => {
      const rules: RuleConfig[] = [
        { name: "rule1", enabled: true, content: "test" },
        { name: "rule2", enabled: false, content: "test2" },
      ];

      store.set(setRulesAtom, rules);

      expect(store.get(rulesAtom)).toEqual(rules);
    });

    it("should update existing rule", () => {
      const rules: RuleConfig[] = [
        { name: "rule1", enabled: true, content: "test" },
      ];
      store.set(setRulesAtom, rules);

      store.set(updateRuleAtom, { name: "rule1", rule: { enabled: false } });

      expect(store.get(rulesAtom)[0].enabled).toBe(false);
    });

    it("should add new rule", () => {
      const newRule: RuleConfig = {
        name: "new-rule",
        enabled: true,
        content: "content",
      };

      store.set(addRuleAtom, newRule);

      expect(store.get(rulesAtom)).toHaveLength(1);
    });

    it("should delete rule by name", () => {
      const rules: RuleConfig[] = [
        { name: "rule1", enabled: true, content: "test" },
        { name: "rule2", enabled: false, content: "test2" },
      ];
      store.set(setRulesAtom, rules);

      store.set(deleteRuleAtom, "rule1");

      expect(store.get(rulesAtom)).toHaveLength(1);
    });
  });

  describe("Skills", () => {
    it("should set skills", () => {
      const skills: SkillConfig[] = [
        { name: "skill1", description: "test", content: "content" },
      ];

      store.set(setSkillsAtom, skills);

      expect(store.get(skillsAtom)).toEqual(skills);
    });

    it("should update existing skill", () => {
      const skills: SkillConfig[] = [
        { name: "skill1", description: "test", content: "content" },
      ];
      store.set(setSkillsAtom, skills);

      store.set(updateSkillAtom, {
        name: "skill1",
        skill: { description: "updated" },
      });

      expect(store.get(skillsAtom)[0].description).toBe("updated");
    });

    it("should add new skill", () => {
      const newSkill: SkillConfig = {
        name: "new-skill",
        description: "desc",
        content: "content",
      };

      store.set(addSkillAtom, newSkill);

      expect(store.get(skillsAtom)).toHaveLength(1);
    });

    it("should delete skill by name", () => {
      const skills: SkillConfig[] = [
        { name: "skill1", description: "test", content: "content" },
        { name: "skill2", description: "test2", content: "content2" },
      ];
      store.set(setSkillsAtom, skills);

      store.set(deleteSkillAtom, "skill1");

      expect(store.get(skillsAtom)).toHaveLength(1);
    });
  });

  describe("Agents", () => {
    it("should set agents", () => {
      const agents: AgentConfig[] = [
        { name: "agent1", command: "cmd", args: [], enabled: true },
      ];

      store.set(setAgentsAtom, agents);

      expect(store.get(agentsAtom)).toEqual(agents);
    });

    it("should update existing agent", () => {
      const agents: AgentConfig[] = [
        { name: "agent1", command: "cmd", args: [], enabled: true },
      ];
      store.set(setAgentsAtom, agents);

      store.set(updateAgentAtom, { name: "agent1", agent: { enabled: false } });

      expect(store.get(agentsAtom)[0].enabled).toBe(false);
    });

    it("should add new agent", () => {
      const newAgent: AgentConfig = {
        name: "new-agent",
        command: "command",
        args: ["-arg"],
        enabled: true,
      };

      store.set(addAgentAtom, newAgent);

      expect(store.get(agentsAtom)).toHaveLength(1);
    });

    it("should delete agent by name", () => {
      const agents: AgentConfig[] = [
        { name: "agent1", command: "cmd", args: [], enabled: true },
        { name: "agent2", command: "cmd2", args: [], enabled: false },
      ];
      store.set(setAgentsAtom, agents);

      store.set(deleteAgentAtom, "agent1");

      expect(store.get(agentsAtom)).toHaveLength(1);
    });
  });

  describe("Loading and Error States", () => {
    it("should set loading state", () => {
      store.set(configLoadingAtom, true);

      expect(store.get(configLoadingAtom)).toBe(true);

      store.set(configLoadingAtom, false);

      expect(store.get(configLoadingAtom)).toBe(false);
    });

    it("should set error", () => {
      store.set(configErrorAtom, "Test error");

      expect(store.get(configErrorAtom)).toBe("Test error");

      store.set(configErrorAtom, null);

      expect(store.get(configErrorAtom)).toBeNull();
    });
  });

  describe("Reset", () => {
    it("should reset all configs to default", () => {
      const hooks: HookConfig[] = [
        { name: "hook1", enabled: true, content: "test" },
      ];
      store.set(setHooksAtom, hooks);
      store.set(configLoadingAtom, true);
      store.set(configErrorAtom, "error");

      store.set(resetConfigsAtom);

      expect(store.get(hooksAtom)).toEqual([]);
      expect(store.get(rulesAtom)).toEqual([]);
      expect(store.get(skillsAtom)).toEqual([]);
      expect(store.get(agentsAtom)).toEqual([]);
      expect(store.get(configLoadingAtom)).toBe(false);
      expect(store.get(configErrorAtom)).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle updating non-existent hook", () => {
      store.set(updateHookAtom, {
        name: "non-existent",
        hook: { enabled: false },
      });

      expect(store.get(hooksAtom)).toEqual([]);
    });

    it("should handle deleting non-existent hook", () => {
      store.set(deleteHookAtom, "non-existent");

      expect(store.get(hooksAtom)).toEqual([]);
    });

    it("should handle empty arrays", () => {
      store.set(setHooksAtom, []);
      store.set(setRulesAtom, []);
      store.set(setSkillsAtom, []);
      store.set(setAgentsAtom, []);

      expect(store.get(hooksAtom)).toEqual([]);
      expect(store.get(rulesAtom)).toEqual([]);
      expect(store.get(skillsAtom)).toEqual([]);
      expect(store.get(agentsAtom)).toEqual([]);
    });
  });
});
