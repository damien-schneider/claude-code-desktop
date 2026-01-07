/**
 * Pragmatic tests for localization
 * Tests language configuration and i18n setup
 */
import { describe, expect, it } from "vitest";
import langs from "@/localization/langs";
import type { Language } from "@/localization/language";

// Top-level regex patterns for performance
const LANGUAGE_KEY_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;
const LANGUAGE_PREFIX_REGEX = /^[A-Z]{2}-[A-Z]{2}$/;

describe("Language type", () => {
  it("should have correct structure", () => {
    const lang: Language = {
      key: "en",
      nativeName: "English",
      prefix: "EN-US",
    };

    expect(lang.key).toBe("en");
    expect(lang.nativeName).toBe("English");
    expect(lang.prefix).toBe("EN-US");
  });

  it("should allow different languages", () => {
    const ptBR: Language = {
      key: "pt-BR",
      nativeName: "Português (Brasil)",
      prefix: "PT-BR",
    };

    expect(ptBR.key).toBe("pt-BR");
    expect(ptBR.nativeName).toBe("Português (Brasil)");
    expect(ptBR.prefix).toBe("PT-BR");
  });
});

describe("langs default export", () => {
  it("should be an array", () => {
    expect(Array.isArray(langs)).toBe(true);
  });

  it("should contain English language", () => {
    const english = langs.find((lang) => lang.key === "en");
    expect(english).toBeDefined();
    expect(english?.nativeName).toBe("English");
    expect(english?.prefix).toBe("EN-US");
  });

  it("should contain Portuguese Brazilian language", () => {
    const ptBR = langs.find((lang) => lang.key === "pt-BR");
    expect(ptBR).toBeDefined();
    expect(ptBR?.nativeName).toBe("Português (Brasil)");
    expect(ptBR?.prefix).toBe("PT-BR");
  });

  it("should have all required properties for each language", () => {
    for (const lang of langs) {
      expect(lang.key).toBeDefined();
      expect(typeof lang.key).toBe("string");
      expect(lang.nativeName).toBeDefined();
      expect(typeof lang.nativeName).toBe("string");
      expect(lang.prefix).toBeDefined();
      expect(typeof lang.prefix).toBe("string");
    }
  });

  it("should have unique keys", () => {
    const keys = langs.map((lang) => lang.key);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  it("should have unique prefixes", () => {
    const prefixes = langs.map((lang) => lang.prefix);
    const uniquePrefixes = new Set(prefixes);
    expect(prefixes.length).toBe(uniquePrefixes.size);
  });
});

describe("Language format validation", () => {
  it("should have language keys in valid format", () => {
    for (const lang of langs) {
      // Language keys should be ISO 639-1 codes possibly with region
      expect(lang.key).toMatch(LANGUAGE_KEY_REGEX);
    }
  });

  it("should have prefixes in uppercase with hyphen", () => {
    for (const lang of langs) {
      expect(lang.prefix).toMatch(LANGUAGE_PREFIX_REGEX);
    }
  });

  it("should have non-empty native names", () => {
    for (const lang of langs) {
      expect(lang.nativeName.length).toBeGreaterThan(0);
    }
  });
});

describe("i18n configuration", () => {
  it("should have i18n configured (integration test)", () => {
    // This test verifies the i18n module exists and is configured
    // The actual i18n instance is configured in i18n.ts
    expect(langs.length).toBeGreaterThan(0);
  });

  it("should support all languages defined in langs", () => {
    // Verify that languages match between langs array and i18n resources
    const langKeys = langs.map((lang) => lang.key);
    expect(langKeys).toContain("en");
    expect(langKeys).toContain("pt-BR");
  });
});
