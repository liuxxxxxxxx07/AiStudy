"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFreshSupabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing authentication...");

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      const sb = getFreshSupabase();
      if (!sb) {
        setStatus("Supabase not configured");
        return;
      }

      const { data: { session } } = await sb.auth.getSession();
      if (cancelled) return;

      if (session) {
        router.replace("/");
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      if (error || errorDescription) {
        setStatus(errorDescription || `Authentication failed: ${error}`);
        return;
      }

      if (code) {
        const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setStatus(`Authentication failed: ${exchangeError.message}`);
          return;
        }
        const { data: { session: newSession } } = await sb.auth.getSession();
        if (newSession) {
          router.replace("/");
          return;
        }
      }

      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );
      const hashError = hashParams.get("error");
      const hashErrorDesc = hashParams.get("error_description");
      if (hashError || hashErrorDesc) {
        setStatus(hashErrorDesc || `Authentication failed: ${hashError}`);
        return;
      }

      const hashAccessToken = hashParams.get("access_token");
      if (hashAccessToken) {
        const { error: refreshError } = await sb.auth.refreshSession();
        if (!refreshError) {
          const { data: { session: refreshedSession } } = await sb.auth.getSession();
          if (refreshedSession) {
            router.replace("/");
            return;
          }
        }
      }

      setStatus(
        "Authentication did not complete. Please try signing in again."
      );
    };

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center bg-background font-serif">
      <p className="text-base text-muted">{status}</p>
    </div>
  );
}