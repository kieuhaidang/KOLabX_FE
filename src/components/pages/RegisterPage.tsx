import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { ApiError } from "../../services/api";
import { getHomePathForRole, register, UserRole } from "../../services/authService";
import { useAuth } from "../auth/AuthProvider";
import { getPendingIntentRole } from "../../services/guestTrial";

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Extract<UserRole, "marketer" | "koc">>("marketer");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false); // THÊM LẠI STATE BỊ THIẾU
  const [errorMessage, setErrorMessage] = useState("");
  const loginHref = `/login?role=${role}`;
  const pendingIntentRole = getPendingIntentRole();

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "koc" || roleParam === "marketer") {
      setRole(roleParam);
    } else if (pendingIntentRole) {
      setRole(pendingIntentRole);
    }
  }, [pendingIntentRole, searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await register({
        fullName: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      // User must verify first, so we don't call setUser here
      navigate(`/check-email?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Register failed. Please try again.");
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
          <p className="text-slate-600">Bắt đầu hành trình Marketing Influencer của bạn</p>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-white/82 p-8 shadow-[var(--shadow-soft)] backdrop-blur">
          <h2 className="text-2xl font-black tracking-tight mb-6">Tạo tài khoản</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vai trò</label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/[0.035] p-1.5">
                <button
                  type="button"
                  onClick={() => setRole("marketer")}
                  className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                    role === "marketer" ? "border-primary bg-white text-primary shadow-sm" : "border-transparent text-slate-700 hover:bg-white/70"
                  }`}
                >
                  Marketer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("koc")}
                  className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                    role === "koc" ? "border-primary bg-white text-primary shadow-sm" : "border-transparent text-slate-700 hover:bg-white/70"
                  }`}
                >
                  KOC
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
            </div>

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

            <div className="flex items-start gap-2">
              <input 
                type="checkbox" 
                id="terms-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                required
              />
              <label htmlFor="terms-checkbox" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                Tôi đồng ý với{" "}
                <Link to="/terms" target="_blank" className="text-purple-600 font-bold hover:underline">
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link to="/privacy" target="_blank" className="text-purple-600 font-bold hover:underline">
                  Chính sách bảo mật
                </Link>{" "}
                của KOLab.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !agreed}
              className="w-full rounded-full bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Đã có tài khoản?{" "}
              <Link to={loginHref} className="text-purple-600 hover:text-purple-700 font-medium">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
