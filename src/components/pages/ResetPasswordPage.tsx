import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Lock, ArrowLeft } from "lucide-react";
import { ApiError } from "../../services/api";
import { resetPassword } from "../../services/authService";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Mã token không hợp lệ hoặc đã hết hạn.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword({ token, password });
      setSuccessMessage(result.message);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kolab-auth-shell flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-white/12 bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-2">Đặt lại mật khẩu</h2>
          <p className="text-slate-600 mb-6 text-sm">
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
          </p>

          {!token && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">Liên kết không hợp lệ. Vui lòng yêu cầu lại liên kết mới.</p>
              <Link to="/forgot-password" className="text-red-900 font-bold underline mt-2 block">Quên mật khẩu?</Link>
            </div>
          )}

          {successMessage ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 text-sm font-medium mb-4">{successMessage}</p>
              <Link
                to="/login"
                className="inline-block rounded-full bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    disabled={!token}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    disabled={!token}
                  />
                </div>
              </div>

              {errorMessage && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full rounded-full bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-60"
              >
                {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center text-sm text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
