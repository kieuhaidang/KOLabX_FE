import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Sparkles,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { adminNavigationItems } from "../admin/adminNavigation";
import { ThemeSwitcher } from "../../theme/ThemeSwitcher";

interface DashboardLayoutProps {
  children: ReactNode;
  navigationItems?: { path: string; label: string; icon: ReactNode }[];
  role: "marketer" | "koc" | "admin" | "owner";
}

export function DashboardLayout({ children, navigationItems: customItems, role }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const defaultItems = {
    marketer: [
      { path: "/marketer", label: "Bảng điều khiển", icon: <LayoutDashboard size={20} /> },
      { path: "/marketer/auto-briefing", label: "AI Tạo Brief", icon: <Sparkles size={20} /> },
      { path: "/marketer/smart-matching", label: "AI Smart Matching", icon: <Users size={20} /> },
      { path: "/marketer/campaigns", label: "Chiến dịch", icon: <Briefcase size={20} /> },
      { path: "/marketer/bookings", label: "Đặt lịch", icon: <Calendar size={20} /> },
      { path: "/marketer/submissions", label: "Nội dung chờ duyệt.", icon: <FileText size={20} /> },
      { path: "/marketer/wallet", label: "Ví điện tử", icon: <Wallet size={20} /> },
      { path: "/marketer/messages", label: "Tin nhắn", icon: <MessageSquare size={20} /> },
    ],
    koc: [
      { path: "/koc", label: "Bảng điều khiển", icon: <LayoutDashboard size={20} /> },
      { path: "/koc/campaigns", label: "Chiến dịch", icon: <Briefcase size={20} /> },
      { path: "/koc/bookings", label: "Lời mời", icon: <Calendar size={20} /> },
      { path: "/koc/script-doctor", label: "AI Script Doctor", icon: <FileText size={20} /> },
      { path: "/koc/messages", label: "Tin nhắn", icon: <MessageSquare size={20} /> },
      { path: "/koc/earnings", label: "Thu nhập", icon: <DollarSign size={20} /> },
    ],
    admin: adminNavigationItems,
    owner: [],
  };

  const navigationItems = customItems && customItems.length > 0 ? customItems : defaultItems[role] || [];


  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = user?.fullName?.trim() || "Tài khoản";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const profilePath = role === "owner" ? "/owner/profile" : role === "admin" ? "/admin/profile" : `/${role}/profile`;
  const roleLabel = role === "owner" ? "Chủ sở hữu" : role === "marketer" ? "Nhà tiếp thị" : role === "koc" ? "KOC" : "Quản trị viên";

  const isActivePath = (path: string) => {
    if (path === "/admin/dashboard") return location.pathname === "/admin" || location.pathname === "/admin/dashboard";
    const rootPaths = new Set(["/admin", "/koc", "/marketer", "/owner"]);
    return rootPaths.has(path) ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="kolab-app-shell">
      <nav className="kolab-nav-shell sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between">
            <div className="flex min-w-0 items-center gap-5 xl:gap-8">
              <Link to="/" className="flex items-center gap-2 rounded-full px-1 transition-transform hover:-translate-y-0.5">
                <img src="/logo-cropped.png" alt="KOLab logo" className="h-14 w-auto shrink-0 object-contain lg:h-16" />
              </Link>

              <div className="kolab-nav-pill hidden max-w-[calc(100vw-25rem)] items-center gap-1 overflow-x-auto rounded-full p-1.5 lg:flex">
                {navigationItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  return (
                    <Link key={item.path} to={item.path} className={`kolab-nav-link shrink-0 ${isActive ? "is-active" : ""}`}>
                      {item.icon}
                      <span className="text-sm font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeSwitcher />

              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-2 text-white shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/15"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-gradient-strong)]">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="hidden text-sm font-medium md:block">{displayName}</span>
                  <ChevronDown size={16} className="hidden text-white/60 md:block" />
                </button>

                {showProfile && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
                    <div className="kolab-menu-panel absolute right-0 z-20 mt-2 w-56">
                      <div className="border-b border-white/10 p-4">
                        <p className="font-semibold text-white">{displayName}</p>
                        <p className="text-sm text-slate-400">{roleLabel}</p>
                      </div>
                      <Link to={profilePath} className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-primary/12 hover:text-white" onClick={() => setShowProfile(false)}>
                        {role === "admin" ? "Quản lý tài khoản" : "Cài đặt tài khoản"}
                      </Link>
                      <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-orange-300 hover:bg-red-500/12 hover:text-white">
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-full border border-white/12 bg-white/10 p-2 text-white shadow-sm hover:bg-white/15 lg:hidden"
                aria-label="Mở menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-0 right-0 top-[72px] z-40 border-b border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl lg:hidden">
              <nav className="max-h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-4">
                {navigationItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-colors ${
                        isActive ? "bg-[var(--accent-gradient)] text-white shadow-lg shadow-primary/20" : "text-slate-200 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </nav>

      <main className="kolab-reveal p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
