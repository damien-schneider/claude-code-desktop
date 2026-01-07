import { Eye, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  detectFieldType,
  FieldType,
  getFieldDescription,
  getFieldLabel,
} from "./json-field-detector.ts";

const CLAUDE_MODEL_OPTIONS = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
] as const;

interface JsonFieldRendererProps {
  fieldKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
  depth?: number;
  parentPath?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: "text" | "password";
}

/**
 * Universal JSON field renderer that automatically selects appropriate UI controls
 * based on field type detection from json-field-detector.ts
 *
 * Supports:
 * - Strings (input/textbox)
 * - Numbers (input with type="number")
 * - Booleans (switch toggle)
 * - Arrays (list editor with add/remove)
 * - Objects (nested field rendering)
 * - Secrets (password input with show/hide)
 * - URLs (validated URL input)
 * - Models (dropdown selector for AI models)
 * - Durations (number input with unit selector)
 */
export function JsonFieldRenderer({
  fieldKey,
  value,
  onChange,
  depth = 0,
  parentPath = "",
}: JsonFieldRendererProps) {
  const fieldType = useMemo(
    () => detectFieldType(fieldKey, value),
    [fieldKey, value]
  );
  const label = useMemo(() => getFieldLabel(fieldKey), [fieldKey]);
  const description = useMemo(() => getFieldDescription(fieldKey), [fieldKey]);
  const fullPath = useMemo(
    () => (parentPath ? `${parentPath}.${fieldKey}` : fieldKey),
    [parentPath, fieldKey]
  );

  // Secret field state
  const [showSecret, setShowSecret] = useState(false);

  // Render string fields
  if (fieldType === FieldType.STRING) {
    const isMultiline = typeof value === "string" && value.length > 100;

    return (
      <div className="space-y-2">
        <Label className="font-medium" htmlFor={fieldKey}>
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        {isMultiline ? (
          <Textarea
            className="font-mono text-sm"
            id={fieldKey}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            value={value as string}
          />
        ) : (
          <Input
            className="font-mono"
            id={fieldKey}
            onChange={(e) => onChange(e.target.value)}
            type="text"
            value={value as string}
          />
        )}
      </div>
    );
  }

  // Render number fields
  if (fieldType === FieldType.NUMBER) {
    return (
      <div className="space-y-2">
        <Label className="font-medium" htmlFor={fieldKey}>
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        <Input
          className="font-mono"
          id={fieldKey}
          onChange={(e) => {
            const num = Number(e.target.value);
            onChange(Number.isNaN(num) ? 0 : num);
          }}
          type="number"
          value={value as number}
        />
      </div>
    );
  }

  // Render boolean fields
  if (fieldType === FieldType.BOOLEAN) {
    return (
      <div className="flex items-center justify-between space-y-2 py-2">
        <div className="space-y-0.5">
          <Label className="font-medium" htmlFor={fieldKey}>
            {label}
          </Label>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        <Switch
          checked={value as boolean}
          id={fieldKey}
          onCheckedChange={onChange}
        />
      </div>
    );
  }

  // Render secret fields (passwords, tokens, etc)
  if (fieldType === FieldType.SECRET) {
    return (
      <div className="space-y-2">
        <Label className="font-medium" htmlFor={fieldKey}>
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              className="pr-20 font-mono"
              id={fieldKey}
              onChange={(e) => onChange(e.target.value)}
              type={showSecret ? "text" : "password"}
              value={value as string}
            />
            {!showSecret && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="font-mono text-muted-foreground text-sm">
                  {typeof value === "string" && value.length > 0
                    ? "•••••••"
                    : ""}
                </span>
              </div>
            )}
          </div>
          <Button
            className="shrink-0"
            onClick={() => setShowSecret(!showSecret)}
            size="icon"
            type="button"
            variant="outline"
          >
            {showSecret ? (
              <EyeSlash className="h-4 w-4" weight="regular" />
            ) : (
              <Eye className="h-4 w-4" weight="regular" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Render URL fields
  if (fieldType === FieldType.URL) {
    return (
      <div className="space-y-2">
        <Label className="font-medium" htmlFor={fieldKey}>
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        <Input
          className="font-mono"
          id={fieldKey}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
          type="url"
          value={value as string}
        />
      </div>
    );
  }

  // Render model selector fields
  if (fieldType === FieldType.MODEL) {
    return (
      <div className="space-y-2">
        <Label className="font-medium" htmlFor={fieldKey}>
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          id={fieldKey}
          onChange={(e) => onChange(e.target.value)}
          value={value as string}
        >
          {CLAUDE_MODEL_OPTIONS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Render duration fields
  if (fieldType === FieldType.DURATION) {
    return (
      <div className="space-y-2">
        <Label className="font-medium" htmlFor={fieldKey}>
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        <div className="flex gap-2">
          <Input
            className="flex-1 font-mono"
            id={fieldKey}
            min={0}
            onChange={(e) => {
              const num = Number(e.target.value);
              onChange(Number.isNaN(num) ? 0 : num);
            }}
            type="number"
            value={value as number}
          />
          <span className="flex items-center text-muted-foreground text-sm">
            {fieldKey.toLowerCase().includes("timeout") ||
            fieldKey.toLowerCase().includes("ms")
              ? "ms"
              : "s"}
          </span>
        </div>
      </div>
    );
  }

  // Render array fields
  if (fieldType === FieldType.ARRAY) {
    const arrayValue = value as unknown[];
    const arrayType =
      arrayValue.length > 0 ? detectFieldType(arrayValue[0]) : FieldType.STRING;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <Button
            className="gap-1"
            onClick={() => {
              const newItem =
                arrayType === FieldType.NUMBER
                  ? 0
                  : arrayType === FieldType.BOOLEAN
                    ? false
                    : arrayType === FieldType.ARRAY
                      ? []
                      : arrayType === FieldType.OBJECT
                        ? {}
                        : "";
              onChange([...arrayValue, newItem]);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus className="h-3 w-3" weight="regular" />
            Add Item
          </Button>
        </div>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        <div className="space-y-2">
          {arrayValue.map((item, index) => (
            <Card className="p-3" key={`${fullPath}[${index}]`}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <JsonFieldRenderer
                    depth={depth + 1}
                    fieldKey={`${fieldKey}[${index}]`}
                    onChange={(newValue) => {
                      const newArray = [...arrayValue];
                      newArray[index] = newValue;
                      onChange(newArray);
                    }}
                    parentPath={
                      parentPath ? `${parentPath}.${fieldKey}` : fieldKey
                    }
                    value={item}
                  />
                </div>
                <Button
                  className="shrink-0"
                  onClick={() => {
                    const newArray = arrayValue.filter((_, i) => i !== index);
                    onChange(newArray);
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash className="h-4 w-4" weight="regular" />
                </Button>
              </div>
            </Card>
          ))}
          {arrayValue.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              No items. Click "Add Item" to create one.
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Render object fields (nested)
  if (fieldType === FieldType.OBJECT) {
    const objectValue = value as Record<string, unknown>;
    const entries = Object.entries(objectValue);

    return (
      <Card className={depth > 0 ? "border-2" : ""}>
        <CardHeader className={depth === 0 ? undefined : "px-4 py-3"}>
          <CardTitle className={depth === 0 ? undefined : "text-base"}>
            {label}
          </CardTitle>
          {description && depth === 0 && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map(([key, val]) => (
            <JsonFieldRenderer
              depth={depth + 1}
              fieldKey={key}
              key={key}
              onChange={(newValue) => {
                onChange({
                  ...objectValue,
                  [key]: newValue,
                });
              }}
              parentPath={parentPath ? `${parentPath}.${fieldKey}` : fieldKey}
              value={val}
            />
          ))}
          {entries.length === 0 && (
            <div className="py-4 text-center text-muted-foreground">
              Empty object
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback for unknown types
  return (
    <div className="space-y-2">
      <Label className="font-medium" htmlFor={fieldKey}>
        {label}
      </Label>
      <Input
        className="font-mono"
        id={fieldKey}
        onChange={(e) => onChange(e.target.value)}
        value={String(value ?? "")}
      />
    </div>
  );
}
