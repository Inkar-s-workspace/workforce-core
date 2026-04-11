import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Sparkles } from "lucide-react";
import OvertimePanel from "@/components/OvertimePanel";

export default function AppLayout() {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-12 flex items-center border-b bg-card sticky top-0 z-10 px-3">

            {/* Left — sidebar trigger, fixed width to balance the right side */}
            <div className="w-10 shrink-0 flex items-center">
              <SidebarTrigger />
            </div>

            {/* Center — truly centered because both sides are equal fixed width */}
            <div className="flex-1 flex items-center justify-center gap-2">
              <Button
                variant="ghost" size="sm" className="gap-1.5"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4" /> Home
              </Button>
              <Button
                variant="outline" size="sm" className="gap-1.5"
                onClick={() => navigate("/quick-ask")}
              >
                <Sparkles className="h-4 w-4" /> Quick AI Ask
              </Button>
            </div>

            {/* Right — fixed width matching left, overtime bell sits here */}
            <div className="w-10 shrink-0 flex items-center justify-end">
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