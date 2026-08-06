export const AUTH_STORAGE_KEY = "admin-auth";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
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
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
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
