import {
  type SessionMessage,
  SessionMessageSchema,
  type SessionSummary,
  SessionSummarySchema,
} from "./chatAtoms";

/**
 * Validates and parses a session message from unknown data
 * Returns the parsed data or throws if invalid
 */
export function validateSessionMessage(data: unknown): SessionMessage {
  return SessionMessageSchema.parse(data);
}

/**
 * Safely parses a session message, returning null if invalid
 */
export function safeParseSessionMessage(data: unknown): SessionMessage | null {
  try {
    return SessionMessageSchema.parse(data);
  } catch (error) {
    console.error("[safeParseSessionMessage] Validation failed:", error);
    return null;
  }
}

/**
 * Validates and parses a session summary from unknown data
 */
export function validateSessionSummary(data: unknown): SessionSummary {
  return SessionSummarySchema.parse(data);
}

/**
 * Safely parses a session summary, returning null if invalid
 */
export function safeParseSessionSummary(data: unknown): SessionSummary | null {
  try {
    return SessionSummarySchema.parse(data);
  } catch (error) {
    console.error("[safeParseSessionSummary] Validation failed:", error);
    return null;
  }
}

/**
 * Validates an array of session messages
 */
export function validateSessionMessages(data: unknown[]): SessionMessage[] {
  return data.map(validateSessionMessage);
}

/**
 * Safely parses an array of session messages, filtering out invalid ones
 */
export function safeParseSessionMessages(data: unknown[]): SessionMessage[] {
  return data
    .map(safeParseSessionMessage)
    .filter((m): m is SessionMessage => m !== null);
}

/**
 * Type guard to check if unknown data is a valid SessionMessage
 */
export function isSessionMessage(data: unknown): data is SessionMessage {
  const result = safeParseSessionMessage(data);
  return result !== null;
}

/**
 * Type guard to check if unknown data is a valid SessionSummary
 */
export function isSessionSummary(data: unknown): data is SessionSummary {
  const result = safeParseSessionSummary(data);
  return result !== null;
}
