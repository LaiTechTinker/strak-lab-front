import { redirect } from "@tanstack/react-router";
import { isBackendEnabled } from "@/services/api";
import { getToken } from "@/services/backendApi";


/**
 * Route guard: blocks access when backend auth is enabled and there is no token.
 *
 * Usage: in TanStack Router route `beforeLoad`.
 */
export function requireAuth() {
  return async () => {
    // Only enforce when backend is enabled (per requirement)
    if (!isBackendEnabled) return;

    const token = getToken?.();
    if (!token) {
      throw redirect({ to: "/login" });
    }
  };
}

