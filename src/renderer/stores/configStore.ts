import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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

export interface SettingsConfig {
  allowedTools: string[];
  modelPreferences: Record<string, string>;
  theme: 'light' | 'dark' | 'system';
}

interface ConfigState {
  // Configs for current selected project/main config
  hooks: HookConfig[];
  rules: RuleConfig[];
  skills: SkillConfig[];
  agents: AgentConfig[];
  settings: SettingsConfig;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setHooks: (hooks: HookConfig[]) => void;
  updateHook: (name: string, hook: Partial<HookConfig>) => void;
  addHook: (hook: HookConfig) => void;
  deleteHook: (name: string) => void;

  setRules: (rules: RuleConfig[]) => void;
  updateRule: (name: string, rule: Partial<RuleConfig>) => void;
  addRule: (rule: RuleConfig) => void;
  deleteRule: (name: string) => void;

  setSkills: (skills: SkillConfig[]) => void;
  updateSkill: (name: string, skill: Partial<SkillConfig>) => void;
  addSkill: (skill: SkillConfig) => void;
  deleteSkill: (name: string) => void;

  setAgents: (agents: AgentConfig[]) => void;
  updateAgent: (name: string, agent: Partial<AgentConfig>) => void;
  addAgent: (agent: AgentConfig) => void;
  deleteAgent: (name: string) => void;

  setSettings: (settings: SettingsConfig) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  resetConfigs: () => void;
}

const defaultSettings: SettingsConfig = {
  allowedTools: [],
  modelPreferences: {},
  theme: 'system',
};

export const useConfigStore = create<ConfigState>()(
  devtools(
    (set) => ({
      // Initial state
      hooks: [],
      rules: [],
      skills: [],
      agents: [],
      settings: defaultSettings,
      isLoading: false,
      error: null,

      // Hook actions
      setHooks: (hooks) => set({ hooks }),
      updateHook: (name, hook) =>
        set((state) => ({
          hooks: state.hooks.map((h) =>
            h.name === name ? { ...h, ...hook } : h
          ),
        })),
      addHook: (hook) =>
        set((state) => ({ hooks: [...state.hooks, hook] })),
      deleteHook: (name) =>
        set((state) => ({
          hooks: state.hooks.filter((h) => h.name !== name),
        })),

      // Rule actions
      setRules: (rules) => set({ rules }),
      updateRule: (name, rule) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.name === name ? { ...r, ...rule } : r
          ),
        })),
      addRule: (rule) =>
        set((state) => ({ rules: [...state.rules, rule] })),
      deleteRule: (name) =>
        set((state) => ({
          rules: state.rules.filter((r) => r.name !== name),
        })),

      // Skill actions
      setSkills: (skills) => set({ skills }),
      updateSkill: (name, skill) =>
        set((state) => ({
          skills: state.skills.map((s) =>
            s.name === name ? { ...s, ...skill } : s
          ),
        })),
      addSkill: (skill) =>
        set((state) => ({ skills: [...state.skills, skill] })),
      deleteSkill: (name) =>
        set((state) => ({
          skills: state.skills.filter((s) => s.name !== name),
        })),

      // Agent actions
      setAgents: (agents) => set({ agents }),
      updateAgent: (name, agent) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.name === name ? { ...a, ...agent } : a
          ),
        })),
      addAgent: (agent) =>
        set((state) => ({ agents: [...state.agents, agent] })),
      deleteAgent: (name) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.name !== name),
        })),

      // Settings actions
      setSettings: (settings) => set({ settings }),

      // Loading and error
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Reset
      resetConfigs: () =>
        set({
          hooks: [],
          rules: [],
          skills: [],
          agents: [],
          settings: defaultSettings,
          isLoading: false,
          error: null,
        }),
    }),
    { name: 'ClaudeCodeManagerConfig' }
  )
);
