# Robust JSON Field Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a universal, type-safe JSON field editor system that automatically generates appropriate UI components for any JSON structure in Claude settings.json, including env vars, plugins, and all current/future fields.

**Architecture:** Build a recursive field renderer that inspects JSON types (string, number, boolean, object, array) and generates appropriate form controls (Input, Textarea, Select, Switch) with proper validation, type conversion, and change detection.

**Tech Stack:** React, TypeScript, Jotai (state), shadcn/ui components, existing IPC infrastructure

---

## Task 1: Update TypeScript Types for Complete Settings Schema

**Files:**
- Modify: `src/renderer/components/Settings/settings-types.ts`

**Step 1: Write the failing test**

Create test file: `src/tests/unit/settings-types.test.ts`

```typescript
import { ClaudeSettings, EnvVars, EnabledPlugins } from '@/renderer/components/Settings/settings-types';

describe('Settings Types', () => {
  it('should support env vars with all Claude Code environment variables', () => {
    const env: EnvVars = {
      ANTHROPIC_AUTH_TOKEN: 'test-token',
      ANTHROPIC_BASE_URL: 'https://api.test.com',
      API_TIMEOUT_MS: '3000000',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.5-air',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.7',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.7',
    };

    expect(env.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
  });

  it('should support enabled plugins map', () => {
    const plugins: EnabledPlugins = {
      'ralph-wiggum@claude-code-plugins': true,
      'rust-analyzer-lsp@claude-plugins-official': true,
      'superpowers@superpowers-marketplace': true,
    };

    expect(plugins['superpowers@superpowers-marketplace']).toBe(true);
  });

  it('should support complete settings structure', () => {
    const settings: ClaudeSettings = {
      env: {
        ANTHROPIC_AUTH_TOKEN: 'token',
      },
      permissions: {
        allow: ['Bash(cat:*)'],
        deny: ['Bash(rm -rf:*)'],
      },
      mcpServers: {
        'test-server': {
          command: 'node',
          args: ['server.js'],
        },
      },
      hooks: {
        'user-prompt-submit': [
          { type: 'user-prompt', command: 'echo "starting"' },
        ],
      },
      enabledPlugins: {
        'test-plugin': true,
      },
      alwaysThinkingEnabled: false,
    };

    expect(settings.env?.ANTHROPIC_AUTH_TOKEN).toBe('token');
    expect(settings.alwaysThinkingEnabled).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/tests/unit/settings-types.test.ts`
Expected: FAIL with type errors about missing properties

**Step 3: Write minimal implementation**

Update `src/renderer/components/Settings/settings-types.ts` - add after line 9:

```typescript
export interface EnvVars {
  ANTHROPIC_AUTH_TOKEN?: string;
  ANTHROPIC_BASE_URL?: string;
  API_TIMEOUT_MS?: string;
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC?: string;
  ANTHROPIC_DEFAULT_HAIKU_MODEL?: string;
  ANTHROPIC_DEFAULT_SONNET_MODEL?: string;
  ANTHROPIC_DEFAULT_OPUS_MODEL?: string;
  [key: string]: string | undefined; // Allow custom env vars
}

export interface EnabledPlugins {
  [pluginId: string]: boolean;
}

export interface ClaudeSettings {
  env?: EnvVars;
  permissions?: ClaudePermissions;
  mcpServers?: Record<string, McpServerConfig>;
  hooks?: Record<string, ClaudeHook[]>;
  enabledPlugins?: EnabledPlugins;
  alwaysThinkingEnabled?: boolean;
  // Allow any future fields
  [key: string]: any;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/tests/unit/settings-types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tests/unit/settings-types.test.ts src/renderer/components/Settings/settings-types.ts
git commit -m "feat: extend settings types to support env, plugins, and alwaysThinkingEnabled"
```

---

## Task 2: Create Universal JSON Field Type Detector

**Files:**
- Create: `src/renderer/components/Settings/json-field-detector.ts`
- Test: `src/tests/unit/json-field-detector.test.ts`

**Step 1: Write the failing test**

Create `src/tests/unit/json-field-detector.test.ts`:

