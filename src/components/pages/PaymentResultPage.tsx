import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { RootLayout } from "../layouts/RootLayout";
import { verifyPayment } from "../../services/paymentService";

export function PaymentResultPage({ type }: { type: "success" | "cancel" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const [verifying, setVerifying] = useState(!!orderCode);
  const [verifiedStatus, setVerifiedStatus] = useState<string>("");

  useEffect(() => {
    if (!orderCode) return;

    let isMounted = true;
    async function verify() {
      try {
        const res = await verifyPayment(Number(orderCode));
        if (isMounted) {
          setVerifiedStatus(res.status);
        }
      } catch (err) {
        console.error("Payment verify failed:", err);
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [orderCode]);

  const isSuccess = type === "success" || verifiedStatus === "PAID";

  return (
    <RootLayout>
      <div className="public-dark-page flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-2xl shadow-primary/10">
          {verifying ? (
            <div className="space-y-6 py-6">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <h1 className="text-2xl font-black text-slate-900">Đang xác thực giao dịch...</h1>
              <p className="text-slate-500 font-medium leading-relaxed">
                Vui lòng không đóng trình duyệt hoặc tải lại trang khi hệ thống xác nhận thanh toán với PayOS.
              </p>
            </div>
          ) : (
            <>
              {isSuccess ? (
                <>
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 size={48} />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900">Thanh toán thành công!</h1>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Cảm ơn bạn đã tin tưởng KOLab. Giao dịch mã <strong>#{orderCode}</strong> đã được xác nhận thành công. 
                    Hệ thống đã cập nhật số dư/trạng thái tài khoản của bạn.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={48} />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900">Thanh toán đã hủy</h1>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Giao dịch mã <strong>#{orderCode}</strong> của bạn đã bị hủy hoặc không thành công. 
                    Đừng lo lắng, tiền của bạn vẫn an toàn. Bạn có thể thử lại bất cứ lúc nào.
                  </p>
                </>
              )}

              <div className="pt-4">
                <button
                  onClick={() => navigate("/marketer/dashboard")}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-black uppercase tracking-widest text-white transition-all hover:bg-primary-hover"
                >
                  Quay lại Dashboard
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </RootLayout>
  );
}
