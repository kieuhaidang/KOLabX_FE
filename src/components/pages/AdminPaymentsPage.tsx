import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Eye, Search, XCircle } from "lucide-react";
import { ApiError } from "../../services/api";
import {
  confirmAdminPayment,
  listAdminPayments,
  rejectAdminPayment,
  type AdminPayment,
} from "../../services/adminService";
import { adminNavigationItems } from "../admin/adminNavigation";
import { AdminNotice, AdminPageIntro, AdminSectionCard, AdminStatCard, AdminTableShell } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "expired", label: "Hết hạn" },
];

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VND`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

function statusLabel(status: string) {
  if (status === "paid" || status === "pending") return "Chờ xác nhận";
  if (status === "confirmed") return "Đã xác nhận";
  if (status === "rejected") return "Đã từ chối";
  if (status === "cancelled") return "Đã hủy";
  if (status === "expired") return "Hết hạn";
  return status;
}

function statusBadge(status: string) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  if (status === "cancelled" || status === "expired") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function canReview(payment: AdminPayment) {
  return payment.status === "paid" || payment.status === "pending";
}

export function AdminPaymentsPage() {
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [summary, setSummary] = useState({ pending: 0, confirmed: 0, rejected: 0 });
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminPayment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await listAdminPayments({
        status: status || undefined,
        search,
      });
      setItems(response.items);
      setSummary(response.summary);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải danh sách thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchData, 250);
    return () => window.clearTimeout(timer);
  }, [status, search]);

  // Lock body scroll when any modal is open to prevent background scrolling
  useEffect(() => {
    if (selectedPayment || confirmTarget || rejectTarget) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedPayment, confirmTarget, rejectTarget]);

  const visibleTotal = useMemo(() => items.length, [items]);

  const replacePayment = (payment: AdminPayment) => {
    setItems((current) => {
      if (status === "pending" && payment.status !== "pending" && payment.status !== "paid") {
        return current.filter((item) => item.id !== payment.id);
      }
      return current.map((item) => (item.id === payment.id ? payment : item));
    });
    setSelectedPayment((current) => (current?.id === payment.id ? payment : current));
  };

  const handleConfirm = async () => {
    if (!confirmTarget || submitting) return;
    setSubmitting(true);
    setErrorMessage("");
    try {
      const response = await confirmAdminPayment(confirmTarget.id);
      replacePayment(response.payment);
      setSummary((current) => ({
        pending: Math.max(0, current.pending - 1),
        confirmed: current.confirmed + 1,
        rejected: current.rejected,
      }));
      setConfirmTarget(null);
      fetchData();
      setSuccessMessage("Đã xác nhận thanh toán. Booking đã được mở khóa để Marketer và KOC tiếp tục kết nối.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể xác nhận thanh toán.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || submitting) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      setErrorMessage("Vui lòng nhập lý do từ chối thanh toán.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const response = await rejectAdminPayment(rejectTarget.id, reason);
      replacePayment(response.payment);
      setSummary((current) => ({
        pending: Math.max(0, current.pending - 1),
        confirmed: current.confirmed,
        rejected: current.rejected + 1,
      }));
      setRejectTarget(null);
      setRejectionReason("");
      fetchData();
      setSuccessMessage("Đã từ chối thanh toán và giữ booking ở trạng thái bị chặn.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể từ chối thanh toán.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout navigationItems={adminNavigationItems} role="admin">
      <div className="space-y-6">
        <AdminPageIntro
          eyebrow="Thanh toán"
          title="Xác nhận thanh toán"
          description="Admin kiểm tra giao dịch của Marketer trước khi mở khóa booking để Marketer và KOC tiếp tục kết nối."
        />

        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}
        {successMessage && <AdminNotice>{successMessage}</AdminNotice>}

        <div className="grid gap-4 md:grid-cols-4">
          <AdminStatCard title="Chờ xác nhận" value={String(summary.pending)} subtitle="Payment pending hoặc paid" icon={<AlertCircle size={20} />} tone="warning" />
          <AdminStatCard title="Đã xác nhận" value={String(summary.confirmed)} subtitle="Booking ready_to_connect" icon={<CheckCircle2 size={20} />} tone="success" />
          <AdminStatCard title="Đã từ chối" value={String(summary.rejected)} subtitle="Booking payment_rejected" icon={<XCircle size={20} />} tone="danger" />
          <AdminStatCard title="Đang hiển thị" value={String(visibleTotal)} subtitle="Theo bộ lọc hiện tại" icon={<CreditCard size={20} />} />
        </div>

        <AdminSectionCard title="Bộ lọc" description="Tìm theo booking ID, Marketer, KOC, campaign hoặc mã giao dịch.">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm booking, Marketer, KOC, campaign, mã giao dịch..."
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </AdminSectionCard>

        <AdminSectionCard title="Danh sách thanh toán" description="Các payment gắn với booking/collaboration cần Admin xử lý.">
          {loading && <div className="px-6 py-8 text-sm text-slate-600">Đang tải danh sách thanh toán...</div>}
          {!loading && items.length === 0 && (
            <div className="px-6 py-8 text-sm text-slate-600">Không có thanh toán phù hợp với bộ lọc hiện tại.</div>
          )}
          {!loading && items.length > 0 && (
            <AdminTableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Booking ID</th>
                    <th className="px-6 py-4 font-medium">Marketer</th>
                    <th className="px-6 py-4 font-medium">KOC</th>
                    <th className="px-6 py-4 font-medium">Campaign</th>
                    <th className="px-6 py-4 font-medium">Số tiền</th>
                    <th className="px-6 py-4 font-medium">Mã giao dịch</th>
                    <th className="px-6 py-4 font-medium">Thời gian gửi</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((payment) => (
                    <tr key={payment.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">#{payment.bookingId ?? "-"}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{payment.marketerName || "-"}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.marketerEmail || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{payment.kocName || "-"}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.kocEmail || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{payment.campaignTitle || "-"}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-slate-700">{payment.transactionCode || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDateTime(payment.submittedAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(payment.status)}`}>
                          {statusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(payment)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                            aria-label="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          {canReview(payment) && (
                            <>
                              <button
                                type="button"
                                onClick={() => setConfirmTarget(payment)}
                                disabled={submitting || payment.status !== "paid"}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                Xác nhận
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(payment)}
                                disabled={submitting}
                                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableShell>
          )}
        </AdminSectionCard>

        {selectedPayment && (
          <PaymentModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
        )}

        {confirmTarget && (
          <ActionDialog
            title="Xác nhận thanh toán"
            message="Xác nhận thanh toán sẽ mở khóa collaboration giữa Marketer và KOC để hai bên tiếp tục kết nối và làm việc."
            confirmLabel="Xác nhận"
            submitting={submitting}
            onCancel={() => setConfirmTarget(null)}
            onConfirm={handleConfirm}
          />
        )}

        {rejectTarget && (
          <ActionDialog
            title="Từ chối thanh toán"
            message="Booking sẽ vẫn bị chặn sau khi thanh toán bị từ chối."
            confirmLabel="Từ chối"
            tone="danger"
            submitting={submitting}
            onCancel={() => {
              setRejectTarget(null);
              setRejectionReason("");
            }}
            onConfirm={handleReject}
          >
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="mt-4 min-h-28 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-rose-500"
            />
          </ActionDialog>
        )}
      </div>
    </DashboardLayout>
  );
}

