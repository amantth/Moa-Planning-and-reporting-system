import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { authClient } from "@/services/auth-client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Users,
  Building2,
  Target,
  Upload,
  LogOut,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Annual Plans", href: "/plans", icon: FileText },
    { name: "Performance Reports", href: "/reports", icon: TrendingUp },
    { name: "Indicators", href: "/indicators", icon: Target },
    { name: "Users", href: "/users", icon: Users },
    { name: "Offices", href: "/offices", icon: Building2 },
    { name: "Upload Data", href: "/upload", icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Ministry of</h2>
                <p className="text-xs text-muted-foreground">Agriculture</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Planning & Performance System
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children || <Outlet />}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
