import { createClient, SupabaseClient, Session, AuthChangeEvent } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

function createMockClient(): SupabaseClient {
  const STORAGE_KEY = "dev_auth_session";
  const listeners: Set<AuthListener> = new Set();

  const getStoredSession = (): Session | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const notify = (event: AuthChangeEvent, session: Session | null) => {
    listeners.forEach((fn) => fn(event, session));
  };

  const client = createClient(
    "https://dev-mode.supabase.co",
    "dev-mode-key",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  (client.auth as any).getSession = async () => {
    return { data: { session: getStoredSession() }, error: null };
  };

  (client.auth as any).onAuthStateChange = (callback: AuthListener) => {
    listeners.add(callback);
    const session = getStoredSession();
    if (session) callback("INITIAL_SESSION", session);
    return {
      data: { subscription: { unsubscribe: () => listeners.delete(callback) } },
    };
  };

  (client.auth as any).signInWithOAuth = async ({
    provider,
  }: {
    provider: string;
  }) => {
    const session: Session = {
      access_token: "dev_access_token",
      refresh_token: "dev_refresh_token",
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: "bearer",
      user: {
        id: `dev_${provider}_${Date.now()}`,
        email: `dev@${provider}.com`,
        app_metadata: {},
        user_metadata: {
          full_name: `Dev ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          avatar_url: "",
        },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    notify("SIGNED_IN", session);
    return { data: { provider }, error: null };
  };

  (client.auth as any).signInWithPassword = async ({
    email,
  }: {
    email: string;
    password: string;
  }) => {
    const session: Session = {
      access_token: "dev_access_token",
      refresh_token: "dev_refresh_token",
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: "bearer",
      user: {
        id: `dev_email_${Date.now()}`,
        email: email || "dev@example.com",
        app_metadata: {},
        user_metadata: { full_name: (email || "dev@example.com").split("@")[0] },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    notify("SIGNED_IN", session);
    return { data: { user: session.user, session }, error: null };
  };

  (client.auth as any).signUp = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    return (client.auth as any).signInWithPassword({ email, password });
  };

  (client.auth as any).signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    notify("SIGNED_OUT", null);
    return { error: null };
  };

  return client;
}

let _client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (_client === undefined) {
    if (isSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        console.log("[Supabase] Using real Supabase client");
      }
      _client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: typeof window !== "undefined" ? window.localStorage : undefined,
        },
      });
    } else {
      if (typeof window !== "undefined") {
        console.warn(
          "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Using dev mock auth."
        );
      }
      _client = createMockClient();
    }
  }
  return _client;
}