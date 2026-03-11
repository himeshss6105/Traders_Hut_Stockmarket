import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const SiteHeader = () => (
  <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
    <div className="container mx-auto flex h-16 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <span className="font-display text-xl font-bold text-foreground">Traders Hut</span>
      </div>

      <nav className="hidden items-center gap-6 md:flex">
        {["Markets", "Watchlist", "Portfolio", "News"].map((item) => (
          <a key={item} href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {item}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          Sign In
        </Button>
        <Button size="sm" className="bg-primary font-display font-bold text-primary-foreground hover:bg-primary/90">
          Get Started
        </Button>
      </div>
    </div>
  </header>
);

export default SiteHeader;
