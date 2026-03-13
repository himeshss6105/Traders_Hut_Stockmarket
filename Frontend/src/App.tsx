import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ChartPage from "./pages/ChartPage";
import MarketsPage from "./pages/MarketsPage";
import NewsPage from "./pages/NewsPage";
import WatchlistPage from "./pages/WatchlistPage";
import NotFound from "./pages/NotFound";
import PredictionPage from "./pages/PredictionPage";
import AdminPage from "./pages/AdminPage";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chart" element={<ChartPage />} />
            <Route path="/chart/:symbol" element={<ChartPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
