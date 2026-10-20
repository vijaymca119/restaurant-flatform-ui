import { redirect, type ParsedLocation } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { ApiError, isApiConfigured } from "./api/client";
import { meQuery } from "./api/endpoints";
import type { CurrentUser } from "./api/types";

/**
 * Loads the signed-in user or redirects to /login on 401.
 * Returns null when the API isn't configured so screens can show the "not connected" state.
 * UI guard only — the backend enforces authorization on every call.
 */
export async function requireUser(
  queryClient: QueryClient,
  location: ParsedLocation,
): Promise<CurrentUser | null> {
  if (!isApiConfigured()) return null;
  try {
    return await queryClient.ensureQueryData(meQuery());
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    throw e;
  }
}
