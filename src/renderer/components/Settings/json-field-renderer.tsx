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
} from "./json-field-detector";

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

interface FieldWrapperProps {
  fieldKey: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}

function FieldWrapper({
  fieldKey,
  label,
  description,
  children,
}: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label className="font-medium" htmlFor={fieldKey}>
        {label}
      </Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      {children}
    </div>
  );
}

interface StringFieldProps {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}

function StringField({
  fieldKey,
  value,
  onChange,
  label,
  description,
}: StringFieldProps) {
  const isMultiline = value.length > 100;

  return (
    <FieldWrapper description={description} fieldKey={fieldKey} label={label}>
      {isMultiline ? (
        <Textarea
          className="font-mono text-sm"
          id={fieldKey}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          value={value}
        />
      ) : (
        <Input
          className="font-mono"
          id={fieldKey}
          onChange={(e) => onChange(e.target.value)}
          type="text"
          value={value}
        />
      )}
    </FieldWrapper>
  );
}

interface NumberFieldProps {
  fieldKey: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
}

function NumberField({
  fieldKey,
  value,
  onChange,
  label,
  description,
}: NumberFieldProps) {
  return (
    <FieldWrapper description={description} fieldKey={fieldKey} label={label}>
      <Input
        className="font-mono"
        id={fieldKey}
        onChange={(e) => {
          const num = Number(e.target.value);
          onChange(Number.isNaN(num) ? 0 : num);
        }}
        type="number"
        value={value}
      />
    </FieldWrapper>
  );
}

interface BooleanFieldProps {
  fieldKey: string;
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

function BooleanField({
  fieldKey,
  value,
  onChange,
  label,
  description,
}: BooleanFieldProps) {
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
      <Switch checked={value} id={fieldKey} onCheckedChange={onChange} />
    </div>
  );
}

interface SecretFieldProps {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}

function SecretField({
  fieldKey,
  value,
  onChange,
  label,
  description,
}: SecretFieldProps) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <FieldWrapper description={description} fieldKey={fieldKey} label={label}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            className="pr-20 font-mono"
            id={fieldKey}
            onChange={(e) => onChange(e.target.value)}
            type={showSecret ? "text" : "password"}
            value={value}
          />
          {!showSecret && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="font-mono text-muted-foreground text-sm">
                {value.length > 0 ? "•••••••" : ""}
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
    </FieldWrapper>
  );
}

interface UrlFieldProps {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}

function UrlField({
  fieldKey,
  value,
  onChange,
  label,
  description,
}: UrlFieldProps) {
  return (
    <FieldWrapper description={description} fieldKey={fieldKey} label={label}>
      <Input
        className="font-mono"
        id={fieldKey}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com"
        type="url"
        value={value}
      />
    </FieldWrapper>
  );
}

interface ModelFieldProps {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}

