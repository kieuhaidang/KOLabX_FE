import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, Shield } from "lucide-react";
import { ApiError } from "../../services/api";
import {
  getAdminDispute,
  listAdminDisputes,
  updateAdminDisputeStatus,
  type AdminDispute,
  type DisputeStatus,
} from "../../services/adminDisputeService";
import { AdminNotice, AdminPageIntro, AdminSectionCard, AdminStatCard, AdminTableShell } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { adminNavigationItems } from "../admin/adminNavigation";

const statusOptions: Array<{ value: DisputeStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "open", label: "Mới mở" },
  { value: "under_review", label: "Đang xem xét" },
  { value: "resolved_release_payment", label: "Giải quyết — giải phóng thanh toán" },
  { value: "resolved_refund", label: "Giải quyết — hoàn tiền" },
  { value: "rejected", label: "Từ chối" },
];

const editableStatusOptions = statusOptions.filter((item) => item.value !== "");

function statusLabel(status: DisputeStatus) {
  return editableStatusOptions.find((item) => item.value === status)?.label ?? status;
}

function statusBadge(status: DisputeStatus) {
  if (status === "open") return "bg-blue-100 text-blue-700";
  if (status === "under_review") return "bg-amber-100 text-amber-700";
  if (status === "resolved_release_payment") return "bg-emerald-100 text-emerald-700";
  if (status === "resolved_refund") return "bg-purple-100 text-purple-700";
  return "bg-rose-100 text-rose-700";
}

function roleLabel(role: AdminDispute["reporterRole"]) {
  if (role === "marketer") return "Marketer";
  if (role === "koc") return "KOC";
  return "Admin";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

export function AdminDisputesPage() {
  const [items, setItems] = useState<AdminDispute[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AdminDispute | null>(null);
  const [editStatus, setEditStatus] = useState<DisputeStatus>("open");
  const [resolutionNote, setResolutionNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await listAdminDisputes({ status: statusFilter, search });
        if (!cancelled) setItems(response.items);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải danh sách tranh chấp.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, statusFilter]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setDetailLoading(true);
      setErrorMessage("");
      try {
        const response = await getAdminDispute(selectedId);
        if (cancelled) return;
        setSelected(response.dispute);
        setEditStatus(response.dispute.status);
        setResolutionNote(response.dispute.resolutionNote || "");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải chi tiết tranh chấp.");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      open: items.filter((item) => item.status === "open").length,
      review: items.filter((item) => item.status === "under_review").length,
      resolved: items.filter(
        (item) => item.status === "resolved_release_payment" || item.status === "resolved_refund"
      ).length,
    };
  }, [items]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const response = await updateAdminDisputeStatus(selected.id, {
        status: editStatus,
        resolutionNote,
      });
      setSelected(response.dispute);
      setItems((current) => current.map((item) => (item.id === response.dispute.id ? response.dispute : item)));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể cập nhật tranh chấp.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navigationItems={adminNavigationItems} role="admin">
      <div className="space-y-6">
        <AdminPageIntro
          eyebrow="Kiểm duyệt"
          title="Quản lý tranh chấp"
          description="Xử lý khiếu nại giữa Marketer và KOC liên quan đến booking/chiến dịch. Ghi nhận quyết định admin, chưa thực hiện hoàn tiền tự động."
        />

        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}

        <div className="grid gap-4 md:grid-cols-4">
          <AdminStatCard title="Tổng số" value={String(counts.total)} subtitle="Theo bộ lọc hiện tại" icon={<Shield size={20} />} />
          <AdminStatCard title="Mới mở" value={String(counts.open)} subtitle="Cần tiếp nhận" icon={<AlertTriangle size={20} />} tone="warning" />
          <AdminStatCard title="Đang xem xét" value={String(counts.review)} subtitle="Đang điều tra" icon={<Shield size={20} />} />
          <AdminStatCard title="Đã giải quyết" value={String(counts.resolved)} subtitle="Release hoặc refund" icon={<Shield size={20} />} tone="success" />
        </div>

        <AdminSectionCard title="Bộ lọc" description="Tìm theo chiến dịch, người khiếu nại, bên liên quan hoặc lý do.">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tranh chấp..."
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-purple-500"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | "")}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-purple-500"
            >
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </AdminSectionCard>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <AdminSectionCard title="Danh sách tranh chấp" description="Chọn một dòng để xem chi tiết và cập nhật trạng thái.">
            {loading && <div className="px-6 py-8 text-sm text-slate-600">Đang tải...</div>}
            {!loading && items.length === 0 && <div className="px-6 py-8 text-sm text-slate-600">Chưa có tranh chấp nào.</div>}
            {!loading && items.length > 0 && (
              <AdminTableShell>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-medium">Chiến dịch</th>
                      <th className="px-6 py-4 font-medium">Người khiếu nại</th>
                      <th className="px-6 py-4 font-medium">Bên liên quan</th>
                      <th className="px-6 py-4 font-medium">Trạng thái</th>
                      <th className="px-6 py-4 font-medium">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
                          selectedId === item.id ? "bg-purple-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{item.campaignTitle}</p>
                          <p className="mt-1 text-slate-500">Booking #{item.bookingId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-800">{item.reporterName}</p>
                          <p className="mt-1 text-slate-500">{roleLabel(item.reporterRole)}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{item.respondentName}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableShell>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Chi tiết & xử lý" description="Cập nhật trạng thái và ghi chú quyết định (không thực hiện hoàn tiền tự động).">
            {!selectedId && <div className="px-6 py-8 text-sm text-slate-600">Chọn một tranh chấp từ danh sách.</div>}
            {selectedId && detailLoading && <div className="px-6 py-8 text-sm text-slate-600">Đang tải chi tiết...</div>}
            {selectedId && !detailLoading && selected && (
              <div className="space-y-4 px-6 pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lý do</p>
                  <p className="mt-2 text-sm leading-6 text-slate-800">{selected.reason}</p>
                </div>
                {selected.evidence && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bằng chứng</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.evidence}</p>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-slate-500">Người khiếu nại</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selected.reporterName} ({roleLabel(selected.reporterRole)})
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Bên liên quan</p>
                    <p className="mt-1 font-medium text-slate-900">{selected.respondentName}</p>
                  </div>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Trạng thái</span>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as DisputeStatus)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  >
                    {editableStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Ghi chú quyết định</span>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                    placeholder="Mô tả quyết định của admin..."
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu quyết định"}
                </button>
                <p className="text-xs text-slate-500">Cập nhật lần cuối: {formatDate(selected.updatedAt)}</p>
              </div>
            )}
          </AdminSectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
