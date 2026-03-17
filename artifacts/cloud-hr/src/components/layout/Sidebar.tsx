import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Clock, 
  CalendarDays, 
  BarChart3, 
  Settings, 
  UserCircle,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, isManager, logout } = useAuth();

  const getNavItems = () => {
    const items = [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, show: true },
      { href: "/departments", label: "Departments", icon: Building2, show: isAdmin },
      { href: "/employees", label: "Employees", icon: Users, show: isAdmin },
      { href: "/attendance", label: "Attendance", icon: Clock, show: true },
      { href: "/leaves", label: "Leaves", icon: CalendarDays, show: true },
      { href: "/reports", label: "Reports", icon: BarChart3, show: isAdmin || isManager },
      { href: "/settings", label: "Settings", icon: Settings, show: isAdmin },
      { href: "/profile", label: "Profile", icon: UserCircle, show: true },
    ];
    return items.filter(item => item.show);
  };

  return (
    <div className="w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl z-20 sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-display font-bold text-lg tracking-wide text-white">Cloud HR</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
        {getNavItems().map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-white font-bold shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate text-white">{user?.fullName}</span>
            <span className="text-xs text-sidebar-foreground/60 capitalize truncate">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Log Out
        </button>
      </div>
    </div>
  );
}