function ModelField({
  fieldKey,
  value,
  onChange,
  label,
  description,
}: ModelFieldProps) {
  return (
    <FieldWrapper description={description} fieldKey={fieldKey} label={label}>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        id={fieldKey}
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        {CLAUDE_MODEL_OPTIONS.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface DurationFieldProps {
  fieldKey: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
}

function DurationField({
  fieldKey,
  value,
  onChange,
  label,
  description,
}: DurationFieldProps) {
  const unit =
    fieldKey.toLowerCase().includes("timeout") ||
    fieldKey.toLowerCase().includes("ms")
      ? "ms"
      : "s";

  return (
    <FieldWrapper description={description} fieldKey={fieldKey} label={label}>
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
          value={value}
        />
        <span className="flex items-center text-muted-foreground text-sm">
          {unit}
        </span>
      </div>
    </FieldWrapper>
  );
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

  if (fieldType === FieldType.STRING) {
    return (
      <StringField
        description={description}
        fieldKey={fieldKey}
        label={label}
        onChange={onChange}
        value={value as string}
      />
    );
  }

  if (fieldType === FieldType.NUMBER) {
    return (
      <NumberField
        description={description}
        fieldKey={fieldKey}
        label={label}
        onChange={onChange}
        value={value as number}
      />
    );
  }

  if (fieldType === FieldType.BOOLEAN) {
    return (
      <BooleanField
        description={description}
        fieldKey={fieldKey}
        label={label}
        onChange={onChange}
        value={value as boolean}
      />
    );
  }

  if (fieldType === FieldType.SECRET) {
    return (
      <SecretField
        description={description}
        fieldKey={fieldKey}
        label={label}
        onChange={onChange}
        value={value as string}
      />
    );
  }

  if (fieldType === FieldType.URL) {
    return (
      <UrlField
        description={description}
        fieldKey={fieldKey}
        label={label}
        onChange={onChange}
        value={value as string}
      />
    );
  }

  if (fieldType === FieldType.MODEL) {
    return (
      <ModelField
        description={description}
        fieldKey={fieldKey}
        label={label}
        onChange={onChange}
        value={value as string}
      />
    );
  }

  if (fieldType === FieldType.DURATION) {
    return (
      <DurationField
        description={description}
        fieldKey={fieldKey}
        label={label}
        onChange={onChange}
        value={value as number}
      />
    );
  }

  if (fieldType === FieldType.ARRAY) {
    return (
      <ArrayField
        depth={depth}
        description={description}
        fieldKey={fieldKey}
        fullPath={fullPath}
        label={label}
        onChange={onChange}
        parentPath={parentPath}
        value={value as unknown[]}
      />
    );
  }

  if (fieldType === FieldType.OBJECT) {
    return (
      <ObjectField
        depth={depth}
        description={description}
        fieldKey={fieldKey}
        label={label}
        onChange={onChange}
        parentPath={parentPath}
        value={value as Record<string, unknown>}
      />
    );
  }

  // Fallback for unknown types
  return (
    <FieldWrapper fieldKey={fieldKey} label={label}>
      <Input
        className="font-mono"
        id={fieldKey}
        onChange={(e) => onChange(e.target.value)}
        value={String(value ?? "")}
      />
    </FieldWrapper>
  );
}

interface ArrayFieldProps {
  fieldKey: string;
  value: unknown[];
  onChange: (value: unknown[]) => void;
  label: string;
  description?: string;
  fullPath: string;
  depth: number;
  parentPath: string;
}

function ArrayField({
  fieldKey,
  value,
  onChange,
  label,
  description,
  fullPath,
  depth,
  parentPath,
}: ArrayFieldProps) {
  const arrayType =
    value.length > 0 ? detectFieldType(value[0]) : FieldType.STRING;

  const getNewItem = (): unknown => {
    if (arrayType === FieldType.NUMBER) {
      return 0;
    }
    if (arrayType === FieldType.BOOLEAN) {
      return false;
    }
    if (arrayType === FieldType.ARRAY) {
      return [];
    }
    if (arrayType === FieldType.OBJECT) {
      return {};
    }
    return "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-medium">{label}</Label>
        <Button
          className="gap-1"
          onClick={() => onChange([...value, getNewItem()])}
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
        {value.map((item, index) => (
          <Card className="p-3" key={`${fullPath}[${index}]`}>
            <div className="flex gap-2">
              <div className="flex-1">
                <JsonFieldRenderer
                  depth={depth + 1}
                  fieldKey={`${fieldKey}[${index}]`}
                  onChange={(newValue) => {
                    const newArray = [...value];
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
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash className="h-4 w-4" weight="regular" />
              </Button>
            </div>
          </Card>
        ))}
        {value.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            No items. Click "Add Item" to create one.
          </Card>
        )}
      </div>
    </div>
  );
}

interface ObjectFieldProps {
  fieldKey: string;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  label: string;
  description?: string;
  depth: number;
  parentPath: string;
}

function ObjectField({
  fieldKey,
  value,
  onChange,
  label,
  description,
  depth,
  parentPath,
}: ObjectFieldProps) {
  const entries = Object.entries(value);

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
            onChange={(newValue) => onChange({ ...value, [key]: newValue })}
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
