import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API = "http://localhost:5000/api";

interface User {
  id: string;
  name: string;
  email: string;
  watchlist: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateWatchlist: (watchlist: string[]) => void;
  addToWatchlist: (symbol: string) => Promise<void>;
  removeFromWatchlist: (symbol: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("th_token"));

  useEffect(() => {
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setUser(data); else logout(); })
        .catch(() => logout());
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("th_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("th_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("th_token");
    setToken(null);
    setUser(null);
  };

  const updateWatchlist = (watchlist: string[]) => {
    if (user) setUser({ ...user, watchlist });
  };

  const addToWatchlist = async (symbol: string) => {
    if (!token) return;
    const res = await fetch(`${API}/watchlist/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ symbol }),
    });
    const data = await res.json();
    if (res.ok && user) setUser({ ...user, watchlist: data.watchlist });
  };

  const removeFromWatchlist = async (symbol: string) => {
    if (!token) return;
    const res = await fetch(`${API}/watchlist/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ symbol }),
    });
    const data = await res.json();
    if (res.ok && user) setUser({ ...user, watchlist: data.watchlist });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateWatchlist, addToWatchlist, removeFromWatchlist }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
