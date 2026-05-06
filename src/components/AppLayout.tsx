import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import OvertimePanel from "@/components/OvertimePanel";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Top bar — minimal, sticky, AMC-themed ─────────────────────── */}
          <header className="h-12 flex items-center bg-background/80 backdrop-blur sticky top-0 z-10 px-4 border-b border-border/60">

            {/* Left — sidebar toggle */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground/60 hover:text-foreground" />
            </div>

            {/* Center — empty, lets pages own their headers */}
            <div className="flex-1" />

            {/* Right — quick AI ask + overtime bell */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/quick-ask")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors
                  ${location.pathname === "/quick-ask"
                    ? "bg-amc-yellow/15 text-foreground"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                  }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Quick Ask
              </button>
              <OvertimePanel />
            </div>

          </header>

          <main className="flex-1 min-w-0 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}