```typescript
import { detectFieldType, FieldType } from '@/renderer/components/Settings/json-field-detector';

describe('JSON Field Type Detector', () => {
  it('should detect string fields', () => {
    expect(detectFieldType('hello')).toBe(FieldType.STRING);
    expect(detectFieldType('')).toBe(FieldType.STRING);
  });

  it('should detect number fields', () => {
    expect(detectFieldType(42)).toBe(FieldType.NUMBER);
    expect(detectFieldType(3.14)).toBe(FieldType.NUMBER);
  });

  it('should detect boolean fields', () => {
    expect(detectFieldType(true)).toBe(FieldType.BOOLEAN);
    expect(detectFieldType(false)).toBe(FieldType.BOOLEAN);
  });

  it('should detect array fields', () => {
    expect(detectFieldType([])).toBe(FieldType.ARRAY);
    expect(detectFieldType([1, 2, 3])).toBe(FieldType.ARRAY);
  });

  it('should detect object fields', () => {
    expect(detectFieldType({})).toBe(FieldType.OBJECT);
    expect(detectFieldType({ key: 'value' })).toBe(FieldType.OBJECT);
  });

  it('should detect null/undefined as string (default)', () => {
    expect(detectFieldType(null)).toBe(FieldType.STRING);
    expect(detectFieldType(undefined)).toBe(FieldType.STRING);
  });

  it('should detect secret fields by key name patterns', () => {
    expect(detectFieldType('secret', 'value')).toBe(FieldType.SECRET);
    expect(detectFieldType('API_KEY', 'value')).toBe(FieldType.SECRET);
    expect(detectFieldType('token', 'value')).toBe(FieldType.SECRET);
    expect(detectFieldType('password', 'value')).toBe(FieldType.SECRET);
  });

  it('should detect URL fields by key name patterns', () => {
    expect(detectFieldType('base_url', 'https://api.test.com')).toBe(FieldType.URL);
    expect(detectFieldType('endpoint', 'https://api.example.com')).toBe(FieldType.URL);
  });

  it('should detect model name fields', () => {
    expect(detectFieldType('model', 'claude-3-5-sonnet')).toBe(FieldType.MODEL);
    expect(detectFieldType('haiku_model', 'claude-3-haiku')).toBe(FieldType.MODEL);
  });

  it('should detect timeout/duration fields', () => {
    expect(detectFieldType('timeout_ms', '5000')).toBe(FieldType.DURATION);
    expect(detectFieldType('timeout', '30')).toBe(FieldType.DURATION);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/tests/unit/json-field-detector.test.ts`
Expected: FAIL with "Cannot find module '@/renderer/components/Settings/json-field-detector'"

**Step 3: Write minimal implementation**

Create `src/renderer/components/Settings/json-field-detector.ts`:

```typescript
/**
 * Detects the appropriate UI field type for a JSON value
 */

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

export function detectFieldType(
  value: unknown,
  key?: string
): FieldType {
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
  if (value === null || value === undefined) {
    return FieldType.STRING;
  }

  if (typeof value === 'boolean') {
    return FieldType.BOOLEAN;
  }

  if (typeof value === 'number') {
    return FieldType.NUMBER;
  }

  if (Array.isArray(value)) {
    return FieldType.ARRAY;
  }

  if (typeof value === 'object') {
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
```

**Step 4: Run test to verify it passes**

Run: `bun test src/tests/unit/json-field-detector.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tests/unit/json-field-detector.test.ts src/renderer/components/Settings/json-field-detector.ts
git commit -m "feat: add JSON field type detector with smart field type inference"
```

---

## Task 3: Create Universal Field Renderer Component

**Files:**
- Create: `src/renderer/components/Settings/json-field-renderer.tsx`
- Test: `src/tests/unit/json-field-renderer.test.tsx`

**Step 1: Write the failing test**

Create `src/tests/unit/json-field-renderer.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonFieldRenderer } from '@/renderer/components/Settings/json-field-renderer';

describe('JsonFieldRenderer', () => {
  it('should render string field with input', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="test_field"
        value="hello"
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('hello');
  });

  it('should render boolean field with switch', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="enabled"
        value={true}
        onChange={handleChange}
      />
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });

  it('should call onChange when string input changes', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="name"
        value="old"
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new' } });

    expect(handleChange).toHaveBeenCalledWith('new');
  });

  it('should render secret field with password input', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="api_token"
        value="secret123"
        onChange={handleChange}
      />
    );

    const input = screen.getByDisplayValue('•••••••');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render object field with nested fields', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="config"
        value={{ host: 'localhost', port: 8080 }}
        onChange={handleChange}
      />
    );

    expect(screen.getByText('host')).toBeInTheDocument();
    expect(screen.getByText('port')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/tests/unit/json-field-renderer.test.tsx`
Expected: FAIL with "Cannot find module '@/renderer/components/Settings/json-field-renderer'"

**Step 3: Write minimal implementation**

Create `src/renderer/components/Settings/json-field-renderer.tsx`:

