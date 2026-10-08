import { useEffect, useMemo, useState } from "react";
import { Briefcase, Search } from "lucide-react";
import { ApiError } from "../../services/api";
import { listAdminCampaigns, type AdminCampaign } from "../../services/adminService";
import { AdminNotice, AdminPageIntro, AdminSectionCard, AdminStatCard, AdminTableShell } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { adminNavigationItems } from "../admin/adminNavigation";

const statusOptions: Array<{ value: string; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "draft", label: "Bản nháp" },
  { value: "scheduled", label: "Đã lên lịch" },
  { value: "open", label: "Đang mở" },
  { value: "in_progress", label: "Đang triển khai" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

function statusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function statusBadge(status: string) {
  if (status === "open") return "bg-emerald-100 text-emerald-700";
  if (status === "scheduled") return "bg-blue-100 text-blue-700";
  if (status === "in_progress") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-purple-100 text-purple-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  if (status === "draft") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VNĐ`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

export function AdminCampaignsPage() {
  const [items, setItems] = useState<AdminCampaign[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await listAdminCampaigns({
          search,
          status: status || undefined,
          limit: 100,
        });
        if (!cancelled) setItems(response.items);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải danh sách chiến dịch.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, status]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      open: items.filter((item) => item.status === "open").length,
      inProgress: items.filter((item) => item.status === "in_progress").length,
      completed: items.filter((item) => item.status === "completed").length,
    };
  }, [items]);

  return (
    <DashboardLayout navigationItems={adminNavigationItems} role="admin">
      <div className="space-y-6">
        <AdminPageIntro
          eyebrow="Chiến dịch"
          title="Quản lý campaigns hệ thống"
          description="Xem toàn bộ chiến dịch, marketer phụ trách, ngân sách và trạng thái hoạt động."
        />

        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}

        <div className="grid gap-4 md:grid-cols-4">
          <AdminStatCard title="Tổng số" value={String(counts.total)} subtitle="Theo bộ lọc hiện tại" icon={<Briefcase size={20} />} />
          <AdminStatCard title="Đang mở" value={String(counts.open)} subtitle="Campaign open" icon={<Briefcase size={20} />} tone="success" />
          <AdminStatCard title="Triển khai" value={String(counts.inProgress)} subtitle="In progress" icon={<Briefcase size={20} />} />
          <AdminStatCard title="Hoàn thành" value={String(counts.completed)} subtitle="Completed" icon={<Briefcase size={20} />} />
        </div>

        <AdminSectionCard title="Bộ lọc" description="Tìm theo tên chiến dịch, marketer hoặc trạng thái.">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm chiến dịch hoặc marketer..."
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-purple-500"
              />
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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

        <AdminSectionCard title="Danh sách chiến dịch" description="Toàn bộ campaigns trong hệ thống.">
          {loading && <div className="px-6 py-8 text-sm text-slate-600">Đang tải danh sách chiến dịch...</div>}
          {!loading && items.length === 0 && (
            <div className="px-6 py-8 text-sm text-slate-600">Không có chiến dịch phù hợp với bộ lọc hiện tại.</div>
          )}
          {!loading && items.length > 0 && (
            <AdminTableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">Tiêu đề</th>
                    <th className="px-6 py-4 font-medium">Marketer</th>
                    <th className="px-6 py-4 font-medium">Ngân sách</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((campaign) => (
                    <tr key={campaign.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">#{campaign.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{campaign.title}</p>
                        {campaign.platform && <p className="mt-1 text-slate-500">{campaign.platform}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800">{campaign.marketerName}</p>
                        <p className="mt-1 text-slate-500">{campaign.marketerEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(campaign.budget)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(campaign.status)}`}>
                          {statusLabel(campaign.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(campaign.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableShell>
          )}
        </AdminSectionCard>
      </div>
    </DashboardLayout>
  );
}
