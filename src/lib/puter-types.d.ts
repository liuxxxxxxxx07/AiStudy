interface ChatChunk {
  text?: string;
  reasoning?: string;
  type?: string;
  image?: { type: string; image_url: { url: string } };
  message?: { content: string };
}

declare global {
  var puter: {
    auth: {
      signIn: (opts?: { attempt_temp_user_creation?: boolean }) => Promise<{ user: Record<string, unknown> }>;
      signOut: () => Promise<void>;
      isSignedIn: () => Promise<boolean>;
      getUser: () => Promise<Record<string, unknown>>;
    };
    ai: {
      chat: (messages: unknown, options?: Record<string, unknown>) => Promise<any>;
      listModels: (provider?: string) => Promise<Array<{ id: string; provider: string; name?: string }>>;
    };
    fs: {
      write: (path: string, data: File | string | Blob) => Promise<{ path: string }>;
      read: (path: string) => Promise<Blob>;
      delete: (path: string) => Promise<void>;
    };
    kv: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  };
}

export {};