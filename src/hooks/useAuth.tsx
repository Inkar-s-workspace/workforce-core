/**
 * useAuth.tsx — localStorage-based auth (mock version)
 *
 * Use this file when you DON'T have Supabase credentials yet.
 * All logins are stored in localStorage — no backend needed.
 *
 * DEMO ACCOUNTS:
 *   hr@accramedical.com         / password123  → role: hr
 *   manager@accramedical.com    / password123  → role: manager
 *   unithead@accramedical.com   / password123  → role: department_head
 *   admin@accramedical.com      / password123  → role: admin
 *   reception@accramedical.com  / password123  → role: reception
 *
 * When ready to connect Supabase, swap this file for useAuth.supabase.tsx
 */

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = "hr" | "department_head" | "reception" | "manager" | "admin" | null;

export interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

interface StoredUser {
  id: string;
  email: string;
  password: string;
  role: AppRole;
  created_at: string;
}

interface AuthContextType {
  user: MockUser | null;
  session: { user: MockUser } | null;
  role: AppRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  USERS:   "amc_users",
  SESSION: "amc_session",
} as const;

// ─── Demo seed accounts ───────────────────────────────────────────────────────

const SEED_ACCOUNTS: StoredUser[] = [
  { id: "seed-1", email: "hr@accramedical.com",         password: "password123", role: "hr",              created_at: new Date().toISOString() },
  { id: "seed-2", email: "manager@accramedical.com",    password: "password123", role: "manager",         created_at: new Date().toISOString() },
  { id: "seed-3", email: "unithead@accramedical.com",   password: "password123", role: "department_head", created_at: new Date().toISOString() },
  { id: "seed-4", email: "admin@accramedical.com",      password: "password123", role: "admin",           created_at: new Date().toISOString() },
  { id: "seed-5", email: "reception@accramedical.com",  password: "password123", role: "reception",       created_at: new Date().toISOString() },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    const stored: StoredUser[] = raw ? JSON.parse(raw) : [];
    const storedEmails = new Set(stored.map(u => u.email));
    return [...stored, ...SEED_ACCOUNTS.filter(s => !storedEmails.has(s.email))];
  } catch {
    return SEED_ACCOUNTS;
  }
}

function saveUsers(users: StoredUser[]) {
  const nonSeedEmails = new Set(SEED_ACCOUNTS.map(s => s.email));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users.filter(u => !nonSeedEmails.has(u.email))));
}

function getSession(): MockUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(user: MockUser | null) {
  if (user) localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function generateId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<MockUser | null>(null);
  const [role,    setRole]    = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionUser = getSession();
    if (sessionUser) {
      setUser(sessionUser);
      const found = getUsers().find(u => u.id === sessionUser.id);
      setRole(found?.role ?? null);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const match = getUsers().find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!match) return { error: new Error("Invalid email or password.") };
    const sessionUser: MockUser = { id: match.id, email: match.email, created_at: match.created_at };
    saveSession(sessionUser);
    setUser(sessionUser);
    setRole(match.role);
    return { error: null };
  };

  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { error: new Error("An account with this email already exists.") };
    if (password.length < 6)
      return { error: new Error("Password must be at least 6 characters.") };
    saveUsers([...users, { id: generateId(), email: email.toLowerCase(), password, role: null, created_at: new Date().toISOString() }]);
    return { error: null };
  };

  const signOut = async () => {
    saveSession(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session: user ? { user } : null, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}