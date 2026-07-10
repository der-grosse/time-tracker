"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useJWTAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

function useJWTAuth() {
  const mountedRef = useRef(true);
  const tokenRef = useRef<string | undefined>(undefined);
  const lastTokenUpdate = useRef<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}) => {
      console.log("Fetching access token, forceRefreshToken:", forceRefreshToken);
      if (!forceRefreshToken && tokenRef.current) {
        console.log("Returning cached token:", tokenRef.current);
        return tokenRef.current;
      }

      // If the token was updated recently, reuse it even if forceRefreshToken is true
      // This prevents excessive token refreshes within a short time window -> by default convex refetches the token as long as it does not have a response from the server which can lead to many requests
      if (
        lastTokenUpdate.current &&
        Date.now() - lastTokenUpdate.current.getTime() < 30 * 1000 &&
        tokenRef.current
      ) {
        console.log("Returning recently updated token:", tokenRef.current);
        return tokenRef.current;
      }

      if (mountedRef.current) {
        setIsLoading(true);
      }

      try {
        const response = await fetch("/api/auth/token", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Unable to load JWT token");
        }

        const payload = (await response.json()) as { token?: string };
        if (!payload?.token) {
          throw new Error("Missing token from auth response");
        }

        tokenRef.current = payload.token;
        if (mountedRef.current) {
          setIsAuthenticated(true);
        }
        lastTokenUpdate.current = new Date();
        console.log("Fetched new token:", payload.token);
        return payload.token;
      } catch (error) {
        console.error("Error fetching auth token:", error);
        tokenRef.current = undefined;
        if (mountedRef.current) {
          setIsAuthenticated(false);
        }
        console.log("Returning undefined token due to error");
        throw error;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    fetchAccessToken({ forceRefreshToken: true }).catch(() => {
      // Auth state already reflects failure
    });
  }, [fetchAccessToken]);

  console.log("useJWTAuth state:", { isLoading, isAuthenticated });

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      fetchAccessToken,
    }),
    [isLoading, isAuthenticated, fetchAccessToken],
  );
}
