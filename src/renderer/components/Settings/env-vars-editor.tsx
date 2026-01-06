import { Plus, Trash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JsonFieldRenderer } from "./json-field-renderer";
import type { EnvVars } from "./settings-types";

/**
 * Standard environment variables with descriptions
 */
const STANDARD_ENV_VARS: Array<{
  key: keyof EnvVars;
  label: string;
  description: string;
  placeholder: string;
  type?: "text" | "password";
}> = [
  {
    key: "ANTHROPIC_AUTH_TOKEN",
    label: "Anthropic Auth Token",
    description: "Authentication token for Anthropic API",
    placeholder: "sk-ant-...",
    type: "password",
  },
  {
    key: "ANTHROPIC_BASE_URL",
    label: "Anthropic Base URL",
    description: "Base URL for Anthropic API (for proxy/custom endpoint)",
    placeholder: "https://api.anthropic.com",
  },
  {
    key: "API_TIMEOUT_MS",
    label: "Api Timeout Ms",
    description: "Timeout for API requests in milliseconds",
    placeholder: "60000",
  },
  {
    key: "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC",
    label: "Disable Nonessential Traffic",
    description: "Disable telemetry and nonessential API calls",
    placeholder: "true",
  },
  {
    key: "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    label: "Default Haiku Model",
    description: "Default model for Haiku",
    placeholder: "claude-3-5-haiku-20241022",
  },
  {
    key: "ANTHROPIC_DEFAULT_SONNET_MODEL",
    label: "Default Sonnet Model",
    description: "Default model for Sonnet",
    placeholder: "claude-3-5-sonnet-20241022",
  },
  {
    key: "ANTHROPIC_DEFAULT_OPUS_MODEL",
    label: "Default Opus Model",
    description: "Default model for Opus",
    placeholder: "claude-3-5-opus-20241022",
  },
];

/**
 * Custom environment variable state
 */
interface CustomVar {
  name: string;
  value: string;
}

interface EnvVarsEditorProps {
  env: EnvVars;
  onChange: (env: EnvVars) => void;
}

/**
 * Component for editing environment variables
 *
 * Displays standard env vars with descriptions and allows adding custom variables
 */
export function EnvVarsEditor({ env, onChange }: EnvVarsEditorProps) {
  const [customVars, setCustomVars] = useState<CustomVar[]>(
    Object.entries(env)
      .filter(([key]) => !STANDARD_ENV_VARS.some((std) => std.key === key))
      .map(([name, value]) => ({ name, value: value || "" }))
  );

  // Sync customVars state when env prop changes
  useEffect(() => {
    setCustomVars(
      Object.entries(env)
        .filter(([key]) => !STANDARD_ENV_VARS.some((std) => std.key === key))
        .map(([name, value]) => ({ name, value: value || "" }))
    );
  }, [env]);

  /**
   * Handle change to a standard env var
   */
  const handleStandardChange = (key: keyof EnvVars, value: string) => {
    onChange({
      ...env,
      [key]: value || undefined,
    });
  };

  /**
   * Handle change to a custom var name
   */
  const handleCustomNameChange = (index: number, name: string) => {
    const newCustomVars = [...customVars];
    const oldName = newCustomVars[index].name;
    newCustomVars[index].name = name;
    setCustomVars(newCustomVars);

    // Update env with new name, removing old entry
    const newEnv = { ...env };
    delete newEnv[oldName];
    if (name) {
      newEnv[name] = newCustomVars[index].value || undefined;
    }
    onChange(newEnv);
  };

  /**
   * Handle change to a custom var value
   */
  const handleCustomValueChange = (index: number, value: string) => {
    const newCustomVars = [...customVars];
    newCustomVars[index].value = value;
    setCustomVars(newCustomVars);

    // Update env
    const name = newCustomVars[index].name;
    if (name) {
      onChange({
        ...env,
        [name]: value || undefined,
      });
    }
  };

  /**
   * Add a new custom variable
   */
  const handleAddCustom = () => {
    const newVar: CustomVar = { name: "", value: "" };
    setCustomVars([...customVars, newVar]);
  };

  /**
   * Remove a custom variable
   */
  const handleRemoveCustom = (index: number) => {
    const newCustomVars = customVars.filter((_, i) => i !== index);
    setCustomVars(newCustomVars);

    // Remove from env
    const removedVar = customVars[index];
    const newEnv = { ...env };
    delete newEnv[removedVar.name];
    onChange(newEnv);
  };

  return (
    <div className="space-y-6">
      {/* Standard Environment Variables */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Standard Variables</h3>
        {STANDARD_ENV_VARS.map((varDef) => (
          <JsonFieldRenderer
            description={varDef.description}
            fieldKey={String(varDef.key)}
            key={String(varDef.key)}
            label={varDef.label}
            onChange={(value) =>
              handleStandardChange(varDef.key, value as string)
            }
            placeholder={varDef.placeholder}
            type={varDef.type || "text"}
            value={env[varDef.key] || ""}
          />
        ))}
      </div>

      {/* Custom Environment Variables */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Custom Variables</h3>
          <Button onClick={handleAddCustom} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" weight="regular" />
            Add Variable
          </Button>
        </div>

        {customVars.length === 0 ? (
          <Card className="p-4 text-muted-foreground">
            No custom variables defined. Click "Add Variable" to create one.
          </Card>
        ) : (
          <div className="space-y-3">
            {customVars.map((customVar, index) => (
              <Card className="p-4" key={customVar.name || `custom-${index}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="font-medium text-foreground text-sm">
                        {customVar.name || "New Variable Name"}
                      </label>
                      <Input
                        className="mt-1"
                        onChange={(e) =>
                          handleCustomNameChange(index, e.target.value)
                        }
                        placeholder="VARIABLE_NAME"
                        value={customVar.name}
                      />
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">
                        Value
                      </label>
                      <Input
                        className="mt-1"
                        onChange={(e) =>
                          handleCustomValueChange(index, e.target.value)
                        }
                        placeholder="variable value"
                        value={customVar.value}
                      />
                    </div>
                  </div>
                  <Button
                    className="mt-6"
                    onClick={() => handleRemoveCustom(index)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash
                      className="h-4 w-4 text-destructive"
                      weight="regular"
                    />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
