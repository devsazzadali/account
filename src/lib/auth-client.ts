// AccountStoreOne — browser auth client (Neon Auth / Managed Better Auth).
//
// Replaces the old hosted-auth calls with same-origin requests to the
// /api/auth/* proxy (which forwards to Neon Auth). Return shapes mirror
// what the screens were written against ({ data: { user, session }, error }).
// After sign-up/sign-in the app profile row is materialized by calling
// GET /api/me (the server creates it on first sight of the auth user).

export interface AuthUserShape {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  user_metadata: { user_name?: string; full_name?: string; avatar_url?: string };
}

export interface AuthSessionShape {
  user: AuthUserShape;
  access_token: string;
}

type AuthResult = {
  data: { user: AuthUserShape | null; session: AuthSessionShape | null };
  error: { message: string } | null;
};

function toUserShape(u: any): AuthUserShape | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    email_confirmed_at: u.emailVerified ? new Date().toISOString() : null,
    user_metadata: { user_name: u.name || undefined, full_name: u.name || undefined, avatar_url: u.image || undefined },
  };
}

let cachedSession: AuthSessionShape | null = null;
let cacheAt = 0;

async function fetchSession(force = false): Promise<AuthSessionShape | null> {
  if (!force && cachedSession && Date.now() - cacheAt < 10_000) return cachedSession;
  try {
    const res = await fetch("/api/auth/get-session", { credentials: "same-origin" });
    if (!res.ok) {
      cachedSession = null;
      return null;
    }
    const json = await res.json();
    const user = toUserShape(json?.user);
    cachedSession = user ? { user, access_token: json?.session?.token || "" } : null;
    cacheAt = Date.now();
    return cachedSession;
  } catch {
    return null;
  }
}

async function ensureProfile() {
  try {
    await fetch("/api/me", { credentials: "same-origin" });
  } catch {
    // profile creation is retried on the next /api/me or data call
  }
}

async function post(path: string, body: Record<string, unknown>): Promise<{ json: any; res: Response }> {
  const res = await fetch(`/api/auth/${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { json, res };
}

function errMessage(json: any, fallback: string): string {
  return json?.message || json?.error?.message || json?.error || fallback;
}

export const auth = {
  async getSession(): Promise<{ data: { session: AuthSessionShape | null } }> {
    const session = await fetchSession();
    return { data: { session } };
  },

  async signInWithPassword(input: { email: string; password: string }): Promise<AuthResult> {
    const { json, res } = await post("sign-in/email", { email: input.email, password: input.password });
    if (!res.ok) return { data: { user: null, session: null }, error: { message: errMessage(json, "Invalid email or password") } };
    cacheAt = 0;
    const user = toUserShape(json.user);
    cachedSession = user ? { user, access_token: json.token || "" } : null;
    cacheAt = Date.now();
    if (user) await ensureProfile();
    return { data: { user, session: cachedSession }, error: null };
  },

  async signUp(input: {
    email: string;
    password: string;
    options?: { data?: { user_name?: string; full_name?: string } };
  }): Promise<AuthResult> {
    const name = input.options?.data?.full_name || input.options?.data?.user_name || input.email.split("@")[0];
    const { json, res } = await post("sign-up/email", { email: input.email, password: input.password, name });
    if (!res.ok) return { data: { user: null, session: null }, error: { message: errMessage(json, "Registration failed") } };
    cacheAt = 0;
    const user = toUserShape(json.user);
    cachedSession = user ? { user, access_token: json.token || "" } : null;
    cacheAt = Date.now();
    if (user) await ensureProfile();
    return { data: { user, session: cachedSession }, error: null };
  },

  async signInWithOAuth(input: { provider: string; options?: { redirectTo?: string } }): Promise<{ error: { message: string } | null }> {
    const callbackURL = input.options?.redirectTo || `${window.location.origin}/dashboard`;
    try {
      const { json, res } = await post("sign-in/social", { provider: input.provider, callbackURL });
      if (!res.ok) return { error: { message: errMessage(json, "Social sign-in failed") } };
      if (json?.url) {
        window.location.href = json.url;
        return { error: null };
      }
      return { error: { message: "Social sign-in is not available for this provider" } };
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : "Social sign-in failed" } };
    }
  },

  async signOut(): Promise<{ error: null }> {
    try {
      await post("sign-out", {});
    } catch {
      // session cookie may already be gone; treat as signed out
    }
    cachedSession = null;
    cacheAt = 0;
    return { error: null };
  },

  /** Change password (requires the current password — Better Auth rule). */
  async updateUser(input: { password?: string; currentPassword?: string; data?: Record<string, unknown> }): Promise<{ data: { user: AuthUserShape | null }; error: { message: string } | null }> {
    if (input.password) {
      const { json, res } = await post("change-password", {
        newPassword: input.password,
        currentPassword: input.currentPassword || "",
        revokeOtherSessions: false,
      });
      if (!res.ok) return { data: { user: null }, error: { message: errMessage(json, "Password change failed") } };
      return { data: { user: toUserShape(json.user) }, error: null };
    }
    if (input.data) {
      const { json, res } = await post("update-user", input.data);
      if (!res.ok) return { data: { user: null }, error: { message: errMessage(json, "Update failed") } };
      return { data: { user: toUserShape(json) }, error: null };
    }
    return { data: { user: null }, error: null };
  },

  async resetPasswordForEmail(email: string, opts?: { redirectTo?: string }): Promise<{ error: { message: string } | null }> {
    const redirectTo = opts?.redirectTo || `${window.location.origin}/reset-password`;
    const { json, res } = await post("forget-password", { email, redirectTo });
    if (!res.ok) return { error: { message: errMessage(json, "Could not send reset email") } };
    return { error: null };
  },

  async resetPassword(input: { newPassword: string; token: string }): Promise<{ error: { message: string } | null }> {
    const { json, res } = await post("reset-password", { newPassword: input.newPassword, token: input.token });
    if (!res.ok) return { error: { message: errMessage(json, "Password reset failed — the link may have expired") } };
    return { error: null };
  },

  onAuthStateChange(callback: (event: string, session: AuthSessionShape | null) => void) {
    let lastUserId: string | null | undefined = undefined;
    let stopped = false;
    const check = async (initial = false) => {
      const session = await fetchSession(true);
      const uid = session?.user?.id ?? null;
      if (!stopped && (initial || uid !== lastUserId)) {
        callback(initial ? "INITIAL_SESSION" : uid ? "SIGNED_IN" : "SIGNED_OUT", session);
      }
      lastUserId = uid;
    };
    check(true);
    const timer = setInterval(() => check(false), 20_000);
    return {
      data: {
        subscription: {
          unsubscribe() {
            stopped = true;
            clearInterval(timer);
          },
        },
      },
    };
  },
};
