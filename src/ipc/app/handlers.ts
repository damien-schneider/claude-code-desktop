import { homedir } from "node:os";
import { cwd } from "node:process";
import { os } from "@orpc/server";
import { app } from "electron";

export const currentPlatfom = os.handler(() => {
  return process.platform;
});

export const appVersion = os.handler(() => {
  return app.getVersion();
});

export const getHomePath = os.handler(() => {
  return homedir();
});

export const getCurrentWorkingDirectory = os.handler(() => {
  return cwd();
});
