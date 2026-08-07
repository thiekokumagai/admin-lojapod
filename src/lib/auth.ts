export const AUTH_STORAGE_KEY = "admin-auth";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  storeId?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
};

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (!parsed.accessToken || !parsed.refreshToken) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      user: parsed.user,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getUserRole(): "SUPER_ADMIN" | "ADMIN" {
  const session = getAuthSession();
  if (session?.user?.role) {
    return session.user.role;
  }
  if (session?.accessToken) {
    try {
      const payload = JSON.parse(atob(session.accessToken.split('.')[1]));
      if (payload.role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
    } catch (e) {
      // ignore
    }
  }
  return "ADMIN";
}

export function isSuperAdmin(): boolean {
  return getUserRole() === "SUPER_ADMIN";
}

export function isAuthenticated() {
  return !!getAuthSession()?.accessToken;
}

export function signIn(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
