"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import AppShell from "@/components/AppShell";
import LoginScreen from "@/components/LoginScreen";
import PaymentPlans from "@/components/PaymentPlans";
import { getCreditData } from "@/lib/credits";
import { getSupabase } from "@/lib/supabase";

type Page = "app" | "login" | "plans";

export default function Home() {
  const [page, setPage] = useState<Page>("login");
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
        setPage("app");
      }
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setPage("app");
        } else {
          setUser(null);
          setPage("login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
    setPage("login");
  }, []);

  const handlePlans = useCallback(() => setPage("plans"), []);
  const handleBackFromPlans = useCallback(() => setPage("login"), []);

  const userId = user?.id || user?.email || "";
  const userEmail = user?.email || undefined;
  const currentTier = userId ? getCreditData(userId).tier : "free";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background font-serif">
        <p className="text-base text-muted">Loading...</p>
      </div>
    );
  }

  if (page === "login") {
    return <LoginScreen onPlans={handlePlans} />;
  }

  if (page === "plans") {
    return (
      <PaymentPlans
        onBack={handleBackFromPlans}
        userId={userId}
        userEmail={userEmail}
        currentTier={currentTier}
      />
    );
  }

  return <AppShell user={user ? { id: userId, username: user.user_metadata?.full_name || user.email?.split("@")[0] || "User", email: userEmail } : null} onLogout={handleLogout} />;
}