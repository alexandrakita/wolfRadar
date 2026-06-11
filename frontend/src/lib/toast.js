import { toast as sonner } from "sonner";

/**
 * Toast API aligned with dashboard.bidmanager (`react-toastify` usage).
 * Backed by Sonner + shadcn Toaster in the root layout.
 */
export const toast = {
  success(message, options) {
    return sonner.success(message, options);
  },
  error(message, options) {
    return sonner.error(message, options);
  },
  info(message, options) {
    return sonner.info(message, options);
  },
  warn(message, options) {
    return sonner.warning(message, options);
  },
  warning(message, options) {
    return sonner.warning(message, options);
  },
};
