import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { OvertimeProvider } from "@/hooks/useOvertimeNotifications";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Resources from "./pages/Resources";
import Roster from "./pages/Roster";
import Metrics from "./pages/Metrics";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import CeoReport from "./pages/CeoReport";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OvertimeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Welcome />} />
                  <Route path="/department/:slug" element={<Index />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/roster" element={<Roster />} />
                  <Route path="/ceo-report" element={<CeoReport />} />

                  {/* Metrics — /metrics redirects to first metric, /metrics/:slug shows that one */}
                  <Route path="/metrics" element={<Navigate to="/metrics/punctuality" replace />} />
                  <Route path="/metrics/:slug" element={<Metrics />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </OvertimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;