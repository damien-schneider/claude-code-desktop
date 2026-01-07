import {
  detectFieldType,
  FieldType,
} from "@/renderer/components/settings/json-field-detector";

describe("JSON Field Type Detector", () => {
  it("should detect string fields", () => {
    expect(detectFieldType("hello")).toBe(FieldType.STRING);
    expect(detectFieldType("")).toBe(FieldType.STRING);
  });

  it("should detect number fields", () => {
    expect(detectFieldType(42)).toBe(FieldType.NUMBER);
    expect(detectFieldType(3.14)).toBe(FieldType.NUMBER);
  });

  it("should detect boolean fields", () => {
    expect(detectFieldType(true)).toBe(FieldType.BOOLEAN);
    expect(detectFieldType(false)).toBe(FieldType.BOOLEAN);
  });

  it("should detect array fields", () => {
    expect(detectFieldType([])).toBe(FieldType.ARRAY);
    expect(detectFieldType([1, 2, 3])).toBe(FieldType.ARRAY);
  });

  it("should detect object fields", () => {
    expect(detectFieldType({})).toBe(FieldType.OBJECT);
    expect(detectFieldType({ key: "value" })).toBe(FieldType.OBJECT);
  });

  it("should detect null/undefined as string (default)", () => {
    expect(detectFieldType(null)).toBe(FieldType.STRING);
    expect(detectFieldType(undefined)).toBe(FieldType.STRING);
  });

  it("should detect secret fields by key name patterns", () => {
    expect(detectFieldType("secret", "value")).toBe(FieldType.SECRET);
    expect(detectFieldType("API_KEY", "value")).toBe(FieldType.SECRET);
    expect(detectFieldType("token", "value")).toBe(FieldType.SECRET);
    expect(detectFieldType("password", "value")).toBe(FieldType.SECRET);
  });

  it("should detect URL fields by key name patterns", () => {
    expect(detectFieldType("base_url", "https://api.test.com")).toBe(
      FieldType.URL
    );
    expect(detectFieldType("endpoint", "https://api.example.com")).toBe(
      FieldType.URL
    );
  });

  it("should detect model name fields", () => {
    expect(detectFieldType("model", "claude-3-5-sonnet")).toBe(FieldType.MODEL);
    expect(detectFieldType("haiku_model", "claude-3-haiku")).toBe(
      FieldType.MODEL
    );
  });

  it("should detect timeout/duration fields", () => {
    expect(detectFieldType("timeout_ms", "5000")).toBe(FieldType.DURATION);
    expect(detectFieldType("timeout", "30")).toBe(FieldType.DURATION);
  });

  it("should handle empty arrays and objects", () => {
    expect(detectFieldType([])).toBe(FieldType.ARRAY);
    expect(detectFieldType({})).toBe(FieldType.OBJECT);
  });

  it("should be case-insensitive for pattern matching", () => {
    expect(detectFieldType("API_KEY", "value")).toBe(FieldType.SECRET);
    expect(detectFieldType("BaseUrl", "value")).toBe(FieldType.URL);
  });

  it("should prioritize secret detection over other patterns", () => {
    expect(detectFieldType("secret_url", "value")).toBe(FieldType.SECRET);
  });
});
