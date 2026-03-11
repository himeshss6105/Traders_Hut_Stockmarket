import SiteHeader from "@/components/SiteHeader";
import MarketTicker from "@/components/MarketTicker";
import MarketStats from "@/components/MarketStats";
import HeroSection from "@/components/HeroSection";
import TopMovers from "@/components/TopMovers";
import FeaturesSection from "@/components/FeaturesSection";
import SiteFooter from "@/components/SiteFooter";

const Index = () => (
  <div className="min-h-screen bg-background">
    <SiteHeader />
    <MarketTicker />
    <HeroSection />
    <MarketStats />
    <TopMovers />
    <FeaturesSection />
    <SiteFooter />
  </div>
);

export default Index;
