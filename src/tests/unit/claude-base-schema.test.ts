import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  claudeModelSchema,
  claudeNameSchema,
  colorSchema,
  createFrontmatterSchema,
  stringArraySchema,
} from "@/schemas/claude/base";

describe("Claude Base Schemas", () => {
  describe("claudeNameSchema", () => {
    const validNames = [
      "my-rule",
      "test-123",
      "rule",
      "a",
      "test-rule-name-123",
      "my-rule-1",
    ];

    const invalidNames = [
      { value: "", expectedError: "Name is required" },
      { value: "A", expectedError: "Only lowercase" },
      { value: "My_Rule", expectedError: "Only lowercase" },
      { value: "-my-rule", expectedError: "start with a hyphen" },
      { value: "my-rule-", expectedError: "end with a hyphen" },
      { value: "my--rule", expectedError: "consecutive hyphens" },
      { value: "my_rule", expectedError: "Only lowercase" },
      { value: "my rule", expectedError: "Only lowercase" },
      { value: "a".repeat(65), expectedError: "64 characters or less" },
    ];

    describe("valid names", () => {
      it.each(validNames)("should accept valid name: %s", (name) => {
        const result = claudeNameSchema.safeParse(name);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(name);
        }
      });
    });

    describe("invalid names", () => {
      it.each(
        invalidNames
      )("should reject invalid name: $value (expecting: $expectedError)", ({
        value,
        expectedError,
      }) => {
        const result = claudeNameSchema.safeParse(value);
        expect(result.success).toBe(false);
        if (!result.success) {
          // Check if error exists and has issues
          const hasError =
            result.error &&
            ((result.error.issues && result.error.issues.length > 0) ||
              (result.error.errors && result.error.errors.length > 0));

          if (hasError) {
            const issues = result.error.issues || result.error.errors || [];
            const errorMessage = issues[0]?.message || "";
            expect(errorMessage).toMatch(new RegExp(expectedError, "i"));
          }
        }
      });
    });

    it("should handle edge case: exactly 64 characters", () => {
      const name = "a".repeat(64);
      const result = claudeNameSchema.safeParse(name);
      expect(result.success).toBe(true);
    });

    it("should accept single character names", () => {
      expect(claudeNameSchema.safeParse("a").success).toBe(true);
      expect(claudeNameSchema.safeParse("1").success).toBe(true);
      expect(claudeNameSchema.safeParse("0").success).toBe(true);
    });
  });

  describe("colorSchema", () => {
    const validColors = [
      "blue",
      "green",
      "red",
      "#fff",
      "#ffffff",
      "#FFF",
      "#FFFFFF",
      "#abc",
      "rgb(255, 0, 0)",
      "rgb(100%, 0%, 0%)",
      "rgba(255, 0, 0, 0.5)",
      "rgba(255,0,0,0.5)",
      "hsl(120, 100%, 50%)",
      "hsla(120, 100%, 50%, 0.5)",
      "hsla(120,100%,50%,0.5)",
    ];

    const invalidColors = [
      "RGB(255, 0, 0)", // uppercase function
      "#ggg", // invalid hex
      "notacolor123", // alphanumeric mix
      "123", // just numbers
      "#", // just hash
      "rgb(", // incomplete function
    ];

    describe("valid colors", () => {
      it.each(validColors)("should accept valid color: %s", (color) => {
        const result = colorSchema.safeParse(color);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid colors", () => {
      it.each(invalidColors)("should reject invalid color: %s", (color) => {
        const result = colorSchema.safeParse(color);
        expect(result.success).toBe(false);
      });
    });

    it("should accept undefined as optional", () => {
      const result = colorSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should handle empty string as valid (optional)", () => {
      const result = colorSchema.safeParse("");
      expect(result.success).toBe(true);
    });
  });

  describe("claudeModelSchema", () => {
    const validModels = [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-5-opus-20241022",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "claude-3-opus-20240229",
      "sonnet",
      "haiku",
      "opus",
    ];

    it("should accept all valid model names", () => {
      validModels.forEach((model) => {
        const result = claudeModelSchema.safeParse(model);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(model);
        }
      });
    });

    it("should reject invalid model names", () => {
      const invalidModels = [
        "claude-3-5-unknown",
        "gpt-4",
        "claude-2",
        "sonnet-2",
        "",
      ];

      invalidModels.forEach((model) => {
        const result = claudeModelSchema.safeParse(model);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("stringArraySchema", () => {
    it("should split comma-separated strings into array", () => {
      const result = stringArraySchema.safeParse("a,b,c");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["a", "b", "c"]);
      }
    });

    it("should trim whitespace from items", () => {
      const result = stringArraySchema.safeParse(" a , b , c ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["a", "b", "c"]);
      }
    });

    it("should filter out empty strings", () => {
      const result = stringArraySchema.safeParse("a,,b,,c");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["a", "b", "c"]);
      }
    });

    it("should handle single item", () => {
      const result = stringArraySchema.safeParse("single");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["single"]);
      }
    });

    it("should accept undefined as optional", () => {
      const result = stringArraySchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should handle empty string", () => {
      const result = stringArraySchema.safeParse("");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should handle strings with only whitespace and commas", () => {
      const result = stringArraySchema.safeParse(" , , ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("createFrontmatterSchema", () => {
    it("should create a schema from shape definition", () => {
      const schema = createFrontmatterSchema({
        title: z.string(),
        description: z.string().optional(),
        tags: stringArraySchema,
      });

      const validInput = {
        title: "Test",
        description: "Test description",
        tags: "a,b,c",
      };

      const result = schema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test");
        expect(result.data.description).toBe("Test description");
        expect(result.data.tags).toEqual(["a", "b", "c"]);
      }
    });

    it("should handle optional fields correctly", () => {
      const schema = createFrontmatterSchema({
        title: z.string(),
        description: z.string().optional(),
      });

      const minimalInput = { title: "Test" };
      const result = schema.safeParse(minimalInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test");
        expect(result.data.description).toBeUndefined();
      }
    });

    it("should reject invalid data", () => {
      const schema = createFrontmatterSchema({
        title: z.string(),
        count: z.number(),
      });

      const invalidInput = { title: "Test", count: "not a number" };
      const result = schema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });
});
