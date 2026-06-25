"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import AppShell from "@/components/AppShell";
import LoginScreen from "@/components/LoginScreen";
import Onboarding, { PRE_LOGIN_SLIDES, POST_LOGIN_SLIDES } from "@/components/Onboarding";
import { getSupabase } from "@/lib/supabase";

const PRE_LOGIN_KEY = "ai-study-onboarding-pre-done";
const POST_LOGIN_KEY = "ai-study-onboarding-post-done";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [showPreLogin, setShowPreLogin] = useState(false);
  const [showPostLogin, setShowPostLogin] = useState(false);

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

  // Show pre-login onboarding on first ever visit
  useEffect(() => {
    if (!loading && !user) {
      const preDone = localStorage.getItem(PRE_LOGIN_KEY);
      if (!preDone) {
        const timer = setTimeout(() => setShowPreLogin(true), 400);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, user]);

  // Show post-login onboarding after first login
  useEffect(() => {
    if (user && !loading && appReady) {
      const postDone = localStorage.getItem(POST_LOGIN_KEY);
      if (!postDone) {
        const timer = setTimeout(() => setShowPostLogin(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, appReady]);

  const handlePreLoginDone = useCallback(() => {
    localStorage.setItem(PRE_LOGIN_KEY, "1");
    setShowPreLogin(false);
  }, []);

  const handlePostLoginDone = useCallback(() => {
    localStorage.setItem(POST_LOGIN_KEY, "1");
    setShowPostLogin(false);
  }, []);

  const handleLogout = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
  }, []);

  useEffect(() => {
    setAppReady(true);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background font-serif">
        <p className="text-base text-muted">Loading...</p>
      </div>
    );
  }

  const userId = user?.id || user?.email || "";
  const userEmail = user?.email || undefined;

  return (
    <>
      {showPreLogin && (
        <Onboarding
          slides={PRE_LOGIN_SLIDES}
          onComplete={handlePreLoginDone}
          doneKey="pre-login"
        />
      )}

      {!showPreLogin && !user && <LoginScreen />}

      {!showPreLogin && user && (
        <>
          <AppShell
            user={{
              id: userId,
              username: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
              email: userEmail,
            }}
            onLogout={handleLogout}
          />
          {showPostLogin && (
            <Onboarding
              slides={POST_LOGIN_SLIDES}
              onComplete={handlePostLoginDone}
              doneKey="post-login"
            />
          )}
        </>
      )}
    </>
  );
}