```typescript
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import {
  detectFieldType,
  FieldType,
  getFieldLabel,
  getFieldDescription,
} from './json-field-detector';

interface JsonFieldRendererProps {
  fieldKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
  depth?: number;
  parentPath?: string;
}

/**
 * Universal field renderer that adapts to JSON value types
 */
export const JsonFieldRenderer: React.FC<JsonFieldRendererProps> = ({
  fieldKey,
  value,
  onChange,
  depth = 0,
  parentPath = '',
}) => {
  const fieldType = detectFieldType(value, fieldKey);
  const label = getFieldLabel(fieldKey);
  const description = getFieldDescription(fieldKey);
  const fullPath = parentPath ? `${parentPath}.${fieldKey}` : fieldKey;

  // Handle primitive string fields
  if (fieldType === FieldType.STRING || fieldType === FieldType.URL) {
    return (
      <div className="space-y-1">
        <Label htmlFor={fullPath}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <Input
          id={fullPath}
          type={fieldType === FieldType.URL ? 'url' : 'text'}
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    );
  }

  // Handle secret/password fields
  if (fieldType === FieldType.SECRET) {
    const [showSecret, setShowSecret] = React.useState(false);
    const stringValue = value as string || '';

    return (
      <div className="space-y-1">
        <Label htmlFor={fullPath}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={fullPath}
              type={showSecret ? 'text' : 'password'}
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="pr-10"
            />
            {stringValue && (
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle number fields
  if (fieldType === FieldType.NUMBER) {
    return (
      <div className="space-y-1">
        <Label htmlFor={fullPath}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <Input
          id={fullPath}
          type="number"
          value={value as number || 0}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    );
  }

  // Handle boolean fields
  if (fieldType === FieldType.BOOLEAN) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor={fullPath}>{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <Switch
          id={fullPath}
          checked={value as boolean || false}
          onCheckedChange={onChange}
        />
      </div>
    );
  }

  // Handle array fields
  if (fieldType === FieldType.ARRAY) {
    const arrayValue = value as unknown[];
    const arrayType = arrayValue.length > 0
      ? detectFieldType(arrayValue[0])
      : FieldType.STRING;

    const handleAddItem = () => {
      const newItem = arrayType === FieldType.BOOLEAN
        ? false
        : arrayType === FieldType.NUMBER
        ? 0
        : '';
      onChange([...arrayValue, newItem]);
    };

    const handleRemoveItem = (index: number) => {
      onChange(arrayValue.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index: number, newValue: unknown) => {
      const updated = [...arrayValue];
      updated[index] = newValue;
      onChange(updated);
    };

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{label}</CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddItem}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {arrayValue.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No items</p>
          ) : (
            arrayValue.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <JsonFieldRenderer
                    fieldKey={`${fieldKey}[${index}]`}
                    value={item}
                    onChange={(newValue) => handleUpdateItem(index, newValue)}
                    depth={depth + 1}
                    parentPath={fullPath}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  // Handle object fields (recursive)
  if (fieldType === FieldType.OBJECT) {
    const objValue = value as Record<string, unknown>;
    const keys = Object.keys(objValue);

    const handleAddField = () => {
      const newKey = `new_field_${keys.length + 1}`;
      onChange({ ...objValue, [newKey]: '' });
    };

    const handleRemoveField = (keyToRemove: string) => {
      const updated = { ...objValue };
      delete updated[keyToRemove];
      onChange(updated);
    };

    const handleUpdateField = (subKey: string, newValue: unknown) => {
      onChange({ ...objValue, [subKey]: newValue });
    };

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{label}</CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddField}>
              <Plus className="h-3 w-3 mr-1" />
              Add Field
            </Button>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No fields</p>
          ) : (
            keys.map((subKey) => (
              <div key={subKey} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <JsonFieldRenderer
                      fieldKey={subKey}
                      value={objValue[subKey]}
                      onChange={(newValue) => handleUpdateField(subKey, newValue)}
                      depth={depth + 1}
                      parentPath={fullPath}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveField(subKey)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `bun test src/tests/unit/json-field-renderer.test.tsx`
Expected: PASS (may need to install testing dependencies first)

**Step 5: Commit**

```bash
git add src/tests/unit/json-field-renderer.test.tsx src/renderer/components/Settings/json-field-renderer.tsx
git commit -m "feat: add universal JSON field renderer with type-based component selection"
```

---

## Task 4: Create Environment Variables Editor Component

**Files:**
- Create: `src/renderer/components/Settings/env-vars-editor.tsx`
- Test: `src/tests/unit/env-vars-editor.test.tsx`

**Step 1: Write the failing test**

Create `src/tests/unit/env-vars-editor.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { EnvVarsEditor } from '@/renderer/components/Settings/env-vars-editor';
import type { EnvVars } from '@/renderer/components/Settings/settings-types';

