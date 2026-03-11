import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import MarketTicker from "@/components/MarketTicker";
import HeroSection from "@/components/HeroSection";
import MarketStats from "@/components/MarketStats";
import TopMovers from "@/components/TopMovers";
import StockSearch from "@/components/StockSearch";
import FeaturesSection from "@/components/FeaturesSection";
import SiteFooter from "@/components/SiteFooter";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const handleSearch = (query: string) => {
    // Scroll to search and pre-fill
    const searchSection = document.getElementById("search");
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth" });
      // Trigger search input
      setTimeout(() => {
        const input = searchSection.querySelector("input");
        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          nativeInputValueSetter?.call(input, query);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus();
        }
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} setUser={setUser} onSearch={handleSearch} />
      <MarketTicker />
      <HeroSection />
      <MarketStats />
      <TopMovers />
      <StockSearch />
      <FeaturesSection />
      <SiteFooter />
    </div>
  );
};

export default Index;
