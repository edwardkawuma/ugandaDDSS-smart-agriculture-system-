import { toast } from "sonner";

// Re-export toast from sonner for convenience
export { toast };

export interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Global toast utility functions for consistent notifications across the app
 */
export const toastUtils = {
  /**
   * Show a success toast notification
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },

  /**
   * Show a loading toast notification
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      description: options?.description,
      duration: Infinity, // Loading toasts don't auto-dismiss
    });
  },

  /**
   * Show a promise-based toast (loading -> success/error)
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: options?.duration,
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

// Convenience exports for direct usage
export const {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  promise: showPromise,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
} = toastUtils;

// Default export for easy importing
export default toastUtils;
