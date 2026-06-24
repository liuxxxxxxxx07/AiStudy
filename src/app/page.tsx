"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import AppShell from "@/components/AppShell";
import LoginScreen from "@/components/LoginScreen";
import { getSupabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background font-serif">
        <p className="text-base text-muted">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const userId = user.id || user.email || "";
  const userEmail = user.email || undefined;

  return (
    <AppShell
      user={{
        id: userId,
        username: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: userEmail,
      }}
      onLogout={handleLogout}
    />
  );
}