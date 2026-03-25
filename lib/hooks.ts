"use client";

import { useState, useCallback, useRef } from "react";

const REQUEST_TIMEOUT_MS = 180_000;

interface UseApiCallOptions<T> {
  /** Called when the API call succeeds */
  onSuccess?: (data: T) => void;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  call: (url: string, body: Record<string, unknown>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Shared hook for calling API routes with timeout, error handling,
 * and automatic Gemini API key injection.
 */
export function useApiCall<T>(
  opts?: UseApiCallOptions<T>
): UseApiCallReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    abortRef.current?.abort();
  }, []);

  const call = useCallback(
    async (url: string, body: Record<string, unknown>): Promise<T | null> => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      setLoading(true);
      setError(null);
      setData(null);

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error ?? `Request failed (${res.status})`);

        // The response shape varies: { analysis }, { reply }, { email }, etc.
        // Return the full json and let caller pick the right field,
        // or use the first non-error value.
        setData(json as T);
        opts?.onSuccess?.(json as T);
        return json as T;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
        return null;
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    },
    [opts]
  );

  return { data, loading, error, call, reset };
}

/**
 * Read the stored Gemini API key from localStorage.
 * Returns empty string if not set.
 */
export function getGeminiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("creatoriq_gemini_key") ?? "";
}
