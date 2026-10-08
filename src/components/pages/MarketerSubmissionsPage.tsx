import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ClipboardList } from "lucide-react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ApiError } from "../../services/api";
import {
  listMarketerSubmissions,
  reviewBookingSubmission,
  type MarketerSubmission,
} from "../../services/bookingService";
import { AiNotice, AiPageHeader, AiSectionCard } from "../ai/aiPrimitives";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN");
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VND`;
}

function statusLabel(status: MarketerSubmission["status"]) {
  if (status === "draft_submitted") return "Đã nộp bản thảo";
  if (status === "final_submitted") return "Đã nộp final, chờ duyệt";
  if (status === "revision_requested") return "Yêu cầu chỉnh sửa";
  if (status === "completed") return "Đã hoàn thành";
  if (status === "accepted") return "Đang thực hiện";
  return status;
}

function statusClass(status: MarketerSubmission["status"]) {
  if (status === "final_submitted") return "bg-amber-100 text-amber-800";
  if (status === "draft_submitted") return "bg-blue-50 text-primary";
  if (status === "revision_requested") return "bg-orange-100 text-orange-800";
  if (status === "completed") return "bg-emerald-100 text-emerald-800";
  return "bg-slate-100 text-slate-700";
}

export function MarketerSubmissionsPage() {
  const [items, setItems] = useState<MarketerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await listMarketerSubmissions();
      setItems(response.items);
    } catch (error) {
      setItems([]);
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải danh sách nội dung.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleApprove = async (item: MarketerSubmission) => {
    if (!window.confirm(`Duyệt nội dung final của ${item.kocName}?`)) return;
    setActionId(item.bookingId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await reviewBookingSubmission(item.bookingId, { action: "approve" });
      if (response.requiresPayment && response.checkoutUrl) {
        setSuccessMessage("Chiến dịch chưa nạp ngân sách. Đang chuyển hướng đến cổng thanh toán PayOS...");
        window.location.assign(response.checkoutUrl);
        return;
      }
      setSuccessMessage(response.message);
      await loadItems();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể duyệt nội dung.");
    } finally {
      setActionId(null);
    }
  };

  const handleRequestRevision = async (item: MarketerSubmission) => {
    const reviewNote = window.prompt("Nhập ghi chú yêu cầu chỉnh sửa cho KOC:", item.reviewNote || "");
    if (reviewNote === null) return;
    setActionId(item.bookingId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await reviewBookingSubmission(item.bookingId, {
        action: "request_revision",
        reviewNote,
      });
      setSuccessMessage(response.message);
      await loadItems();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể gửi yêu cầu chỉnh sửa.");
    } finally {
      setActionId(null);
    }
  };

  const pendingItems = items.filter((item) =>
    ["draft_submitted", "final_submitted"].includes(item.status)
  );

  return (
    <DashboardLayout role="marketer">
      <div className="space-y-6">
        <AiPageHeader
          eyebrow="Marketer Workspace"
          title="Nội dung từ KOC"
          description="Xem video draft/final KOC đã nộp, duyệt hoàn thành hoặc yêu cầu chỉnh sửa"
          icon={<ClipboardList size={28} className="text-white" />}
        />

        {errorMessage ? <AiNotice tone="error">{errorMessage}</AiNotice> : null}
        {successMessage ? <AiNotice tone="success">{successMessage}</AiNotice> : null}

        <AiSectionCard title={`Danh sách nội dung (${pendingItems.length} chờ xử lý)`}>
          {loading ? <p className="text-sm text-slate-500">Đang tải danh sách...</p> : null}
          {!loading && items.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có nội dung nào từ KOC.</p>
          ) : null}

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.bookingId} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{item.campaignTitle}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      KOC: <span className="font-medium text-slate-800">{item.kocName}</span> ({item.kocEmail})
                    </p>
                    <p className="text-sm text-slate-600">Thù lao: {formatCurrency(item.offeredPrice)}</p>
                    <p className="text-sm text-slate-500">Nộp lúc: {formatDate(item.submittedAt)}</p>
                    {item.reviewNote ? (
                      <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">
                        Ghi chú: {item.reviewNote}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.draftLink ? (
                      <a
                        href={item.draftLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Xem draft
                      </a>
                    ) : null}
                    {item.finalLink ? (
                      <a
                        href={item.finalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Xem final
                      </a>
                    ) : null}
                    <Link
                      to={`/marketer/koc-profile/${item.kocProfileId || item.kocId}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Xem hồ sơ
                    </Link>
                  </div>
                </div>

                {item.status !== "completed" ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={actionId === item.bookingId || !item.finalLink}
                      onClick={() => handleApprove(item)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                    >
                      {actionId === item.bookingId ? "Đang xử lý..." : "Duyệt final"}
                    </button>
                    <button
                      type="button"
                      disabled={actionId === item.bookingId}
                      onClick={() => handleRequestRevision(item)}
                      className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                    >
                      Yêu cầu sửa
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </AiSectionCard>
      </div>
    </DashboardLayout>
  );
}
