import { useState } from "react";
import { TrendingUp, X, Eye, EyeOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = "http://localhost:5000/api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface SiteHeaderProps {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  onSearch: (q: string) => void;
}

const SiteHeader = ({ user, setUser, onSearch }: SiteHeaderProps) => {
  const [modal, setModal] = useState<"signin" | "signup" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = modal === "signup" ? "auth/register" : "auth/login";
      const body = modal === "signup"
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(`${API}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setUser(data.user);
      setModal(null);
      setForm({ name: "", email: "", password: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) onSearch(searchValue.trim());
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">Traders Hut</span>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden md:flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Indian stocks... (e.g. RELIANCE)"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch(e as any)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </form>

          {/* Nav */}
          <nav className="hidden items-center gap-6 lg:flex">
            {["Markets", "Watchlist", "Portfolio", "News"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {item}
              </a>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Hi, <span className="text-foreground font-medium">{user.name.split(" ")[0]}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setUser(null)}
                  className="text-muted-foreground hover:text-foreground text-xs">
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setModal("signin"); setError(""); }}
                  className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
                <Button size="sm" onClick={() => { setModal("signup"); setError(""); }}
                  className="bg-primary font-display font-bold text-primary-foreground hover:bg-primary/90">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-display font-bold text-foreground">Traders Hut</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {modal === "signup" ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {modal === "signup" ? "Join thousands of Indian market traders" : "Sign in to your account"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {modal === "signup" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</label>
                  <Input value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))}
                    placeholder="Himesh Kumar" required
                    className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))}
                  placeholder="himesh@example.com" required
                  className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
                <div className="relative mt-1">
                  <Input type={showPassword ? "text" : "password"} value={form.password}
                    onChange={e => setForm(f => ({...f,password:e.target.value}))}
                    placeholder={modal === "signup" ? "Min. 6 characters" : "Your password"}
                    required minLength={6}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-loss/10 border border-loss/30 rounded-md px-3 py-2 text-sm text-loss">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-primary font-display font-bold text-primary-foreground">
                {loading ? "Please wait..." : modal === "signup" ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-4">
              {modal === "signup" ? "Already have an account? " : "Don't have an account? "}
              <button onClick={() => { setModal(modal === "signup" ? "signin" : "signup"); setError(""); }}
                className="text-primary hover:underline font-medium">
                {modal === "signup" ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SiteHeader;
