import { createStore } from "jotai/vanilla";
import { beforeEach, describe, expect, it } from "vitest";
import {
  activePathAtom,
  homePathAtom,
  isGlobalSettingsSelectedAtom,
  selectedProjectIdAtom,
} from "@/renderer/stores/atoms";

describe("activePath atom", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("should return selected project path when project is selected", () => {
    store.set(selectedProjectIdAtom, "/Users/test/project");
    store.set(isGlobalSettingsSelectedAtom, false);
    store.set(homePathAtom, "/Users/test/home");

    const activePath = store.get(activePathAtom);
    expect(activePath).toBe("/Users/test/project");
  });

  it("should return home path when global settings is selected", () => {
    store.set(selectedProjectIdAtom, null);
    store.set(isGlobalSettingsSelectedAtom, true);
    store.set(homePathAtom, "/Users/test/home");

    const activePath = store.get(activePathAtom);
    expect(activePath).toBe("/Users/test/home");
  });

  it("should return empty string when no project is selected and home path is empty", () => {
    store.set(selectedProjectIdAtom, null);
    store.set(isGlobalSettingsSelectedAtom, false);
    store.set(homePathAtom, "");

    const activePath = store.get(activePathAtom);
    expect(activePath).toBe("");
  });

  it("should reactively update when selected project changes", () => {
    store.set(homePathAtom, "/Users/test/home");
    store.set(selectedProjectIdAtom, "/Users/test/project1");
    store.set(isGlobalSettingsSelectedAtom, false);

    expect(store.get(activePathAtom)).toBe("/Users/test/project1");

    store.set(selectedProjectIdAtom, "/Users/test/project2");

    expect(store.get(activePathAtom)).toBe("/Users/test/project2");
  });

  it("should reactively update when home path changes and global settings is selected", () => {
    store.set(selectedProjectIdAtom, null);
    store.set(isGlobalSettingsSelectedAtom, true);
    store.set(homePathAtom, "");

    expect(store.get(activePathAtom)).toBe("");

    store.set(homePathAtom, "/Users/test/home");

    expect(store.get(activePathAtom)).toBe("/Users/test/home");
  });
});
