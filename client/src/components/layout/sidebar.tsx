import { Link, useLocation } from "wouter";
import {
  Home,
  Workflow,
  Edit,
  Image,
  Bot,
  Download,
  User,
  CheckCircle,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Page Flow", href: "/flow-editor", icon: Workflow },
  // { name: "Page Editor", href: "/page-editor", icon: Edit },
  { name: "Media Library", href: "/media-library", icon: Image },
  { name: "AI Generator", href: "/ai-generator", icon: Bot },
  {
    name: "Approval Dashboard",
    href: "/approval-dashboard",
    icon: CheckCircle,
  },
  { name: "Export Site", href: "/export", icon: Download },
];

export default function Sidebar() {
  const [location] = useLocation();

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
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500 font-medium">
              PWC Administrator
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
