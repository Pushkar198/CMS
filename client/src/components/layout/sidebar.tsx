import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  Workflow,
  Edit,
  Image,
  Bot,
  Download,
  User,
  CheckCircle,
  LogOut,
} from "lucide-react";

// Navigation items with role restrictions
const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ['maker', 'checker', 'admin'] },
  { name: "Page Flow", href: "/flow-editor", icon: Workflow, roles: ['maker', 'checker', 'admin'] },
  { name: "Media Library", href: "/media-library", icon: Image, roles: ['maker', 'checker', 'admin'] },
  { name: "AI Generator", href: "/ai-generator", icon: Bot, roles: ['maker', 'checker', 'admin'] },
  { name: "Approval Dashboard", href: "/approval-dashboard", icon: CheckCircle, roles: ['checker', 'admin'] },
  { name: "Export Site", href: "/export", icon: Download, roles: ['maker', 'checker', 'admin'] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Filter navigation based on user role
  const navigation = navigationItems.filter(item => 
    user ? item.roles.includes(user.role) : false
  );

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'checker': return 'Content Checker';
      case 'maker': return 'Content Maker';
      default: return role;
    }
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-white to-gray-50 shadow-lg border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary via-accent to-secondary">
        <h1 className="text-xl font-bold text-white font-inter drop-shadow-sm">
          PWC Site Builder
        </h1>
        <p className="text-sm text-white/90 mt-1 font-medium">
          AI-Powered Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-white bg-gradient-to-r from-primary to-accent shadow-lg transform scale-105"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-primary hover:shadow-md hover:transform hover:scale-105"
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 transition-all duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 group-hover:text-primary"
                  }`}
                />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white space-y-3">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {user?.username || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 font-medium">
              {user ? getRoleDisplayName(user.role) : 'No Role'}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-red-600 hover:border-red-300"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
