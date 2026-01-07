// biome-ignore lint/style/noEnum: Enum provides type-safe field constants
export enum FieldType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  ARRAY = "array",
  OBJECT = "object",
  SECRET = "secret", // Password/token fields
  URL = "url", // URL inputs
  MODEL = "model", // Model selector
  DURATION = "duration", // Timeout/duration with units
}

const SECRET_PATTERNS = [
  "secret",
  "password",
  "token",
  "api_key",
  "apikey",
  "auth",
  "credential",
  "private_key",
  "secret_key",
  "access_token",
];

const URL_PATTERNS = ["url", "uri", "endpoint", "base_url", "redirect_uri"];

const MODEL_PATTERNS = ["model", "haiku_model", "sonnet_model", "opus_model"];

const DURATION_PATTERNS = ["timeout", "duration", "delay", "interval", "ttl"];

/**
 * Detects the appropriate UI field type for a JSON value
 *
 * Can be called as:
 * - detectFieldType(key, value) - detect with key name hints (e.g., "api_key" -> SECRET)
 * - detectFieldType(value) - detect from value type only (when first param is not a string)
 *
 * Note: Signature uses (key, value) for more intuitive API when key is provided,
 * rather than (value, key) as originally specified.
 */
export function detectFieldType(
  keyOrValue: string | unknown,
  value?: unknown
): FieldType {
  const { key, actualValue } = parseArguments(keyOrValue, value);

  const keyBasedType = detectTypeFromKey(key);
  if (keyBasedType) {
    return keyBasedType;
  }

  return detectTypeFromValue(actualValue);
}

/**
 * Parse function arguments to extract key and value
 */
function parseArguments(
  keyOrValue: string | unknown,
  value?: unknown
): { key: string | undefined; actualValue: unknown } {
  if (value !== undefined) {
    return { key: keyOrValue as string, actualValue: value };
  }
  return { key: undefined, actualValue: keyOrValue };
}

/**
 * Detect field type based on key name patterns
 */
function detectTypeFromKey(key: string | undefined): FieldType | null {
  if (!key) {
    return null;
  }

  const lowerKey = key.toLowerCase();

  if (matchesAnyPattern(lowerKey, SECRET_PATTERNS)) {
    return FieldType.SECRET;
  }

  if (matchesAnyPattern(lowerKey, URL_PATTERNS)) {
    return FieldType.URL;
  }

  if (matchesAnyPattern(lowerKey, MODEL_PATTERNS)) {
    return FieldType.MODEL;
  }

  if (matchesAnyPattern(lowerKey, DURATION_PATTERNS)) {
    return FieldType.DURATION;
  }

  return null;
}

/**
 * Check if key matches any of the given patterns
 */
function matchesAnyPattern(key: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => key.includes(pattern));
}

/**
 * Detect field type based on value type
 */
function detectTypeFromValue(value: unknown): FieldType {
  if (value === null || value === undefined) {
    return FieldType.STRING;
  }

  if (typeof value === "boolean") {
    return FieldType.BOOLEAN;
  }

  if (typeof value === "number") {
    return FieldType.NUMBER;
  }

  if (Array.isArray(value)) {
    return FieldType.ARRAY;
  }

  if (typeof value === "object" && value !== null) {
    return FieldType.OBJECT;
  }

  return FieldType.STRING;
}

export function getFieldLabel(key: string): string {
  // Convert snake_case or camelCase to Title Case
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function getFieldDescription(key: string): string {
  const descriptions: Record<string, string> = {
    anthropic_auth_token: "Authentication token for Anthropic API",
    anthropic_base_url: "Custom base URL for Anthropic API requests",
    api_timeout_ms: "Request timeout in milliseconds",
    claude_code_disable_nonessential_traffic:
      "Disable telemetry and non-essential network requests",
    always_thinking_enabled:
      "Enable extended thinking mode for all conversations",
  };

  const lowerKey = key.toLowerCase();
  return descriptions[lowerKey] || "";
}
