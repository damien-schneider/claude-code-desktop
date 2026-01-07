// Jotai atoms (preferred for new code)

// Zustand stores (legacy, will be phased out)
export { deduplicateProjects, useAppStore } from "./app-store";
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
// Chat atoms
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
export {
  type AgentConfig,
  type HookConfig,
  type RuleConfig,
  type SettingsConfig,
  type SkillConfig,
  useConfigStore,
} from "./config-store";
