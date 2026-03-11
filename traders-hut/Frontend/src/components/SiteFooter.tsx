import { TrendingUp } from "lucide-react";

const SiteFooter = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">Traders Hut</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Traders Hut. Real-time market data for serious traders.
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
