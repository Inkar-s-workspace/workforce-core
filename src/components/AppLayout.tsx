import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OvertimePanel } from "@/components/OvertimePanel";
import { QuickAsk } from "@/pages/QuickAsk";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const showQuickAsk = location.pathname !== "/quick-ask";

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">

          {/* Minimal top bar — sits over the page, holds Quick Ask + Overtime */}
          <header className="h-12 px-6 flex items-center justify-end gap-1 border-b border-foreground/5 bg-background/60 backdrop-blur-sm sticky top-0 z-30">
            {showQuickAsk && <QuickAsk />}
            <OvertimePanel />
          </header>

          {/* Main page content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}