import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { TrendingUp, Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handle = async () => {
    setLoading(true);
    try {
      if (tab === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back!");
      } else {
        await register(form.name, form.email, form.password);
        toast.success("Account created!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">Traders Hut</span>
          </div>
          <DialogTitle className="text-foreground font-display">
            {tab === "login" ? "Sign In to your account" : "Create your account"}
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-border bg-muted/30 p-1 mb-4">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {tab === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <Input
                id="name"
                placeholder="Himesh Kumar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-background border-border"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-background border-border"
              onKeyDown={(e) => e.key === "Enter" && handle()}
            />
          </div>
          <Button onClick={handle} disabled={loading} className="w-full font-display font-bold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {tab === "login" ? "Sign In" : "Create Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
