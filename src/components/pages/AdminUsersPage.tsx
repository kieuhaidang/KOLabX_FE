import { useEffect, useMemo, useState } from "react";
import { Search, ShieldAlert, UserCog } from "lucide-react";
import { ApiError } from "../../services/api";
import {
  listAdminUsers,
  updateAdminUserStatus,
  type AdminUser,
  type AdminUserRole,
  type AdminUserStatus,
} from "../../services/adminService";
import { AdminNotice, AdminPageIntro, AdminSectionCard, AdminStatCard, AdminTableShell } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { adminNavigationItems } from "../admin/adminNavigation";

const roleOptions: Array<{ value: AdminUserRole | ""; label: string }> = [
  { value: "", label: "Tất cả vai trò" },
  { value: "marketer", label: "Marketer" },
  { value: "koc", label: "KOC" },
];

const statusOptions: Array<{ value: AdminUserStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Tạm ngưng" },
  { value: "banned", label: "Bị khóa" },
];

function roleLabel(role: AdminUserRole) {
  if (role === "marketer") return "Marketer";
  if (role === "koc") return "KOC";
  return role;
}

function statusLabel(status: AdminUserStatus) {
  if (status === "active") return "Hoạt động";
  if (status === "inactive") return "Tạm ngưng";
  return "Bị khóa";
}

function statusBadge(status: AdminUserStatus) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "inactive") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

export function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AdminUserRole | "">("");
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
        const response = await listAdminUsers({ search, role, status });
        if (!cancelled) setItems(response.items);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải danh sách người dùng.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [role, search, status]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      marketers: items.filter((item) => item.role === "marketer").length,
      kocs: items.filter((item) => item.role === "koc").length,
    };
  }, [items]);

  const handleStatusChange = async (userId: number, nextStatus: AdminUserStatus) => {
    setUpdatingUserId(userId);
    setErrorMessage("");

    try {
      const response = await updateAdminUserStatus(userId, nextStatus);
      setItems((current) => current.map((item) => (item.id === userId ? response.user : item)));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể cập nhật trạng thái người dùng.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
   <DashboardLayout
  navigationItems={adminNavigationItems}
  role="admin"
>
  <div className="space-y-6">
    <AdminPageIntro
      eyebrow="Quản lý người dùng"
      title="Marketer & KOC Management"
      description="Theo dõi, tìm kiếm và quản lý toàn bộ tài khoản Marketer và KOC trong hệ thống KOLab."
      actions={
        <div className="rounded-lg bg-white/15 px-4 py-3 text-sm text-white">
          Chỉ quản lý tài khoản Marketer & KOC
        </div>
      }
    />

        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}

        <div className="grid gap-4 md:grid-cols-3">
          <AdminStatCard title="Tổng số" value={String(counts.total)} subtitle="Marketer + KOC theo bộ lọc" icon={<UserCog size={20} />} />
          <AdminStatCard title="Marketer" value={String(counts.marketers)} subtitle="Tài khoản thương hiệu" icon={<UserCog size={20} />} />
          <AdminStatCard title="KOC" value={String(counts.kocs)} subtitle="Tài khoản creator" icon={<UserCog size={20} />} />
        </div>

        <AdminSectionCard title="Bộ lọc & tìm kiếm" description="Tìm người dùng theo tên, email, vai trò hoặc trạng thái hoạt động.">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-purple-500"
              />
            </label>

            <select value={role} onChange={(e) => setRole(e.target.value as AdminUserRole | "")} className="rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-purple-500">
              {roleOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as AdminUserStatus | "")} className="rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-purple-500">
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </AdminSectionCard>

        <AdminSectionCard title="Danh sách tài khoản" description="Theo dõi toàn bộ tài khoản và cập nhật trạng thái khi cần.">
          {loading && <div className="px-6 py-8 text-sm text-slate-600">Đang tải danh sách người dùng...</div>}

          {!loading && items.length === 0 && <div className="px-6 py-8 text-sm text-slate-600">Không có tài khoản phù hợp với bộ lọc hiện tại.</div>}

          {!loading && items.length > 0 && (
            <AdminTableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Người dùng</th>
                    <th className="px-6 py-4 font-medium">Vai trò</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium">Ngày tạo</th>
                    <th className="px-6 py-4 font-medium">Cập nhật</th>
                    <th className="px-6 py-4 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{user.fullName}</p>
                        <p className="mt-1 text-slate-600">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{roleLabel(user.role)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(user.status)}`}>{statusLabel(user.status)}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(user.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={user.status}
                          disabled={updatingUserId === user.id}
                          onChange={(e) => handleStatusChange(user.id, e.target.value as AdminUserStatus)}
                          className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-purple-500 disabled:opacity-60"
                        >
                          <option value="active">Hoạt động</option>
                          <option value="inactive">Tạm ngưng</option>
                          <option value="banned">Bị khóa</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableShell>
          )}
        </AdminSectionCard>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <p>Khuyến nghị: chỉ chuyển sang trạng thái <span className="font-semibold">Bị khóa</span> với các tài khoản vi phạm rõ ràng. Với trường hợp cần rà soát thêm, ưu tiên dùng <span className="font-semibold">Tạm ngưng</span>.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
