import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { ApiError } from "../../services/api";
import { forgotPassword } from "../../services/authService";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const result = await forgotPassword(email.trim());
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
        <div className="rounded-[32px] border border-white/12 bg-white/82 p-8 shadow-xl">
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center text-sm text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              Quay lại Đăng nhập
            </Link>
          </div>

          <h2 className="text-2xl font-bold mb-2">Quên mật khẩu?</h2>
          <p className="text-slate-600 mb-6 text-sm">
            Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
          </p>

          {successMessage ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 text-sm font-medium mb-4">{successMessage}</p>
              <Link
                to="/login"
                className="inline-block rounded-full bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700"
              >
                Về trang đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {errorMessage && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-60"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi liên kết đặt lại"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
