import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// =============================================================================
// Sidebar Collapse States (Persisted)
// =============================================================================

export const leftSidebarCollapsedAtom = atomWithStorage<boolean>(
  "claude-code-manager-left-sidebar-collapsed",
  false
);

// =============================================================================
// Collapsible Section States (Persisted)
// =============================================================================

export const settingsSectionOpenAtom = atomWithStorage<boolean>(
  "claude-code-manager-settings-open",
  true
);

export const projectsSectionOpenAtom = atomWithStorage<boolean>(
  "claude-code-manager-projects-open",
  true
);

// =============================================================================
// Quick Open Dialog State (Not Persisted)
// =============================================================================

export const quickOpenDialogOpenAtom = atom<boolean>(false);
