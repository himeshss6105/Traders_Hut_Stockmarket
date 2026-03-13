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

const PROFESSIONS = [
  "Student", "Software Engineer", "Doctor", "Teacher", "Business Owner",
  "Government Employee", "Freelancer", "Trader", "Investor", "Other"
];

const INCOME_RANGES = [
  "Below ₹2 LPA", "₹2-5 LPA", "₹5-10 LPA", "₹10-20 LPA", "₹20-50 LPA", "Above ₹50 LPA"
];

export default function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", profession: "", incomeRange: ""
  });

  const handle = async () => {
    setLoading(true);
    try {
      if (tab === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back!");
      } else {
        await register(form.name, form.email, form.password, form.profession, form.incomeRange);
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
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
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

          {tab === "register" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-foreground">Profession</Label>
                <select
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select your profession</option>
                  {PROFESSIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground">Annual Income Range</Label>
                <select
                  value={form.incomeRange}
                  onChange={(e) => setForm({ ...form, incomeRange: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select income range</option>
                  {INCOME_RANGES.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Button onClick={handle} disabled={loading} className="w-full font-display font-bold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {tab === "login" ? "Sign In" : "Create Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
