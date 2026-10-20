import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ApiError } from "./lib/api/client";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // Don't retry auth, permission, validation or "not configured" errors.
        retry: (count, err) =>
          !(err instanceof ApiError && (err.status === 0 && err.code === "API_NOT_CONFIGURED" || (err.status >= 400 && err.status < 500))) &&
          count < 2,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
