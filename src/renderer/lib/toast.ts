import { toast } from "sonner";

// Success toast with consistent styling
export const showSuccess = (message: string) => {
  toast.success(message);
};

// Error toast with consistent styling
export const showError = (message: string, error?: unknown) => {
  console.error(message, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  toast.error(`${message}${errorMessage ? ": " + errorMessage : ""}`);
};

// Info toast
export const showInfo = (message: string) => {
  toast.info(message);
};

// Warning toast
export const showWarning = (message: string) => {
  toast.warning(message);
};

// Loading toast that can be resolved later
export const showLoading = (message: string) => {
  return toast.loading(message);
};

// Promise toast - handles loading/success/error automatically
export const withPromise = <T>(
  promise: Promise<T>,
  loading: string,
  success: string,
  error: string
): Promise<T> => {
  const result = toast.promise(promise, {
    loading,
    success,
    error,
  });
  // The result has an unwrap method, return the original promise
  return promise;
};
