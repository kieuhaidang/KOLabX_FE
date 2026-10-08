import { Link } from "react-router";
import { ChevronDown, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getHomePathForRole } from "../../services/authService";
import { ThemeSwitcher } from "../../theme/ThemeSwitcher";

type PublicHeaderTheme = "cream" | "dark";

type PublicHeaderLogoSize = "default" | "home";

export function PublicHeader({ theme = "cream", logoSize = "default" }: { theme?: PublicHeaderTheme; logoSize?: PublicHeaderLogoSize }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"marketer" | "influencer" | null>(null);
  const { user } = useAuth();
  const isDark = theme === "dark";
  const themeSwitcherClass = isDark ? "" : "border-black/10 bg-white/60 text-slate-900 hover:bg-white";

  const navLinkClass = `rounded-full px-4 py-2 text-sm font-semibold ${
    isDark
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-slate-700 hover:bg-white/70 hover:text-primary hover:shadow-sm"
  }`;

  const navButtonClass = `flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold ${
    isDark
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-slate-700 hover:bg-white/70 hover:text-primary hover:shadow-sm"
  }`;

  const dropdownLinkClass = "block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-primary";

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-2xl ${
        isDark
          ? "border-b border-white/10 bg-black/60 text-white"
          : "border-b border-black/5 bg-[var(--cp-cream)]/82 text-slate-950"
      }`}
    >
      <nav className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 rounded-full px-2 transition-transform hover:-translate-y-0.5">
            <img
              src="/logo-cropped.png"
              alt="KOLab logo"
              className={
                logoSize === "home"
                  ? "h-auto w-[68px] shrink-0 object-contain md:w-[88px] lg:w-[98px]"
                  : "h-auto w-[60px] shrink-0 object-contain md:w-[76px] lg:w-[84px]"
              }
            />
          </Link>

          <div
            className={`hidden items-center gap-1 rounded-full p-1.5 md:flex ${
              isDark
                ? "border border-white/10 bg-white/[0.075] shadow-inner shadow-white/5"
                : "border border-black/5 bg-black/[0.035] shadow-inner shadow-white/60"
            }`}
          >
            <Link to="/" className={navLinkClass}>
              Trang chủ
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("marketer")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button type="button" className={navButtonClass}>
                Dành cho Marketer
                <ChevronDown size={16} className={`transition-transform ${activeDropdown === "marketer" ? "rotate-180" : ""}`} />
              </button>
              <div className={`absolute left-0 top-full z-50 pt-2 ${activeDropdown === "marketer" ? "block" : "hidden"}`}>
                <div className="min-w-[260px] rounded-3xl border border-black/10 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
                  <Link to="/try/ai-brief" className={dropdownLinkClass}>
  AI Tạo Brief Tự Động
</Link>
                  <Link to="/marketer/bookings" className={dropdownLinkClass}>Khám phá KOC</Link>
                  <Link to="/marketer/campaigns" className={dropdownLinkClass}>Quản lý chiến dịch</Link>
                </div>
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("influencer")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button type="button" className={navButtonClass}>
                KOC / Influencer
                <ChevronDown size={16} className={`transition-transform ${activeDropdown === "influencer" ? "rotate-180" : ""}`} />
              </button>
              <div className={`absolute left-0 top-full z-50 pt-2 ${activeDropdown === "influencer" ? "block" : "hidden"}`}>
                <div className="min-w-[260px] rounded-3xl border border-black/10 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
                  <Link to="/koc/campaigns" className={dropdownLinkClass}>Chiến dịch thương hiệu</Link>
                  <Link to="/try/script-doctor" className={dropdownLinkClass}>
  AI Script Doctor
</Link>
                  <Link to="/koc/earnings" className={dropdownLinkClass}>Bảng thu nhập</Link>
                </div>
              </div>
            </div>

            <Link to="/top-kols" className={navLinkClass}>
              Creators & Sản phẩm nổi bật
            </Link>
            <Link to="/pricing" className={navLinkClass}>
              Bảng giá
            </Link>
            <Link to="/about" className={navLinkClass}>
              Về chúng tôi
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeSwitcher className={themeSwitcherClass} />
            {user ? (
              <Link
                to={getHomePathForRole(user.role)}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-bold text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl"
              >
                <LayoutDashboard size={18} />
                Quản trị hệ thống
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 font-bold ${isDark ? "text-white/80 hover:text-white" : "text-slate-700 hover:text-primary"}`}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/select-role"
                  className="rounded-full bg-primary px-6 py-2.5 font-bold text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl"
                >
                  Bắt đầu ngay
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitcher className={themeSwitcherClass} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`rounded-2xl p-2 shadow-sm ${
              isDark ? "border border-white/15 bg-white/10 text-white" : "border border-black/10 bg-white/60"
            }`}
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-4 space-y-2 rounded-3xl border border-black/10 bg-white/95 p-3 text-slate-900 shadow-2xl backdrop-blur-xl md:hidden">
            {!user && (
              <>
                <Link to="/" className="block rounded-2xl px-4 py-3 font-semibold hover:bg-orange-50 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  Trang chủ
                </Link>
                <Link to="/top-kols" className="block rounded-2xl px-4 py-3 font-semibold hover:bg-orange-50 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  Creators & Sản phẩm nổi bật
                </Link>
                <Link to="/pricing" className="block rounded-2xl px-4 py-3 font-semibold hover:bg-orange-50 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  Bảng giá
                </Link>
                <Link to="/about" className="block rounded-2xl px-4 py-3 font-semibold hover:bg-orange-50 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  Về chúng tôi
                </Link>
              </>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {user ? (
                <Link
                  to={getHomePathForRole(user.role)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  Vào Dashboard của bạn
                </Link>
              ) : (
                <>
                  <Link to="/login" className="w-full rounded-full border border-black/10 px-4 py-3 text-center font-bold text-slate-700 hover:bg-white" onClick={() => setMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link to="/select-role" className="w-full rounded-full bg-primary px-4 py-3 text-center font-bold text-white shadow-lg shadow-primary/20" onClick={() => setMobileMenuOpen(false)}>
                    Bắt đầu ngay
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
