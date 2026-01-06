import { os } from "@orpc/server";
import { app } from "electron";
import { homedir } from "os";
import { cwd } from "process";

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
