import { apiClient, AUTH_TOKEN_KEY, clearAuthToken, storeAuthToken } from "@/services/api-client";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  unit: {
    id: number;
    name: string;
    type: string;
  } | null;
}

export interface AuthSession {
  user: AuthUser;
}

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT";
type AuthStateChangeCallback = (event: AuthEvent, session: AuthSession | null) => void;

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  profile: {
    id: number;
    role: string;
    unit: {
      id: number;
      name: string;
      type: string;
    } | null;
  };
}

interface MeResponse {
  user: LoginResponse["user"];
  profile: LoginResponse["profile"];
}

const SESSION_STORAGE_KEY = "agri_app_session";

const listeners = new Set<AuthStateChangeCallback>();
let currentSession: AuthSession | null = null;
let inflightSessionPromise: Promise<AuthSession | null> | null = null;

const mapUser = (payload: LoginResponse["user"], profile: LoginResponse["profile"]): AuthUser => ({
  id: payload.id,
  username: payload.username,
  email: payload.email,
  firstName: payload.first_name,
  lastName: payload.last_name,
  role: profile.role,
  unit: profile.unit,
});

const persistSession = (session: AuthSession | null) => {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const restoreSession = (): AuthSession | null => {
  if (currentSession) return currentSession;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;

  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    currentSession = parsed;
    return currentSession;
  } catch (_error) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const notifyListeners = (event: AuthEvent, session: AuthSession | null) => {
  listeners.forEach((callback) => callback(event, session));
};

const fetchSessionFromApi = async (): Promise<AuthSession | null> => {
  try {
    const { data } = await apiClient.get<MeResponse>("/auth/me/");
    const mappedUser = mapUser(data.user, data.profile);
    currentSession = { user: mappedUser };
    persistSession(currentSession);
    return currentSession;
  } catch (error) {
    clearAuthToken();
    persistSession(null);
    return null;
  }
};

export const authClient = {
  async getSession(): Promise<{ data: { session: AuthSession | null } }> {
    if (currentSession) {
      return { data: { session: currentSession } };
    }

    const restored = restoreSession();
    if (restored) {
      currentSession = restored;
      return { data: { session: currentSession } };
    }

    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      return { data: { session: null } };
    }

    if (!inflightSessionPromise) {
      inflightSessionPromise = fetchSessionFromApi().finally(() => {
        inflightSessionPromise = null;
      });
    }

    const session = await inflightSessionPromise;
    return { data: { session } };
  },

  onAuthStateChange(callback: AuthStateChangeCallback) {
    listeners.add(callback);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },

  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ data: { user: AuthUser } | null; error: Error | null }> {
    try {
      const { data } = await apiClient.post<LoginResponse>("/auth/login/", {
        username: email,
        password,
      });

      storeAuthToken(data.token);
      const user = mapUser(data.user, data.profile);
      currentSession = { user };
      persistSession(currentSession);
      notifyListeners("SIGNED_IN", currentSession);

      return { data: { user }, error: null };
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Unable to sign in. Please check your credentials.";
      return { data: null, error: new Error(message) };
    }
  },

  async signUp(): Promise<{ data: { user: AuthUser | null }; error: Error | null }> {
    return {
      data: { user: null },
      error: new Error("Self-service sign up is not available. Contact an administrator."),
    };
  },

  async signOut(): Promise<{ error: Error | null }> {
    try {
      await apiClient.post("/auth/logout/");
    } catch (_error) {
      // Ignore network/auth errors on logout
    }

    clearAuthToken();
    currentSession = null;
    persistSession(null);
    notifyListeners("SIGNED_OUT", null);
    return { error: null };
  },
};

export type { AuthEvent, AuthStateChangeCallback };

