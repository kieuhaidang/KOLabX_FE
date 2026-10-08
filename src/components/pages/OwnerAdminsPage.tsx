import { useEffect, useMemo, useState } from "react";
import { Search, UserCog } from "lucide-react";
import { ApiError } from "../../services/api";
import type { AdminUserStatus } from "../../services/adminService";
import { listOwnerAdmins, updateOwnerAdminStatus, type OwnerAdminUser } from "../../services/ownerService";
import { AdminNotice, AdminPageIntro, AdminSectionCard, AdminStatCard, AdminTableShell } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ownerNavigationItems } from "../owner/ownerNavigation";

const statusOptions: Array<{ value: AdminUserStatus | ""; label: string }> = [
  { value: "", label: "Tất cả" },
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Tạm ngưng" },
  { value: "banned", label: "Bị khóa" },
];

export function OwnerAdminsPage() {
  const [items, setItems] = useState<OwnerAdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminUserStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await listOwnerAdmins({ search, status });
        if (!cancelled) setItems(response.items);
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải danh sách admin.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, status]);

  const activeCount = useMemo(() => items.filter((i) => i.status === "active").length, [items]);

  const handleStatusChange = async (userId: number, nextStatus: AdminUserStatus) => {
    setUpdatingUserId(userId);
    setErrorMessage("");
    try {
      const response = await updateOwnerAdminStatus(userId, nextStatus);
      setItems((current) => current.map((item) => (item.id === userId ? response.user : item)));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể cập nhật admin.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <DashboardLayout navigationItems={ownerNavigationItems} role="owner">
      <div className="space-y-6">
        <AdminPageIntro eyebrow="Admin" title="Quản lý tài khoản admin" description="Owner có thể tạm ngưng hoặc khóa admin." />
        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}
        <div className="grid gap-4 md:grid-cols-2">
          <AdminStatCard title="Tổng admin" value={String(items.length)} subtitle="Theo bộ lọc" icon={<UserCog size={20} />} />
          <AdminStatCard title="Đang hoạt động" value={String(activeCount)} subtitle="Trạng thái active" icon={<UserCog size={20} />} tone="success" />
        </div>
        <AdminSectionCard title="Bộ lọc" description="Tìm theo tên hoặc email">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm admin..." className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4" />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value as AdminUserStatus | "")} className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3">
            {statusOptions.map((o) => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
        </AdminSectionCard>
        <AdminSectionCard title="Danh sách admin" description="Chỉ hiển thị role admin">
          {loading && <p className="px-6 py-6 text-sm text-slate-600">Đang tải...</p>}
          {!loading && items.length > 0 && (
            <AdminTableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{user.fullName}</p>
                        <p className="text-slate-600">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">{user.status}</td>
                      <td className="px-6 py-4">
                        <select value={user.status} disabled={updatingUserId === user.id} onChange={(e) => handleStatusChange(user.id, e.target.value as AdminUserStatus)} className="rounded-lg border px-3 py-2">
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="banned">banned</option>
                        </select>
                      </td>
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
