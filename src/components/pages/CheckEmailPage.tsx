import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";
import { resendVerification } from "../../services/authService";
import { ApiError } from "../../services/api";

export function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email) {
      setError("Không tìm thấy email. Vui lòng thử đăng ký lại.");
      return;
    }

    setIsResending(true);
    setError("");
    setMessage("");

    try {
      const result = await resendVerification(email);
      setMessage(result.message);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể gửi lại email. Vui lòng thử lại sau.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="kolab-auth-shell flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-[32px] border border-white/12 bg-white p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Mail size={40} />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Kiểm tra Email của bạn</h2>
          <p className="text-slate-600 mb-8">
            Chúng tôi đã gửi một liên kết xác nhận đến <span className="font-semibold text-slate-900">{email}</span>. 
            Vui lòng kiểm tra và nhấn vào link để kích hoạt tài khoản.
          </p>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700 text-sm text-left">
              <CheckCircle size={18} className="mr-2 flex-shrink-0" />
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-left">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full rounded-full bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
            >
              Quay lại Đăng nhập
            </Link>

            <button
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center justify-center w-full py-2 text-sm text-primary hover:text-primary-hover font-medium disabled:opacity-50"
            >
              <RefreshCw size={16} className={`mr-2 ${isResending ? "animate-spin" : ""}`} />
              Gửi lại email xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
