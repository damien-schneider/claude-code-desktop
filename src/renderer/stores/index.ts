// Jotai atoms (preferred for new code)
export {
  // Navigation & selection
  currentViewAtom,
  setCurrentViewAtom,
  homePathAtom,
  setHomePathAtom,
  homePathLoadingAtom,
  homePathInitializedAtom,
  initializeHomePathAtom,
  selectedProjectIdAtom,
  isGlobalSettingsSelectedAtom,
  activePathAtom,
  // Projects
  projectsAtom,
  filteredProjectsAtom,
  type ClaudeProject,
  type NavigationView,
  // UI state
  sidebarCollapsedAtom,
  searchQueryAtom,
  showFavoritesOnlyAtom,
  showWithClaudeOnlyAtom,
  // App mode
  appModeAtom,
  setAppModeAtom,
  type AppMode,
  // Favorites
  favoritePathsAtom,
  // Actions
  setProjectsAtom,
  selectProjectAtom,
  selectGlobalSettingsAtom,
  toggleFavoriteAtom,
  setSearchQueryAtom,
  setShowFavoritesOnlyAtom,
  setShowWithClaudeOnlyAtom,
} from "./atoms";

// Chat atoms
export {
  // Session state
  sessionsAtom,
  sessionsLoadingAtom,
  sessionsErrorAtom,
  // Filtering
  sessionFilterAtom,
  selectedProjectForSessionsAtom,
  sessionSearchQueryAtom,
  filteredSessionsAtom,
  type SessionFilter,
  // Current session
  currentSessionIdAtom,
  currentSessionMessagesAtom,
  currentSessionLoadingAtom,
  // Active process
  activeProcessIdAtom,
  isStreamingAtom,
  streamingMessageAtom,
  // Streaming UI state
  streamingErrorAtom,
  isThinkingAtom,
  thinkingStartTimeAtom,
  completionStatusAtom,
  lastQueryCostAtom,
  type CompletionStatus,
  // Claude availability
  claudeAvailabilityAtom,
  checkClaudeAvailabilityAtom,
  type ClaudeAvailability,
  // Actions
  loadSessionsAtom,
  loadSessionDetailsAtom,
  startNewSessionAtom,
  sendMessageAtom,
  stopSessionAtom,
  resumeSessionAtom,
  // Permission modes
  type PermissionMode,
  type ResumeSessionOptions,
  // Types
  type SessionSummary,
  type SessionMessage,
  type SessionMessageContent,
  // Helper functions
  formatMessageContent,
} from "./chatAtoms";

// Zustand stores (legacy, will be phased out)
export { useAppStore, deduplicateProjects } from "./appStore";
export {
  useConfigStore,
  type HookConfig,
  type RuleConfig,
  type SkillConfig,
  type AgentConfig,
  type SettingsConfig,
} from "./configStore";
