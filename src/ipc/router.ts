import { app } from "./app";
import { claude } from "./claude";
import { claudeProcess } from "./claude-process";
import { scanner } from "./scanner";
import { sessions } from "./sessions";
import { shell } from "./shell";
import { theme } from "./theme";
import { window } from "./window";

export const router = {
  theme,
  window,
  app,
  shell,
  scanner,
  claude,
  sessions,
  claudeProcess,
};
