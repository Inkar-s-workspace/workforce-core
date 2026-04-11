import {
  Building2,
  Stethoscope,
  Wrench,
  Pill,
  Heart,
  ClipboardList,
  Home,
  Shield,
  ChevronDown,
  Settings,
  Download,
  BookOpen,
  LogOut,
  User,
  CalendarDays,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const departments = [
  { title: "Administration", url: "/department/administration", icon: ClipboardList },
  { title: "Allied Health", url: "/department/allied-health", icon: Heart },
  { title: "Auxiliary", url: "/department/auxiliary", icon: Wrench },
  { title: "Medicine", url: "/department/medicine", icon: Stethoscope },
  { title: "Nursing & Midwifery", url: "/department/nursing-midwifery", icon: Heart },
  { title: "Pharmacy", url: "/department/pharmacy", icon: Pill },
];

// ── Role display labels (covers all roles in the system) ──────────────────────
const roleLabels: Record<string, string> = {
  hr: "HR",
  department_head: "Unit Head",
  reception: "Reception",
  manager: "Manager",
  admin: "Admin",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isDeptRoute = location.pathname.startsWith("/department/");
  const [deptOpen, setDeptOpen] = useState(isDeptRoute);
  const { user, role, signOut } = useAuth();

  // Hide Reports link for roles that can't access it
  const canViewReports = role === "hr" || role === "admin";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold leading-none">AMC</p>
              <p className="text-xs text-sidebar-foreground/60">Accra Medical Centre</p>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>

              {/* Home */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <Home className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Home</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Departments (hidden from reception) */}
              {role !== "reception" && (
                <Collapsible open={deptOpen} onOpenChange={setDeptOpen}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/department/all" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <Building2 className="mr-2 h-4 w-4" />
                        {!collapsed && <span>All Departments</span>}
                      </NavLink>
                    </SidebarMenuButton>
                    {!collapsed && (
                      <CollapsibleTrigger asChild>
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-sidebar-accent">
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${deptOpen ? "rotate-180" : ""}`} />
                        </button>
                      </CollapsibleTrigger>
                    )}
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {departments.map((dept) => (
                        <SidebarMenuSubItem key={dept.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink to={dept.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                              <dept.icon className="mr-2 h-3.5 w-3.5" />
                              <span>{dept.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Reports — HR and Admin only */}
              {canViewReports && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/reports" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <Download className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Reports</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Resources */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/resources" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Resources</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Duty Roster — visible to all roles */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/roster" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Duty Roster</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.email}</p>
                {role && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5 bg-sidebar-accent text-sidebar-accent-foreground">
                    {roleLabels[role] ?? role}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}