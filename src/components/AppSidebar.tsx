import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2, Home, Settings, Download, BookOpen, LogOut,
  CalendarDays, BarChart3, ChevronDown, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const roleLabels: Record<string, string> = {
  hr:              "HR",
  department_head: "Unit Head",
  reception:       "Reception",
  manager:         "Manager",
  admin:           "Admin",
};

const METRIC_LINKS = [
  { to: "/metrics/punctuality",  label: "Punctuality rate"  },
  { to: "/metrics/absenteeism",  label: "Absenteeism rate"  },
  { to: "/metrics/adherence",    label: "Shift adherence"   },
  { to: "/metrics/overtime",     label: "Overtime rate"     },
];

const METRICS_DEFAULT = "/metrics/punctuality";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canViewReports = role === "hr" || role === "admin";

  const onMetricsPage = location.pathname.startsWith("/metrics");
  const [metricsOpen, setMetricsOpen] = useState(onMetricsPage);

  // Behavior: collapsed → navigate; expanded → toggle the dropdown
  const handleMetricsClick = () => {
    if (collapsed) {
      navigate(METRICS_DEFAULT);
    } else {
      setMetricsOpen(o => !o);
    }
  };

  return (
    <Sidebar collapsible="icon">

      {/* ── Brand mark + collapse toggle ─────────────────────────────── */}
      <SidebarHeader className={collapsed ? "px-2 pt-5 pb-4" : "px-4 pt-6 pb-5"}>
        <div className={collapsed ? "flex flex-col items-center gap-3" : "flex items-start justify-between gap-2"}>
          <NavLink to="/" className="flex items-center gap-2.5 group min-w-0">
            {collapsed ? (
              <img
                src="/amc-sun.png"
                alt="AMC"
                className="h-10 w-10 object-contain shrink-0"
                draggable={false}
              />
            ) : (
              <img
                src="/amc-logo.png"
                alt="Accra Medical Centre"
                className="h-14 w-auto object-contain object-left max-w-full group-hover:opacity-90 transition-opacity"
                draggable={false}
              />
            )}
          </NavLink>

          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="shrink-0 p-1.5 rounded-md text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <p className="text-[10px] tracking-[0.16em] uppercase text-sidebar-foreground/40 mt-3 ml-0.5 font-medium">
            Workforce
          </p>
        )}
      </SidebarHeader>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <SidebarContent className="px-2 pt-2">

        {/* DAILY */}
        {!collapsed && <SectionLabel>Daily</SectionLabel>}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavItem to="/" end icon={Home} label="Home" collapsed={collapsed} />
              {role !== "reception" && (
                <NavItem to="/department/all" icon={Building2} label="Attendance" collapsed={collapsed} />
              )}
              <NavItem to="/roster" icon={CalendarDays} label="Duty roster" collapsed={collapsed} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* METRICS */}
        {!collapsed && <SectionLabel className="mt-6">Metrics</SectionLabel>}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleMetricsClick}
                  title={collapsed ? "Metrics" : undefined}
                  className={`group/nav flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors w-full relative
                    ${onMetricsPage
                      ? "bg-sidebar-accent text-sidebar-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-r before:bg-amc-yellow"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }`}
                >
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Metrics</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-sidebar-foreground/45 transition-transform ${metricsOpen ? "rotate-180" : ""}`}
                      />
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {metricsOpen && !collapsed && (
                <div className="ml-3 pl-3 border-l border-sidebar-border/60 mt-0.5 mb-1 space-y-0.5">
                  {METRIC_LINKS.map(m => (
                    <SidebarMenuItem key={m.to}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={m.to}
                          className="block rounded-md px-2.5 py-1.5 text-[12px] text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors"
                          activeClassName="!text-sidebar-foreground !bg-sidebar-accent/60 font-medium"
                        >
                          {m.label}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* TOOLS */}
        {!collapsed && <SectionLabel className="mt-6">Tools</SectionLabel>}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {canViewReports && (
                <NavItem to="/reports" icon={Download} label="Reports" collapsed={collapsed} />
              )}
              <NavItem to="/resources" icon={BookOpen} label="Resources" collapsed={collapsed} />
              <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/60">
        {!collapsed ? (
          <div>
            <div className="px-2 py-2.5">
              <p className="text-[12px] font-medium text-sidebar-foreground truncate leading-tight">
                {user?.email}
              </p>
              {role && (
                <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 tracking-[0.08em] uppercase">
                  {roleLabels[role] ?? role}
                </p>
              )}
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[12px] text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="w-full flex items-center justify-center p-2 rounded-md text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] tracking-[0.16em] uppercase text-sidebar-foreground/40 px-3 mb-2 font-medium ${className}`}>
      {children}
    </p>
  );
}

function NavItem({
  to, icon: Icon, label, collapsed, end = false,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  end?: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          end={end}
          title={collapsed ? label : undefined}
          className="group/nav flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors relative"
          activeClassName="!bg-sidebar-accent !text-sidebar-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-r before:bg-amc-yellow"
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{label}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}