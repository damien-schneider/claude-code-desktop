export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  SECRET = 'secret',      // Password/token fields
  URL = 'url',            // URL inputs
  MODEL = 'model',        // Model selector
  DURATION = 'duration',  // Timeout/duration with units
}

const SECRET_PATTERNS = [
  'secret', 'password', 'token', 'api_key', 'apikey', 'auth',
  'credential', 'private_key', 'secret_key', 'access_token',
];

const URL_PATTERNS = ['url', 'uri', 'endpoint', 'base_url', 'redirect_uri'];

const MODEL_PATTERNS = ['model', 'haiku_model', 'sonnet_model', 'opus_model'];

const DURATION_PATTERNS = ['timeout', 'duration', 'delay', 'interval', 'ttl'];

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
  // Determine if we have (key, value) or just (value)
  let key: string | undefined;
  let actualValue: unknown;

  if (value !== undefined) {
    // Two arguments: (key, value)
    key = keyOrValue as string;
    actualValue = value;
  } else {
    // One argument: (value)
    actualValue = keyOrValue;
  }

  // Check for special field types based on key name
  if (key) {
    const lowerKey = key.toLowerCase();

    if (SECRET_PATTERNS.some(pattern => lowerKey.includes(pattern))) {
      return FieldType.SECRET;
    }

    if (URL_PATTERNS.some(pattern => lowerKey.includes(pattern))) {
      return FieldType.URL;
    }

    if (MODEL_PATTERNS.some(pattern => lowerKey.includes(pattern))) {
      return FieldType.MODEL;
    }

    if (DURATION_PATTERNS.some(pattern => lowerKey.includes(pattern))) {
      return FieldType.DURATION;
    }
  }

  // Detect based on value type
  if (actualValue === null || actualValue === undefined) {
    return FieldType.STRING;
  }

  if (typeof actualValue === 'boolean') {
    return FieldType.BOOLEAN;
  }

  if (typeof actualValue === 'number') {
    return FieldType.NUMBER;
  }

  if (Array.isArray(actualValue)) {
    return FieldType.ARRAY;
  }

  if (typeof actualValue === 'object' && actualValue !== null && !Array.isArray(actualValue)) {
    return FieldType.OBJECT;
  }

  return FieldType.STRING;
}

export function getFieldLabel(key: string): string {
  // Convert snake_case or camelCase to Title Case
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

export function getFieldDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'anthropic_auth_token': 'Authentication token for Anthropic API',
    'anthropic_base_url': 'Custom base URL for Anthropic API requests',
    'api_timeout_ms': 'Request timeout in milliseconds',
    'claude_code_disable_nonessential_traffic': 'Disable telemetry and non-essential network requests',
    'always_thinking_enabled': 'Enable extended thinking mode for all conversations',
  };

  const lowerKey = key.toLowerCase();
  return descriptions[lowerKey] || '';
}
