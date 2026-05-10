import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import OvertimePanel from "@/components/OvertimePanel";

export default function AppLayout() {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">

          {/* Minimal top bar — just holds the Overtime notification panel */}
          <header className="h-12 px-6 flex items-center justify-end gap-1 border-b border-foreground/5 bg-background/60 backdrop-blur-sm sticky top-0 z-30">
            <OvertimePanel />
          </header>

          {/* Main page content — rendered by React Router via Outlet */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}