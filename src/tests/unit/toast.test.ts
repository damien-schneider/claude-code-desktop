/**
 * Pragmatic tests for toast utility
 * Tests actual toast behavior with mocked sonner library
 */

import * as sonner from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  showError,
  showInfo,
  showLoading,
  showSuccess,
  showWarning,
  withPromise,
} from "@/renderer/lib/toast";

// Mock the sonner toast library
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(() => "mock-toast-id"),
    promise: vi.fn(),
  },
}));

const toast = sonner.toast as any;

describe("showSuccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call toast.success with message", () => {
    showSuccess("Operation successful");

    expect(toast.success).toHaveBeenCalledWith("Operation successful");
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("should handle empty string", () => {
    showSuccess("");

    expect(toast.success).toHaveBeenCalledWith("");
  });

  it("should handle special characters", () => {
    showSuccess("Success! \n\tTest");

    expect(toast.success).toHaveBeenCalledWith("Success! \n\tTest");
  });
});

describe("showError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  it("should call toast.error with message only", () => {
    showError("Operation failed");

    expect(console.error).toHaveBeenCalledWith("Operation failed", undefined);
    // String(undefined) is "undefined", which is truthy, so it gets appended
    expect(toast.error).toHaveBeenCalledWith("Operation failed: undefined");
  });

  it("should append error message when Error object provided", () => {
    const error = new Error("Network timeout");

    showError("Request failed", error);

    expect(console.error).toHaveBeenCalledWith("Request failed", error);
    expect(toast.error).toHaveBeenCalledWith("Request failed: Network timeout");
  });

  it("should append string error", () => {
    showError("Request failed", "timeout occurred");

    expect(console.error).toHaveBeenCalledWith(
      "Request failed",
      "timeout occurred"
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Request failed: timeout occurred"
    );
  });

  it("should handle Error without message", () => {
    // biome-ignore lint/suspicious/useErrorMessage: Testing error handling without message
    const error = new Error();

    showError("Failed", error);

    expect(toast.error).toHaveBeenCalledWith("Failed");
  });

  it("should convert non-Error objects to string", () => {
    showError("Failed", { code: 500 });

    expect(toast.error).toHaveBeenCalledWith("Failed: [object Object]");
  });

  it("should handle null error", () => {
    showError("Failed", null);

    expect(toast.error).toHaveBeenCalledWith("Failed: null");
  });

  it("should handle undefined error", () => {
    showError("Failed", undefined);

    // String(undefined) is "undefined"
    expect(toast.error).toHaveBeenCalledWith("Failed: undefined");
  });
});

describe("showInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call toast.info with message", () => {
    showInfo("Information message");

    expect(toast.info).toHaveBeenCalledWith("Information message");
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it("should handle empty string", () => {
    showInfo("");

    expect(toast.info).toHaveBeenCalledWith("");
  });
});

describe("showWarning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call toast.warning with message", () => {
    showWarning("Warning message");

    expect(toast.warning).toHaveBeenCalledWith("Warning message");
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it("should handle empty string", () => {
    showWarning("");

    expect(toast.warning).toHaveBeenCalledWith("");
  });
});

describe("showLoading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call toast.loading and return toast id", () => {
    const result = showLoading("Loading...");

    expect(toast.loading).toHaveBeenCalledWith("Loading...");
    expect(result).toBe("mock-toast-id");
  });

  it("should handle empty string", () => {
    const result = showLoading("");

    expect(toast.loading).toHaveBeenCalledWith("");
    expect(result).toBe("mock-toast-id");
  });
});

describe("withPromise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call toast.promise with correct parameters", () => {
    const promise = Promise.resolve("success");

    const result = withPromise(promise, "Loading...", "Success!", "Error!");

    expect(toast.promise).toHaveBeenCalledWith(promise, {
      loading: "Loading...",
      success: "Success!",
      error: "Error!",
    });
    expect(result).toBe(promise);
  });

  it("should return the original promise", async () => {
    const promise = Promise.resolve("data");

    const result = withPromise(promise, "Loading", "Success", "Error");

    expect(result).toBe(promise);
    await expect(result).resolves.toBe("data");
  });

  it("should handle rejecting promise", async () => {
    const promise = Promise.reject(new Error("Failed"));

    const result = withPromise(promise, "Loading", "Success", "Error");

    expect(result).toBe(promise);
    await expect(result).rejects.toThrow("Failed");
  });

  it("should handle promise with custom messages", () => {
    const promise = Promise.resolve();

    withPromise(
      promise,
      "Processing request...",
      "Request completed successfully",
      "Request failed"
    );

    expect(toast.promise).toHaveBeenCalledWith(promise, {
      loading: "Processing request...",
      success: "Request completed successfully",
      error: "Request failed",
    });
  });

  it("should handle empty messages", () => {
    const promise = Promise.resolve();

    withPromise(promise, "", "", "");

    expect(toast.promise).toHaveBeenCalledWith(promise, {
      loading: "",
      success: "",
      error: "",
    });
  });

  it("should preserve promise type", async () => {
    interface Result {
      id: number;
      name: string;
    }

    const promise: Promise<Result> = Promise.resolve({ id: 1, name: "Test" });

    const result = withPromise(promise, "Loading", "Success", "Error");

    // Type check: result should be Promise<Result>
    const value = await result;
    expect(value.id).toBe(1);
    expect(value.name).toBe("Test");
  });

  it("should handle promise that returns number", async () => {
    const promise = Promise.resolve(42);

    const result = withPromise(promise, "Loading", "Success", "Error");

    const value = await result;
    expect(value).toBe(42);
  });

  it("should handle promise that returns boolean", async () => {
    const promise = Promise.resolve(true);

    const result = withPromise(promise, "Loading", "Success", "Error");

    const value = await result;
    expect(value).toBe(true);
  });
});
