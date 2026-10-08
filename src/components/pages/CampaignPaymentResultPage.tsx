import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { payCampaign, type Campaign } from "../../services/campaignService";
import { verifyCampaignPayment, type CampaignPaymentVerification } from "../../services/paymentService";
import { ApiError } from "../../services/api";

const CAMPAIGN_PAYMENT_CHECKOUT_KEY = "kolab_campaign_payment_checkout";
const SMART_MATCHING_CAMPAIGN_DRAFT_KEY = "kolab_smart_matching_campaign_draft";

function readStoredCheckout() {
  try {
    const raw = sessionStorage.getItem(CAMPAIGN_PAYMENT_CHECKOUT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as { orderCode?: unknown; campaignId?: unknown };
    const orderCode = Number(value.orderCode);
    const campaignId = Number(value.campaignId);
    return {
      orderCode: Number.isInteger(orderCode) && orderCode > 0 ? orderCode : null,
      campaignId: Number.isInteger(campaignId) && campaignId > 0 ? campaignId : null,
    };
  } catch {
    return null;
  }
}

export function CampaignPaymentResultPage({ type }: { type: "success" | "cancel" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storedCheckout = readStoredCheckout();
  const queryOrderCode = Number(searchParams.get("orderCode"));
  const orderCode = Number.isInteger(queryOrderCode) && queryOrderCode > 0 ? queryOrderCode : storedCheckout?.orderCode;
  const [verification, setVerification] = useState<CampaignPaymentVerification | null>(null);
  const [loading, setLoading] = useState(Boolean(orderCode));
  const [retrying, setRetrying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(orderCode ? "" : "Không tìm thấy mã thanh toán chiến dịch.");

  useEffect(() => {
    if (!orderCode) return;
    let active = true;

    verifyCampaignPayment(orderCode)
      .then((result) => {
        if (!active) return;
        setVerification(result);
        if (result.status === "confirmed") {
          sessionStorage.removeItem(CAMPAIGN_PAYMENT_CHECKOUT_KEY);
        }
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Không thể xác nhận thanh toán với PayOS.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderCode]);

  const campaign = verification?.campaign || null;
  const isConfirmed = verification?.status === "confirmed"
    && Boolean(campaign && ["open", "scheduled"].includes(campaign.status));

  const openMatching = (confirmedCampaign: Campaign) => {
    const state = { source: "campaign-payment-success", campaign: confirmedCampaign } as const;
    sessionStorage.setItem(SMART_MATCHING_CAMPAIGN_DRAFT_KEY, JSON.stringify(state));
    navigate("/marketer/smart-matching", { state });
  };

  const retryPayment = async () => {
    const campaignId = campaign?.id || storedCheckout?.campaignId;
    if (!campaignId || retrying) return;
    setRetrying(true);
    setErrorMessage("");
    try {
      const checkout = await payCampaign(campaignId);
      sessionStorage.setItem(CAMPAIGN_PAYMENT_CHECKOUT_KEY, JSON.stringify(checkout));
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể tạo lại liên kết thanh toán.");
      setRetrying(false);
    }
  };

  return (
    <DashboardLayout role="marketer">
      <div className="flex min-h-[70vh] items-center justify-center py-8">
        <section className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 text-center shadow-2xl shadow-black/30 sm:p-10">
          {loading ? (
            <div className="space-y-5 py-8">
              <Loader2 className="mx-auto animate-spin text-primary" size={54} />
              <h1 className="text-2xl font-black text-white">Đang xác nhận thanh toán...</h1>
              <p className="text-sm text-slate-400">Hệ thống đang đối chiếu giao dịch trực tiếp với PayOS.</p>
            </div>
          ) : isConfirmed && campaign ? (
            <div className="space-y-6">
              <CheckCircle2 className="mx-auto text-teal-300" size={64} />
              <div>
                <h1 className="text-2xl font-black text-white sm:text-3xl">Thanh toán thành công. Chiến dịch đã được tạo.</h1>
                <p className="mt-2 text-sm text-slate-400">{campaign.title}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => navigate(`/marketer/campaigns/${campaign.id}`)}
                  className="rounded-full border border-white/15 px-6 py-3 font-bold text-white hover:bg-white/10"
                >
                  Xem chiến dịch
                </button>
                <button
                  type="button"
                  onClick={() => openMatching(campaign)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-black text-white hover:bg-primary-hover"
                >
                  <Sparkles size={18} /> Matching ngay
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <XCircle className="mx-auto text-orange-300" size={64} />
              <div>
                <h1 className="text-2xl font-black text-white">Thanh toán chưa hoàn tất.</h1>
                <p className="mt-2 text-sm text-slate-400">
                  {errorMessage || (type === "cancel"
                    ? "Chiến dịch vẫn ở trạng thái chờ thanh toán và chưa được kích hoạt."
                    : "PayOS chưa xác nhận giao dịch thành công. Chiến dịch chưa được kích hoạt.")}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                {(campaign?.status === "pending_payment" || (!campaign && storedCheckout?.campaignId)) ? (
                  <button
                    type="button"
                    onClick={retryPayment}
                    disabled={retrying}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-black text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    {retrying ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    {retrying ? "Đang tạo thanh toán..." : "Thanh toán lại"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate("/marketer/campaigns")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 font-bold text-white hover:bg-white/10"
                >
                  <ArrowLeft size={18} /> Quay về danh sách chiến dịch
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
