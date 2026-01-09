// =============================================================================
// Jotai atoms (preferred for new code)
// =============================================================================

// =============================================================================
// Utilities
// =============================================================================
export { deduplicateProjects } from "../utils/projects";
// -----------------------------------------------------------------------------
// Core atoms (app mode, navigation, projects, favorites)
// -----------------------------------------------------------------------------
export {
  type AppMode,
  activePathAtom,
  // App mode
  appModeAtom,
  type ClaudeProject,
  // Navigation & selection
  currentViewAtom,
  // Favorites
  favoritePathsAtom,
  filteredProjectsAtom,
  homePathAtom,
  homePathInitializedAtom,
  homePathLoadingAtom,
  initializeHomePathAtom,
  isGlobalSettingsSelectedAtom,
  isScanningAtom,
  type NavigationView,
  // Projects
  projectsAtom,
  scanProjectsAtom,
  searchQueryAtom,
  selectedProjectIdAtom,
  selectGlobalSettingsAtom,
  selectProjectAtom,
  setAppModeAtom,
  setCurrentViewAtom,
  setHomePathAtom,
  // Actions
  setProjectsAtom,
  setSearchQueryAtom,
  setShowFavoritesOnlyAtom,
  showFavoritesOnlyAtom,
  toggleFavoriteAtom,
} from "./atoms";
// -----------------------------------------------------------------------------
// Chat atoms (sessions, messages, streaming, Claude availability)
// -----------------------------------------------------------------------------
export {
  type ActiveSession,
  // Active process
  activeProcessIdAtom,
  // Active sessions (real-time, not yet persisted)
  activeSessionsAtom,
  allSessionsAtom,
  type ClaudeAvailability,
  type CompletionStatus,
  checkClaudeAvailabilityAtom,
  // Claude availability
  claudeAvailabilityAtom,
  completionStatusAtom,
  // Current session
  currentSessionIdAtom,
  currentSessionLoadingAtom,
  currentSessionMessagesAtom,
  filteredSessionsAtom,
  // Helper functions
  formatMessageContent,
  isSessionStreamingAtom,
  isStreamingAtom,
  isThinkingAtom,
  lastQueryCostAtom,
  loadSessionDetailsAtom,
  // Actions
  loadSessionsAtom,
  // Permission modes
  type PermissionMode,
  type ResumeSessionOptions,
  resumeSessionAtom,
  type SessionFilter,
  type SessionMessage,
  type SessionMessageContent,
  // Types
  type SessionSummary,
  selectedProjectForSessionsAtom,
  sendMessageAtom,
  // Filtering
  sessionFilterAtom,
  sessionSearchQueryAtom,
  // Session state
  sessionsAtom,
  sessionsErrorAtom,
  sessionsLoadingAtom,
  startNewSessionAtom,
  stopSessionAtom,
  // Streaming UI state
  streamingErrorAtom,
  streamingMessageAtom,
  thinkingStartTimeAtom,
} from "./chat-atoms";
// -----------------------------------------------------------------------------
// Config atoms (rules, skills, agents, hooks)
// -----------------------------------------------------------------------------
export {
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
} from "./config-atoms";
// -----------------------------------------------------------------------------
// UI state atoms (sidebar, collapsible sections, dialogs)
// -----------------------------------------------------------------------------
export {
  leftSidebarCollapsedAtom,
  projectsSectionOpenAtom,
  quickOpenDialogOpenAtom,
  settingsSectionOpenAtom,
} from "./ui-atoms";
