import { app } from "./app";
import { shell } from "./shell";
import { theme } from "./theme";
import { window } from "./window";
import { scanner } from "./scanner";
import { claude } from "./claude";
import { sessions } from "./sessions";
import { claudeProcess } from "./claude-process";

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
