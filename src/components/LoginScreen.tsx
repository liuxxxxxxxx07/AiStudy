"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const getRedirectUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return "/auth/callback";
};

type OAuthStep = "redirecting" | "consent" | "callback";

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [authError, setAuthError] = useState("");
  const [oauthProvider, setOauthProvider] = useState<"google" | "github" | null>(null);
  const [oauthStep, setOauthStep] = useState<OAuthStep>("redirecting");
  const loadTime = useRef(Date.now());

  useEffect(() => {
    loadTime.current = Date.now();
  }, [authMode]);

  const signInWith = async (provider: "google" | "github") => {
    if (Date.now() - loadTime.current < 2000) return;
    setAuthError("");

    const isRealSupabase = isSupabaseConfigured();

    if (isRealSupabase) {
      setLoading(provider);
      const sb = getSupabase();
      if (!sb) return;
      const { data, error } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getRedirectUrl() },
      });
      if (error) {
        setAuthError(error.message);
        setLoading(null);
      }
    } else {
      setOauthProvider(provider);
      setOauthStep("redirecting");
      await new Promise((r) => setTimeout(r, 1200));
      setOauthStep("consent");
    }
  };

  const confirmOAuth = async () => {
    if (!oauthProvider) return;
    setOauthStep("callback");
    await new Promise((r) => setTimeout(r, 800));
    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (!sb) { setAuthError("Auth unavailable"); setOauthProvider(null); return; }
      setLoading(oauthProvider);
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: oauthProvider,
        options: { redirectTo: getRedirectUrl() },
      });
      if (error) {
        setAuthError(error.message);
        setLoading(null);
      }
    } else {
      const sb = getSupabase();
      if (!sb) { setAuthError("Auth unavailable"); setOauthProvider(null); return; }
      setLoading(oauthProvider);
      const { error } = await sb.auth.signInWithOAuth({
        provider: oauthProvider,
        options: { redirectTo: getRedirectUrl() },
      });
      if (error) setAuthError(error.message);
      setLoading(null);
      setOauthProvider(null);
    }
  };

  const cancelOAuth = () => {
    setOauthProvider(null);
    setAuthError("Sign in cancelled");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setEmailError("");
    setEmailSent(false);

    if (honeypot) {
      setAuthError("Bot detected");
      return;
    }

    if (Date.now() - loadTime.current < 2000) {
      setAuthError("Please wait before submitting");
      return;
    }

    if (!email.trim()) { setEmailError("Enter your email"); return; }
    if (!password.trim()) { setEmailError("Enter a password"); return; }
    const sb = getSupabase();
    if (!sb) { setEmailError("Supabase not configured"); return; }
    setEmailLoading(true);
    if (authMode === "signup") {
      const { error } = await sb.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: getRedirectUrl() },
      });
      if (error) setEmailError(error.message); else setEmailSent(true);
    } else {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setEmailError(error.message);
    }
    setEmailLoading(false);
  };

  const oauthLabel = oauthProvider === "google" ? "Google" : "GitHub";

  return (
    <div className="flex h-full bg-background font-serif">
      {/* Left - full brand panel */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#0a0a0a] to-[#111] items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-white/[0.015] rounded-full blur-[150px]" />
        </div>
        <div className="relative text-center px-16">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white/80" />
          </div>
          <h1 className="text-6xl font-bold text-white tracking-tight mb-4">
            STEM
          </h1>
          <p className="text-lg text-white/35 max-w-xs mx-auto leading-relaxed">
            Learning engine.
          </p>
          <div className="mt-8 space-y-2 text-sm text-white/40">
            <p>AI problem solving</p>
            <p>Knowledge Base & Wiki</p>
            <p>Question Bank & Flashcards</p>
            <p>Mock Exam & Deep Search</p>
          </div>
        </div>
      </div>

      {/* Right - Login */}
      <div className="flex-1 flex items-center justify-center p-10 relative">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">STEM</h1>
            <p className="text-base text-muted mt-1">Learning engine</p>
          </div>

          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
            {authMode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-base text-muted/80 mb-8">
            {authMode === "signin" ? "Sign in to continue" : "Start learning"}
          </p>

          {authError && (
            <p className="text-sm text-red-500 font-semibold mb-4">{authError}</p>
          )}

          {/* OAuth */}
          <div className="space-y-3">
            <button
              onClick={() => signInWith("google")}
              disabled={loading !== null || oauthProvider !== null}
              className="w-full h-12 rounded-xl border border-divider text-foreground text-base font-semibold flex items-center justify-center gap-3 hover:bg-muted/5 hover:border-foreground/20 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              onClick={() => signInWith("github")}
              disabled={loading !== null || oauthProvider !== null}
              className="w-full h-12 rounded-xl border border-divider text-foreground text-base font-semibold flex items-center justify-center gap-3 hover:bg-muted/5 hover:border-foreground/20 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-divider" />
            <span className="text-base text-muted">or</span>
            <div className="h-px flex-1 bg-divider" />
          </div>

          {/* Email */}
          {emailSent ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">Check your email</p>
              <p className="text-sm text-muted">Confirmation sent to {email}</p>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-12 rounded-xl border border-divider bg-transparent px-4 text-base text-foreground placeholder:text-muted/40 outline-none focus:border-foreground/30 transition-colors"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 rounded-xl border border-divider bg-transparent px-4 text-base text-foreground placeholder:text-muted/40 outline-none focus:border-foreground/30 transition-colors"
              />

              {emailError && (
                <p className="text-sm text-red-500 font-semibold">{emailError}</p>
              )}

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full h-12 rounded-xl bg-foreground text-background text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {emailLoading ? "Please wait..." : authMode === "signin" ? "Sign in" : "Create account"}
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); setEmailError(""); }}
                className="w-full text-center text-base text-muted hover:text-foreground transition-colors"
              >
                {authMode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-base text-muted">
            50 free credits · Knowledge Base · Wiki · Flashcards · No credit card
            <button onClick={() => router.push("/pricing")} className="ml-1 text-foreground underline underline-offset-2 hover:text-muted transition-colors font-semibold">
              Pricing
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted/60">
            <button onClick={() => router.push("/terms")} className="hover:text-foreground transition-colors">Terms</button>
            <span>·</span>
            <button onClick={() => router.push("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
            <span>·</span>
            <button onClick={() => router.push("/refund")} className="hover:text-foreground transition-colors">Refund</button>
          </div>
        </div>

        {/* OAuth overlay */}
        {oauthProvider && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            {oauthStep === "redirecting" && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <p className="text-white/80 text-sm">Redirecting to {oauthLabel}...</p>
              </div>
            )}

            {oauthStep === "consent" && (
              <div className="w-full max-w-sm bg-background rounded-2xl border border-divider p-8 shadow-2xl">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center ${oauthProvider === "google" ? "bg-blue-50" : "bg-gray-100"}`}>
                    {oauthProvider === "google" ? (
                      <svg className="w-8 h-8" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#333">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Sign in with {oauthLabel}</h3>
                  <p className="text-sm text-muted mb-6">
                    STEM would like to access your {oauthLabel} account profile information
                  </p>

                  <div className="border border-divider rounded-xl p-4 mb-6 bg-muted/5 text-left text-xs text-muted space-y-2">
                    <p className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-muted" /> View your email address</p>
                    <p className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-muted" /> View your profile name</p>
                    <p className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-muted" /> View your avatar</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={cancelOAuth}
                      className="flex-1 h-12 rounded-xl border border-divider text-foreground text-base font-semibold hover:bg-muted/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmOAuth}
                      className="flex-1 h-12 rounded-xl bg-foreground text-background text-base font-semibold hover:opacity-90 transition-opacity"
                    >
                      Allow
                    </button>
                  </div>
                </div>
              </div>
            )}

            {oauthStep === "callback" && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <p className="text-white/80 text-sm">Completing authentication...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pricing floating */}
      <div className="absolute top-5 right-5 z-10">
        <button
          onClick={() => router.push("/pricing")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-muted hover:text-foreground border border-divider hover:border-foreground/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Pricing
        </button>
      </div>
    </div>
  );
}