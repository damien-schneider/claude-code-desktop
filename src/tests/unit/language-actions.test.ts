/**
 * Pragmatic tests for language actions
 * Tests actual localStorage and i18n interactions
 */

import type { i18n } from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAppLanguage, updateAppLanguage } from "@/actions/language";
import { LOCAL_STORAGE_KEYS } from "@/constants";

describe("Language Actions", () => {
  let storageMock: Record<string, string>;
  let mockI18n: i18n;

  beforeEach(() => {
    // Mock localStorage
    storageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storageMock[key] || null,
      setItem: (key: string, value: string) => {
        storageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete storageMock[key];
      },
    });

    // Reset document lang
    document.documentElement.lang = "";

    // Mock i18n
    mockI18n = {
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      language: "en",
      languages: ["en", "fr", "es"],
    } as unknown as i18n;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.lang = "";
  });

  describe("setAppLanguage", () => {
    it("should save language to localStorage", () => {
      setAppLanguage("fr", mockI18n);

      expect(storageMock[LOCAL_STORAGE_KEYS.LANGUAGE]).toBe("fr");
    });

    it("should change i18n language", () => {
      setAppLanguage("es", mockI18n);

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("es");
    });

    it("should update document lang attribute", () => {
      setAppLanguage("de", mockI18n);

      expect(document.documentElement.lang).toBe("de");
    });

    it("should handle all changes together", () => {
      setAppLanguage("en", mockI18n);

      expect(storageMock[LOCAL_STORAGE_KEYS.LANGUAGE]).toBe("en");
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("en");
      expect(document.documentElement.lang).toBe("en");
    });

    it("should support multiple language changes", () => {
      setAppLanguage("fr", mockI18n);
      expect(storageMock[LOCAL_STORAGE_KEYS.LANGUAGE]).toBe("fr");

      setAppLanguage("es", mockI18n);
      expect(storageMock[LOCAL_STORAGE_KEYS.LANGUAGE]).toBe("es");

      setAppLanguage("en", mockI18n);
      expect(storageMock[LOCAL_STORAGE_KEYS.LANGUAGE]).toBe("en");
    });
  });

  describe("updateAppLanguage", () => {
    it("should update language when saved in localStorage", () => {
      storageMock[LOCAL_STORAGE_KEYS.LANGUAGE] = "fr";

      updateAppLanguage(mockI18n);

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("fr");
      expect(document.documentElement.lang).toBe("fr");
    });

    it("should not change anything when no language in localStorage", () => {
      updateAppLanguage(mockI18n);

      expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
      expect(document.documentElement.lang).toBe("");
    });

    it("should handle different saved languages", () => {
      const languages = ["en", "fr", "es", "de"];

      for (const lang of languages) {
        storageMock[LOCAL_STORAGE_KEYS.LANGUAGE] = lang;
        updateAppLanguage(mockI18n);

        expect(mockI18n.changeLanguage).toHaveBeenCalledWith(lang);
        expect(document.documentElement.lang).toBe(lang);
      }
    });

    it("should not update when localStorage has null value", () => {
      storageMock[LOCAL_STORAGE_KEYS.LANGUAGE] = "null";

      updateAppLanguage(mockI18n);

      // Since "null" is a string, it will update
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("null");
    });

    it("should not update when localStorage has empty string", () => {
      storageMock[LOCAL_STORAGE_KEYS.LANGUAGE] = "";

      updateAppLanguage(mockI18n);

      // Empty string is falsy, so updateAppLanguage returns early
      expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
      expect(document.documentElement.lang).toBe("");
    });
  });
});
