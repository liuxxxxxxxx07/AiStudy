"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import LoginScreen from "@/components/LoginScreen";
import PaymentPlans from "@/components/PaymentPlans";
import { getCreditData } from "@/lib/credits";

type Page = "app" | "login" | "plans";

declare var puter: {
  auth: {
    isSignedIn: () => Promise<boolean>;
    getUser: () => Promise<Record<string, unknown>>;
    signIn: (opts?: { attempt_temp_user_creation?: boolean }) => Promise<{ user: Record<string, unknown> }>;
  };
};

export default function Home() {
  const [page, setPage] = useState<Page>("login");
  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const check = async () => {
      if (typeof puter !== "undefined" && puter.auth) {
        try {
          const signedIn = await puter.auth.isSignedIn();
          if (signedIn) {
            const u = await puter.auth.getUser();
            setUser(u);
            setPage("app");
          }
        } catch {}
      }
    };
    check();
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      const res = await puter.auth.signIn({ attempt_temp_user_creation: true });
      setUser(res.user || res);
      setPage("app");
    } catch {
      // User cancelled
    }
  }, []);

  const handlePlans = useCallback(() => setPage("plans"), []);
  const handleBackFromPlans = useCallback(() => setPage("login"), []);

  const userId = (user?.id as string) || (user?.username as string) || "";
  const userEmail = user?.email as string | undefined;
  const currentTier = userId ? getCreditData(userId).tier : "free";

  if (page === "login") {
    return <LoginScreen onLogin={handleLogin} onPlans={handlePlans} />;
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

  return <AppShell user={user} />;
}