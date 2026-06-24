"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      const sb = getSupabase();
      if (!sb) {
        setStatus("Supabase not configured");
        return;
      }

      const url = window.location.href;

      const { data, error } = await sb.auth.exchangeCodeForSession(url);
      if (error) {
        setStatus(`Authentication failed: ${error.message}`);
        return;
      }
      if (data.session) {
        router.replace("/");
      } else {
        const { data: sessionCheck } = await sb.auth.getSession();
        if (sessionCheck.session) {
          router.replace("/");
        } else {
          setStatus("No session created. Please try signing in again.");
        }
      }
    };
    handleCallback();
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center bg-background font-serif">
      <p className="text-base text-muted">{status}</p>
    </div>
  );
}