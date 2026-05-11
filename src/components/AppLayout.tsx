import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import OvertimePanel from "@/components/OvertimePanel";
import QuickAskDialog from "@/components/QuickAskDialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function AppLayout() {
  const [quickAskOpen, setQuickAskOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">

          <header className="h-12 px-6 flex items-center justify-end gap-1 border-b border-foreground/5 bg-background/60 backdrop-blur-sm sticky top-0 z-30">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuickAskOpen(true)}
              title="Quick Ask AI"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <OvertimePanel />
          </header>

          <QuickAskDialog open={quickAskOpen} onOpenChange={setQuickAskOpen} />

          {/* Main page content — rendered by React Router via Outlet */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}