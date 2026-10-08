import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Mail, Lock, Sparkles, Eye, EyeOff } from "lucide-react";
import { ApiError } from "../../services/api";
import { getHomePathForRole, login } from "../../services/authService";
import { useAuth } from "../auth/AuthProvider";
import { consumePostLoginIntent, getSafeInternalReturnTo } from "../../services/guestTrial";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [remember, setRemember] = useState(false);
  const selectedRole = searchParams.get("role");
  const registerHref = selectedRole === "marketer" || selectedRole === "koc" ? `/register?role=${selectedRole}` : "/register";
  const requestedReturnTo = getSafeInternalReturnTo(searchParams.get("returnTo") || searchParams.get("redirect"));

  useEffect(() => {
    const storedEmail = localStorage.getItem("rememberedEmail");
    const storedRemember = localStorage.getItem("rememberMe");
    if (storedRemember === "true" && storedEmail) {
      setEmail(storedEmail);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await login({
        email: email.trim(),
        password,
        remember,
      });
      if (remember) {
        localStorage.setItem("rememberedEmail", email.trim());
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberMe");
      }
      setUser(result.user);
      const continuation = consumePostLoginIntent(result.user.role);
      if (continuation?.message) {
        setErrorMessage(continuation.message);
        return;
      }
      if (continuation?.destination) {
        navigate(continuation.destination);
        return;
      }
      navigate(requestedReturnTo || getHomePathForRole(result.user.role));
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          // Unverified account redirect to check-email
          navigate(`/check-email?email=${encodeURIComponent(email.trim())}`);
          return;
        }
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kolab-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -left-24 top-12 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      <Link to="/landing" className="absolute left-4 top-4 rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-bold text-slate-700 backdrop-blur hover:text-primary">
        ← Trang chủ
      </Link>
      <div className="relative w-full max-w-md kolab-reveal">
        <div className="text-center mb-8">
          <img
            src="/logo-cropped.png"
            alt="KOLab logo"
            className="mx-auto mb-4 h-48 w-auto object-contain"
          />
          <p className="text-slate-600">Nền tảng Marketing KOL/Influencer được hỗ trợ bởi AI</p>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-white/82 p-8 shadow-[var(--shadow-soft)] backdrop-blur">
          <h2 className="text-2xl font-black tracking-tight mb-6">Chào mừng trở lại</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="ml-2 text-sm text-slate-600">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" title="Quên mật khẩu" className="text-sm text-purple-600 hover:text-purple-700">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl disabled:opacity-60"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Chưa có tài khoản?{" "}
              <Link to={registerHref} className="text-purple-600 hover:text-purple-700 font-medium">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 mb-4">Trải nghiệm nền tảng Marketing hiện đại</p>
          <div className="flex items-center justify-center gap-6 text-slate-400">
            <div className="flex items-center gap-1">
              <Sparkles size={16} className="text-primary animate-pulse" />
              <span className="text-xs font-bold text-slate-500">AI-Powered Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