describe('EnvVarsEditor', () => {
  it('should render all environment variables', () => {
    const env: EnvVars = {
      ANTHROPIC_AUTH_TOKEN: 'test-token',
      API_TIMEOUT_MS: '5000',
    };

    const handleChange = vi.fn();
    render(<EnvVarsEditor env={env} onChange={handleChange} />);

    expect(screen.getByText('Anthropic Auth Token')).toBeInTheDocument();
    expect(screen.getByText('Api Timeout Ms')).toBeInTheDocument();
  });

  it('should call onChange when field value changes', () => {
    const env: EnvVars = {
      ANTHROPIC_AUTH_TOKEN: 'old-token',
    };

    const handleChange = vi.fn();
    render(<EnvVarsEditor env={env} onChange={handleChange} />);

    const input = screen.getByLabelText('anthropic_auth_token');
    fireEvent.change(input, { target: { value: 'new-token' } });

    expect(handleChange).toHaveBeenCalledWith({
      ANTHROPIC_AUTH_TOKEN: 'new-token',
    });
  });

  it('should allow adding custom environment variables', () => {
    const env: EnvVars = {};

    const handleChange = vi.fn();
    render(<EnvVarsEditor env={env} onChange={handleChange} />);

    const addButton = screen.getByText('Add Custom Variable');
    fireEvent.click(addButton);

    // Should show new field input
    expect(screen.getByText('New Variable Name')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/tests/unit/env-vars-editor.test.tsx`
Expected: FAIL with "Cannot find module '@/renderer/components/Settings/env-vars-editor'"

**Step 3: Write minimal implementation**

Create `src/renderer/components/Settings/env-vars-editor.tsx`:

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { JsonFieldRenderer } from './json-field-renderer';
import type { EnvVars } from './settings-types';

interface EnvVarsEditorProps {
  env: EnvVars;
  onChange: (env: EnvVars) => void;
}

// Standard Claude Code environment variables
const STANDARD_ENV_VARS: Array<{ key: string; label: string; description: string }> = [
  {
    key: 'ANTHROPIC_AUTH_TOKEN',
    label: 'Anthropic API Token',
    description: 'Authentication token for Anthropic API (required)',
  },
  {
    key: 'ANTHROPIC_BASE_URL',
    label: 'Anthropic Base URL',
    description: 'Custom base URL for Anthropic API requests',
  },
  {
    key: 'API_TIMEOUT_MS',
    label: 'API Timeout',
    description: 'Request timeout in milliseconds (default: 120000)',
  },
  {
    key: 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
    label: 'Disable Non-Essential Traffic',
    description: 'Disable telemetry and non-essential network requests',
  },
  {
    key: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
    label: 'Default Haiku Model',
    description: 'Model ID for Haiku (fast) responses',
  },
  {
    key: 'ANTHROPIC_DEFAULT_SONNET_MODEL',
    label: 'Default Sonnet Model',
    description: 'Model ID for Sonnet (balanced) responses',
  },
  {
    key: 'ANTHROPIC_DEFAULT_OPUS_MODEL',
    label: 'Default Opus Model',
    description: 'Model ID for Opus (quality) responses',
  },
];

/**
 * Editor for environment variables in settings.json
 */
export const EnvVarsEditor: React.FC<EnvVarsEditorProps> = ({ env, onChange }) => {
  const [customVars, setCustomVars] = React.useState<Record<string, string>>({});

  // Separate standard vars from custom vars
  const standardEnvKeys = STANDARD_ENV_VARS.map(v => v.key);
  const customEnvKeys = Object.keys(env).filter(key => !standardEnvKeys.includes(key));

  const handleStandardVarChange = (key: string, value: string) => {
    onChange({ ...env, [key]: value });
  };

  const handleAddCustomVar = () => {
    const newKey = `CUSTOM_VAR_${Date.now()}`;
    setCustomVars({ ...customVars, [newKey]: '' });
  };

  const handleCustomVarNameChange = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;

    const value = env[oldKey];
    const updated = { ...env };
    delete updated[oldKey];
    updated[newKey] = value;
    onChange(updated);
  };

  const handleCustomVarValueChange = (key: string, value: string) => {
    onChange({ ...env, [key]: value });
  };

  const handleRemoveCustomVar = (key: string) => {
    const updated = { ...env };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Standard Environment Variables</h3>
        <div className="space-y-4">
          {STANDARD_ENV_VARS.map(({ key, label, description }) => (
            <JsonFieldRenderer
              key={key}
              fieldKey={key}
              value={env[key] || ''}
              onChange={(value) => handleStandardVarChange(key, value as string)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Environment Variables</h3>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Custom Variables</CardTitle>
              <Button size="sm" variant="outline" onClick={handleAddCustomVar}>
                <Plus className="h-3 w-3 mr-1" />
                Add Variable
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {customEnvKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No custom variables configured
              </p>
            ) : (
              customEnvKeys.map((key) => (
                <div key={key} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium">Variable Name</label>
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleCustomVarNameChange(key, e.target.value.toUpperCase())}
                          className="w-full px-2 py-1 text-sm border rounded font-mono"
                          placeholder="VARIABLE_NAME"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium">Value</label>
                        <input
                          type="text"
                          value={env[key] || ''}
                          onChange={(e) => handleCustomVarValueChange(key, e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded font-mono"
                          placeholder="value"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveCustomVar(key)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `bun test src/tests/unit/env-vars-editor.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tests/unit/env-vars-editor.test.tsx src/renderer/components/Settings/env-vars-editor.tsx
git commit -m "feat: add environment variables editor with standard and custom variable support"
```

---

## Task 5: Create Enabled Plugins Editor Component

**Files:**
- Create: `src/renderer/components/Settings/enabled-plugins-editor.tsx`
- Test: `src/tests/unit/enabled-plugins-editor.test.tsx`

**Step 1: Write the failing test**

Create `src/tests/unit/enabled-plugins-editor.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { EnabledPluginsEditor } from '@/renderer/components/Settings/enabled-plugins-editor';
import type { EnabledPlugins } from '@/renderer/components/Settings/settings-types';

describe('EnabledPluginsEditor', () => {
  it('should render plugin list with toggles', () => {
    const plugins: EnabledPlugins = {
      'ralph-wiggum@claude-code-plugins': true,
      'rust-analyzer-lsp@claude-plugins-official': true,
      'superpowers@superpowers-marketplace': false,
    };

    const handleChange = vi.fn();
    render(<EnabledPluginsEditor plugins={plugins} onChange={handleChange} />);

    expect(screen.getByText('ralph-wiggum@claude-code-plugins')).toBeInTheDocument();
    expect(screen.getByText('rust-analyzer-lsp@claude-plugins-official')).toBeInTheDocument();
    expect(screen.getByText('superpowers@superpowers-marketplace')).toBeInTheDocument();
  });

  it('should toggle plugin enabled state', () => {
    const plugins: EnabledPlugins = {
      'test-plugin': true,
    };

    const handleChange = vi.fn();
    render(<EnabledPluginsEditor plugins={plugins} onChange={handleChange} />);

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    expect(handleChange).toHaveBeenCalledWith({
      'test-plugin': false,
    });
  });

  it('should allow adding custom plugins', () => {
    const plugins: EnabledPlugins = {};

    const handleChange = vi.fn();
    render(<EnabledPluginsEditor plugins={plugins} onChange={handleChange} />);

    const addButton = screen.getByText('Add Plugin');
    fireEvent.click(addButton);

    // Should show input for plugin ID
    expect(screen.getByPlaceholderText('plugin-id@scope')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/tests/unit/enabled-plugins-editor.test.tsx`
Expected: FAIL with "Cannot find module '@/renderer/components/Settings/enabled-plugins-editor'"

**Step 3: Write minimal implementation**

Create `src/renderer/components/Settings/enabled-plugins-editor.tsx`:

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Package } from 'lucide-react';
import type { EnabledPlugins } from './settings-types';

interface EnabledPluginsEditorProps {
  plugins: EnabledPlugins;
  onChange: (plugins: EnabledPlugins) => void;
}

/**
 * Editor for enabled plugins in settings.json
 */
export const EnabledPluginsEditor: React.FC<EnabledPluginsEditorProps> = ({
  plugins,
  onChange,
}) => {
  const [newPluginId, setNewPluginId] = React.useState('');

  const handleToggle = (pluginId: string, enabled: boolean) => {
    onChange({ ...plugins, [pluginId]: enabled });
  };

  const handleAddPlugin = () => {
    if (!newPluginId.trim()) return;

    onChange({
      ...plugins,
      [newPluginId.trim()]: true,
    });
    setNewPluginId('');
  };

  const handleRemovePlugin = (pluginId: string) => {
    const updated = { ...plugins };
    delete updated[pluginId];
    onChange(updated);
  };

  const pluginEntries = Object.entries(plugins).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle className="text-sm">Enabled Plugins</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddPlugin} disabled={!newPluginId.trim()}>
              <Plus className="h-3 w-3 mr-1" />
              Add Plugin
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add new plugin input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-plugin-id" className="sr-only">Plugin ID</Label>
              <Input
                id="new-plugin-id"
                value={newPluginId}
                onChange={(e) => setNewPluginId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPlugin();
                  }
                }}
                placeholder="plugin-id@scope (e.g., superpowers@superpowers-marketplace)"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Plugin list */}
          {pluginEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No plugins enabled. Add a plugin above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {pluginEntries.map(([pluginId, enabled]) => (
                <div
                  key={pluginId}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => handleToggle(pluginId, checked)}
                    />
                    <div>
                      <div className="font-mono text-sm">{pluginId}</div>
                      <div className="text-xs text-muted-foreground">
                        {enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePlugin(pluginId)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plugin info */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Note:</strong> Plugin IDs should follow the format:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Built-in plugins: <code className="font-mono">plugin-name@claude-code-plugins</code></li>
          <li>Official plugins: <code className="font-mono">plugin-name@claude-plugins-official</code></li>
          <li>Marketplace plugins: <code className="font-mono">plugin-name@marketplace-name</code></li>
        </ul>
      </div>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `bun test src/tests/unit/enabled-plugins-editor.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tests/unit/enabled-plugins-editor.test.tsx src/renderer/components/Settings/enabled-plugins-editor.tsx
git commit -m "feat: add enabled plugins editor with toggle and add/remove functionality"
```

---

## Task 6: Create Advanced Settings Editor

**Files:**
- Create: `src/renderer/components/Settings/advanced-settings-editor.tsx`
- Test: `src/tests/unit/advanced-settings-editor.test.tsx`

**Step 1: Write the failing test**

Create `src/tests/unit/advanced-settings-editor.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedSettingsEditor } from '@/renderer/components/Settings/advanced-settings-editor';

describe('AdvancedSettingsEditor', () => {
  it('should render alwaysThinkingEnabled toggle', () => {
    const handleChange = vi.fn();
    render(
      <AdvancedSettingsEditor
        settings={{ alwaysThinkingEnabled: false }}
        onChange={handleChange}
      />
    );

    expect(screen.getByText('Always Thinking Enabled')).toBeInTheDocument();
  });

  it('should toggle alwaysThinkingEnabled', () => {
    const handleChange = vi.fn();
    render(
      <AdvancedSettingsEditor
        settings={{ alwaysThinkingEnabled: false }}
        onChange={handleChange}
      />
    );

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    expect(handleChange).toHaveBeenCalledWith({
      alwaysThinkingEnabled: true,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/tests/unit/advanced-settings-editor.test.tsx`
Expected: FAIL with "Cannot find module '@/renderer/components/Settings/advanced-settings-editor'"

**Step 3: Write minimal implementation**

Create `src/renderer/components/Settings/advanced-settings-editor.tsx`:

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Brain } from 'lucide-react';
import { JsonFieldRenderer } from './json-field-renderer';
import type { ClaudeSettings } from './settings-types';

interface AdvancedSettingsEditorProps {
  settings: ClaudeSettings;
  onChange: (settings: ClaudeSettings) => void;
}

/**
 * Editor for advanced Claude Code settings
 */
export const AdvancedSettingsEditor: React.FC<AdvancedSettingsEditorProps> = ({
  settings,
  onChange,
}) => {
  const handleFieldChange = (key: string, value: unknown) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Always Thinking */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle className="text-sm">AI Behavior</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <JsonFieldRenderer
            fieldKey="alwaysThinkingEnabled"
            value={settings.alwaysThinkingEnabled ?? false}
            onChange={(value) => handleFieldChange('alwaysThinkingEnabled', value)}
          />
        </CardContent>
      </Card>

      {/* Future advanced settings can be added here */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Additional Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Additional advanced settings will appear here as they are added to settings.json.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `bun test src/tests/unit/advanced-settings-editor.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tests/unit/advanced-settings-editor.test.tsx src/renderer/components/Settings/advanced-settings-editor.tsx
git commit -m "feat: add advanced settings editor for AI behavior settings"
```

---

## Task 7: Update Settings Form to Include New Tabs

**Files:**
- Modify: `src/renderer/components/Settings/settings-form.tsx`
- Modify: `src/renderer/components/Settings/settings-types.ts`
- Test: `src/tests/unit/settings-form.test.tsx`

**Step 1: Write the failing test**

Create `src/tests/unit/settings-form.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { SettingsForm } from '@/renderer/components/Settings/settings-form';
import type { ClaudeSettings } from '@/renderer/components/Settings/settings-types';

describe('SettingsForm', () => {
  it('should render all tabs including env and plugins', () => {
    const settings: ClaudeSettings = {
      env: { ANTHROPIC_AUTH_TOKEN: 'test' },
      enabledPlugins: { 'test-plugin': true },
    };

    const handleChange = vi.fn();
    render(
      <SettingsForm
        settings={settings}
        onChange={handleChange}
        activeSection="env"
        onSectionChange={vi.fn()}
      />
    );

    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Plugins')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('should display env editor when env tab is active', () => {
    const settings: ClaudeSettings = {
      env: { ANTHROPIC_AUTH_TOKEN: 'test' },
    };

    const handleChange = vi.fn();
    render(
      <SettingsForm
        settings={settings}
        onChange={handleChange}
        activeSection="env"
        onSectionChange={vi.fn()}
      />
    );

    expect(screen.getByText('Standard Environment Variables')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/tests/unit/settings-form.test.tsx`
Expected: FAIL with tab not found

**Step 3: Update types first**

Modify `src/renderer/components/Settings/settings-types.ts`:

Update `SettingsFormProps` interface (around line 67-72):

```typescript
export interface SettingsFormProps {
  settings: ClaudeSettings;
  onChange: (settings: ClaudeSettings) => void;
  activeSection: 'permissions' | 'mcp' | 'hooks' | 'env' | 'plugins' | 'advanced';
  onSectionChange: (section: 'permissions' | 'mcp' | 'hooks' | 'env' | 'plugins' | 'advanced') => void;
}
```

**Step 4: Update component**

Modify `src/renderer/components/Settings/settings-form.tsx` completely:

```typescript
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionsEditor } from './permissions-editor';
import { McpServersEditor } from './mcp-servers-editor';
import { HooksEditor } from './hooks-editor';
import { EnvVarsEditor } from './env-vars-editor';
import { EnabledPluginsEditor } from './enabled-plugins-editor';
import { AdvancedSettingsEditor } from './advanced-settings-editor';
import type { SettingsFormProps } from './settings-types';

/**
 * Form-based editor for Claude settings with all configuration sections
 */
export const SettingsForm: React.FC<SettingsFormProps> = ({
  settings,
  onChange,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeSection}
        onValueChange={(v: string) =>
          onSectionChange(
            v as 'permissions' | 'mcp' | 'hooks' | 'env' | 'plugins' | 'advanced'
          )
        }
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="mcp">MCP</TabsTrigger>
          <TabsTrigger value="hooks">Hooks</TabsTrigger>
          <TabsTrigger value="env">Environment</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4">
          <TabsContent value="permissions" className="mt-0 h-full">
            <PermissionsEditor
              permissions={settings.permissions || {}}
              onChange={(perms) => onChange({ ...settings, permissions: perms })}
            />
          </TabsContent>

          <TabsContent value="mcp" className="mt-0 h-full">
            <McpServersEditor
              mcpServers={settings.mcpServers || {}}
              onChange={(servers) => onChange({ ...settings, mcpServers: servers })}
            />
          </TabsContent>

          <TabsContent value="hooks" className="mt-0 h-full">
            <HooksEditor
              hooks={settings.hooks || {}}
              onChange={(hooks) => onChange({ ...settings, hooks })}
            />
          </TabsContent>

          <TabsContent value="env" className="mt-0 h-full">
            <EnvVarsEditor
              env={settings.env || {}}
              onChange={(env) => onChange({ ...settings, env })}
            />
          </TabsContent>

          <TabsContent value="plugins" className="mt-0 h-full">
            <EnabledPluginsEditor
              plugins={settings.enabledPlugins || {}}
              onChange={(plugins) => onChange({ ...settings, enabledPlugins: plugins })}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-0 h-full">
            <AdvancedSettingsEditor
              settings={settings}
              onChange={onChange}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
```

**Step 5: Run test to verify it passes**

Run: `bun test src/tests/unit/settings-form.test.tsx`
Expected: PASS

**Step 6: Update default active section in settings-tab.tsx**

Modify `src/renderer/components/Settings/settings-tab.tsx` line 21:

Change:
```typescript
const [activeSection, setActiveSection] = useState<'permissions' | 'mcp' | 'hooks'>('permissions');
```

To:
```typescript
const [activeSection, setActiveSection] = useState<'permissions' | 'mcp' | 'hooks' | 'env' | 'plugins' | 'advanced'>('permissions');
```

**Step 7: Commit**

```bash
git add src/renderer/components/Settings/settings-form.tsx src/renderer/components/Settings/settings-types.ts src/renderer/components/Settings/settings-tab.tsx src/tests/unit/settings-form.test.tsx
git commit -m "feat: update settings form with env, plugins, and advanced tabs"
```

---

## Task 8: Add UI Components Missing from shadcn

**Files:**
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/switch.tsx`

**Step 1: Check if components exist**

Run: `ls src/components/ui/ | grep -E "label|switch"`

Expected: May not exist, need to create

**Step 2: Create Label component**

Create `src/components/ui/label.tsx`:

```typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/tailwind"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

**Step 3: Create Switch component**

Create `src/components/ui/switch.tsx`:

```typescript
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/utils/tailwind"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

**Step 4: Install dependencies**

Run: `bun add @radix-ui/react-label @radix-ui/react-switch`

**Step 5: Commit**

```bash
git add src/components/ui/label.tsx src/components/ui/switch.tsx package.json
git commit -m "feat: add Label and Switch UI components from shadcn"
```

---

## Task 9: Update Settings Tab Initial State

**Files:**
- Modify: `src/renderer/components/Settings/settings-tab.tsx`

**Step 1: Update activeSection default**

The type change was done in Task 7, but verify the initial state allows showing all sections.

**Step 2: Test the complete flow**

Run: `bun run dev`

Verify:
1. Settings tab loads without errors
2. All 6 tabs are visible: Permissions, MCP, Hooks, Environment, Plugins, Advanced
3. Environment tab shows all standard env vars
4. Plugins tab shows enabled plugins
5. Advanced tab shows alwaysThinkingEnabled toggle

**Step 3: Commit**

If any minor fixes needed:

```bash
git add src/renderer/components/Settings/settings-tab.tsx
git commit -m "fix: ensure settings tab properly initializes with all sections"
```

---

## Task 10: Integration Testing and Documentation

**Files:**
- Create: `docs/settings-configuration.md`

**Step 1: Create documentation**

Create `docs/settings-configuration.md`:

```markdown
# Claude Code Settings Configuration

This document describes all configurable settings in `.claude/settings.json`.

## Environment Variables (env)

Standard environment variables for Claude Code:

| Variable | Type | Description |
|----------|------|-------------|
| `ANTHROPIC_AUTH_TOKEN` | string | Authentication token for Anthropic API |
| `ANTHROPIC_BASE_URL` | string | Custom base URL for Anthropic API requests |
| `API_TIMEOUT_MS` | string | Request timeout in milliseconds |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | string | Disable telemetry and non-essential network requests |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | string | Model ID for Haiku (fast) responses |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | string | Model ID for Sonnet (balanced) responses |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | string | Model ID for Opus (quality) responses |

## Permissions (permissions)

Control which tools Claude can use:

```json
{
  "permissions": {
    "allow": ["Bash(cat:*)", "Read:*"],
    "deny": ["Bash(rm -rf:*)"]
  }
}
```

## MCP Servers (mcpServers)

Configure Model Context Protocol servers:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": { "API_KEY": "value" }
    }
  }
}
```

## Hooks (hooks)

Configure event hooks:

```json
{
  "hooks": {
    "user-prompt-submit": [
      { "type": "user-prompt", "command": "echo 'starting'", "description": "Log start" }
    ]
  }
}
```

## Enabled Plugins (enabledPlugins)

Control which plugins are enabled:

```json
{
  "enabledPlugins": {
    "superpowers@superpowers-marketplace": true,
    "ralph-wiggum@claude-code-plugins": true
  }
}
```

## Advanced Settings

- `alwaysThinkingEnabled`: Enable extended thinking for all conversations
```

**Step 2: Run full integration test**

Run: `bun run build`

Verify:
1. Build completes without errors
2. All TypeScript types are correct
3. No console warnings

**Step 3: Manual testing checklist**

Test each tab:
- [ ] Permissions: Add/remove allow/deny patterns
- [ ] MCP: Add/remove MCP servers
- [ ] Hooks: Add/remove hooks for events
- [ ] Environment: Set env vars, add custom vars
- [ ] Plugins: Toggle plugins, add new plugin
- [ ] Advanced: Toggle always thinking

Test save/load:
- [ ] Settings persist to file
- [ ] Settings load correctly on restart
- [ ] JSON editor mode works

**Step 4: Commit**

```bash
git add docs/settings-configuration.md
git commit -m "docs: add comprehensive settings configuration documentation"
```

---

## Summary

This plan creates a robust, universal JSON field editor system for Claude Code settings that:

1. **Automatically detects field types** and renders appropriate UI components
2. **Handles all JSON primitive types**: strings, numbers, booleans, arrays, objects
3. **Provides smart type inference** for secrets, URLs, models, durations
4. **Supports nested structures** with recursive rendering
5. **Is extensible** - new settings fields automatically get appropriate editors
6. **Maintains type safety** with full TypeScript support
7. **Follows TDD principles** with tests for each component

The system adds three new tabs to the settings form:
- **Environment**: For env vars (standard + custom)
- **Plugins**: For enabled plugins management
- **Advanced**: For AI behavior settings like alwaysThinkingEnabled

All while maintaining the existing Permissions, MCP, and Hooks tabs.
