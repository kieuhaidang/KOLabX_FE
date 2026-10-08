import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ApiError } from "../../services/api";
import { verifyEmail } from "../../services/authService";
import { getPendingIntentRole } from "../../services/guestTrial";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const pendingIntentRole = getPendingIntentRole();
  const loginHref = pendingIntentRole ? `/login?role=${pendingIntentRole}` : "/login";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Mã xác nhận không tồn tại.");
      return;
    }

    verifyEmail(token)
      .then((result) => {
        setStatus("success");
        setMessage(result.message);
      })
      .catch((error) => {
        setStatus("error");
        if (error instanceof ApiError) {
          setMessage(error.message);
        } else {
          setMessage("Xác nhận email thất bại. Vui lòng thử lại sau.");
        }
      });
  }, [token]);

  return (
    <div className="kolab-auth-shell flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-[32px] border border-white/12 bg-white p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            {status === "loading" && <Loader2 className="animate-spin text-primary" size={48} />}
            {status === "success" && <CheckCircle className="text-green-500" size={48} />}
            {status === "error" && <XCircle className="text-red-500" size={48} />}
          </div>

          <h2 className="text-2xl font-bold mb-4">
            {status === "loading" && "Đang xác nhận email..."}
            {status === "success" && "Xác nhận thành công!"}
            {status === "error" && "Xác nhận thất bại"}
          </h2>

          <p className="text-slate-600 mb-8">
            {message}
          </p>

          <Link
            to={loginHref}
            className="inline-block w-full rounded-full bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
          >
            Về trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
