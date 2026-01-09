import { atom } from "jotai";

// =============================================================================
// Config Types
// =============================================================================

export interface HookConfig {
  name: string;
  enabled: boolean;
  content: string;
}

export interface RuleConfig {
  name: string;
  enabled: boolean;
  content: string;
}

export interface SkillConfig {
  name: string;
  description: string;
  content: string;
}

export interface AgentConfig {
  name: string;
  command: string;
  args: string[];
  enabled: boolean;
}

// =============================================================================
// Config State Atoms
// =============================================================================

export const hooksAtom = atom<HookConfig[]>([]);

export const rulesAtom = atom<RuleConfig[]>([]);

export const skillsAtom = atom<SkillConfig[]>([]);

export const agentsAtom = atom<AgentConfig[]>([]);

// =============================================================================
// Loading & Error States
// =============================================================================

export const configLoadingAtom = atom<boolean>(false);

export const configErrorAtom = atom<string | null>(null);

// =============================================================================
// Hook Actions
// =============================================================================

export const setHooksAtom = atom(null, (_get, set, hooks: HookConfig[]) => {
  set(hooksAtom, hooks);
});

export const updateHookAtom = atom(
  null,
  (_get, set, { name, hook }: { name: string; hook: Partial<HookConfig> }) => {
    set(hooksAtom, (prev) =>
      prev.map((h) => (h.name === name ? { ...h, ...hook } : h))
    );
  }
);

export const addHookAtom = atom(null, (_get, set, hook: HookConfig) => {
  set(hooksAtom, (prev) => [...prev, hook]);
});

export const deleteHookAtom = atom(null, (_get, set, name: string) => {
  set(hooksAtom, (prev) => prev.filter((h) => h.name !== name));
});

// =============================================================================
// Rule Actions
// =============================================================================

export const setRulesAtom = atom(null, (_get, set, rules: RuleConfig[]) => {
  set(rulesAtom, rules);
});

export const updateRuleAtom = atom(
  null,
  (_get, set, { name, rule }: { name: string; rule: Partial<RuleConfig> }) => {
    set(rulesAtom, (prev) =>
      prev.map((r) => (r.name === name ? { ...r, ...rule } : r))
    );
  }
);

export const addRuleAtom = atom(null, (_get, set, rule: RuleConfig) => {
  set(rulesAtom, (prev) => [...prev, rule]);
});

export const deleteRuleAtom = atom(null, (_get, set, name: string) => {
  set(rulesAtom, (prev) => prev.filter((r) => r.name !== name));
});

// =============================================================================
// Skill Actions
// =============================================================================

export const setSkillsAtom = atom(null, (_get, set, skills: SkillConfig[]) => {
  set(skillsAtom, skills);
});

export const updateSkillAtom = atom(
  null,
  (
    _get,
    set,
    { name, skill }: { name: string; skill: Partial<SkillConfig> }
  ) => {
    set(skillsAtom, (prev) =>
      prev.map((s) => (s.name === name ? { ...s, ...skill } : s))
    );
  }
);

export const addSkillAtom = atom(null, (_get, set, skill: SkillConfig) => {
  set(skillsAtom, (prev) => [...prev, skill]);
});

export const deleteSkillAtom = atom(null, (_get, set, name: string) => {
  set(skillsAtom, (prev) => prev.filter((s) => s.name !== name));
});

// =============================================================================
// Agent Actions
// =============================================================================

export const setAgentsAtom = atom(null, (_get, set, agents: AgentConfig[]) => {
  set(agentsAtom, agents);
});

export const updateAgentAtom = atom(
  null,
  (
    _get,
    set,
    { name, agent }: { name: string; agent: Partial<AgentConfig> }
  ) => {
    set(agentsAtom, (prev) =>
      prev.map((a) => (a.name === name ? { ...a, ...agent } : a))
    );
  }
);

export const addAgentAtom = atom(null, (_get, set, agent: AgentConfig) => {
  set(agentsAtom, (prev) => [...prev, agent]);
});

export const deleteAgentAtom = atom(null, (_get, set, name: string) => {
  set(agentsAtom, (prev) => prev.filter((a) => a.name !== name));
});

// =============================================================================
// Reset Configs
// =============================================================================

export const resetConfigsAtom = atom(null, (_get, set) => {
  set(hooksAtom, []);
  set(rulesAtom, []);
  set(skillsAtom, []);
  set(agentsAtom, []);
  set(configLoadingAtom, false);
  set(configErrorAtom, null);
});