function PaymentModal({ payment, onClose }: { payment: AdminPayment; onClose: () => void }) {
  const fields = [
    ["Payment ID", `#${payment.paymentId}`],
    ["Booking ID", payment.bookingId ? `#${payment.bookingId}` : "-"],
    ["Campaign", payment.campaignTitle || "-"],
    ["Marketer", `${payment.marketerName || "-"} (${payment.marketerEmail || "-"})`],
    ["KOC", `${payment.kocName || "-"} (${payment.kocEmail || "-"})`],
    ["Số tiền", formatCurrency(payment.amount)],
    ["Phương thức", payment.paymentMethod],
    ["Mã giao dịch", payment.transactionCode || "-"],
    ["Thời gian gửi", formatDateTime(payment.submittedAt)],
    ["Trạng thái payment", statusLabel(payment.status)],
    ["Trạng thái booking", payment.bookingStatus || "-"],
    ["Admin duyệt", payment.reviewedByAdminName || "-"],
    ["Thời gian duyệt", formatDateTime(payment.reviewedAt)],
    ["Lý do từ chối", payment.rejectionReason || "-"],
  ];

  return createPortal(
    <div className="kolab-app-shell">
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4"
      >
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-xl font-bold text-slate-900">Chi tiết thanh toán</h3>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <dl className="grid gap-4 md:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-4">
                <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
                <dd className="mt-2 break-words text-sm font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          {payment.paymentProofUrl && (
            <a
              href={payment.paymentProofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Xem bằng chứng thanh toán
            </a>
          )}
        </div>
        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
}

function ActionDialog({
  title,
  message,
  confirmLabel,
  tone = "success",
  submitting,
  children,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "success" | "danger";
  submitting: boolean;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const buttonClass =
    tone === "danger"
      ? "bg-rose-600 hover:bg-rose-700"
      : "bg-emerald-600 hover:bg-emerald-700";

  return createPortal(
    <div className="kolab-app-shell">
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4"
      >
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            Hủy
          </button>
          <button type="button" onClick={onConfirm} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${buttonClass}`}>
            {submitting ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
}
