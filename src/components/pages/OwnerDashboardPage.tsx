import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, Briefcase, Crown, DollarSign, ScrollText, ShieldAlert, User, Users } from "lucide-react";
import { ApiError } from "../../services/api";
import { getOwnerDashboard, type OwnerDashboardResponse } from "../../services/ownerService";
import { AdminNotice, AdminPageIntro, AdminSectionCard, AdminStatCard } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ownerNavigationItems } from "../owner/ownerNavigation";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VNĐ`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

const quickLinks = [
  { to: "/owner/admins", label: "Quản lý Admin", icon: Users },
  { to: "/owner/revenue", label: "Doanh thu", icon: DollarSign },
  { to: "/owner/financial-settings", label: "Cài đặt tài chính", icon: Briefcase },
  { to: "/owner/audit-logs", label: "Nhật ký audit", icon: ScrollText },
  { to: "/owner/profile", label: "Hồ sơ", icon: User },
];

export function OwnerDashboardPage() {
  const [data, setData] = useState<OwnerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await getOwnerDashboard();
        if (!cancelled) setData(response);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải bảng điều khiển Owner.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => data?.metrics, [data]);
  const earnings = useMemo(() => data?.earningsSummary, [data]);

  return (
    <DashboardLayout navigationItems={ownerNavigationItems} role="owner">
      <div className="space-y-6">
        <AdminPageIntro
          eyebrow="Owner"
          title="Bảng điều khiển chủ hệ thống"
          description="Tổng quan người dùng, tài chính, tranh chấp và nhật ký vận hành."
          actions={<Crown className="text-amber-300" size={28} />}
        />
        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard title="Tổng người dùng" value={String(metrics?.totalUsers ?? 0)} subtitle={`${metrics?.activeUsers ?? 0} đang hoạt động`} icon={<Users size={20} />} />
          <AdminStatCard title="Admin" value={String(metrics?.totalAdmins ?? 0)} subtitle={`${metrics?.activeAdmins ?? 0} active`} icon={<Users size={20} />} />
          <AdminStatCard title="Tranh chấp mở" value={String(metrics?.openDisputes ?? 0)} subtitle={`${metrics?.totalDisputes ?? 0} tổng`} icon={<ShieldAlert size={20} />} tone="warning" />
          <AdminStatCard title="Campaigns" value={String(metrics?.totalCampaigns ?? 0)} subtitle={`${metrics?.openCampaigns ?? 0} đang mở`} icon={<Briefcase size={20} />} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard title="Tổng doanh thu" value={formatCurrency(earnings?.grossRevenue ?? 0)} subtitle={`Phí ${earnings?.platformFeePercent ?? 0}%`} icon={<DollarSign size={20} />} />
          <AdminStatCard title="Hoa hồng KOC" value={formatCurrency(earnings?.creatorCommission ?? 0)} subtitle="KOC net payout" icon={<DollarSign size={20} />} tone="success" />
          <AdminStatCard title="Lợi nhuận nền tảng" value={formatCurrency(earnings?.platformProfit ?? 0)} subtitle="Theo tỷ lệ phí nền tảng" icon={<DollarSign size={20} />} />
          <AdminStatCard title="Chờ thanh toán" value={formatCurrency(earnings?.pendingAmount ?? 0)} subtitle="Pending KOC payout" icon={<DollarSign size={20} />} tone="warning" />
        </div>

        <AdminSectionCard title="Truy cập nhanh" description="Các module quản trị chính">
          <div className="grid gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-purple-300 hover:bg-purple-50"
              >
                <item.icon size={18} className="text-purple-600" />
                {item.label}
              </Link>
            ))}
          </div>
        </AdminSectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminSectionCard title="Trạng thái booking" description="Phân bổ trạng thái booking">
            {loading && <p className="px-6 py-4 text-sm text-slate-600">Đang tải...</p>}
            {!loading && (
              <ul className="divide-y divide-slate-100">
                {(data?.bookingStatusBreakdown || []).map((item) => (
                  <li key={item.status} className="flex items-center justify-between px-6 py-3 text-sm">
                    <span className="font-medium text-slate-800">{item.status}</span>
                    <span className="text-slate-600">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Audit gần đây" description="Hành động admin/owner mới nhất">
            <div className="space-y-3 px-6 py-4">
              {(data?.recentAuditLogs || []).length === 0 && !loading && (
                <p className="text-sm text-slate-600">Chưa có nhật ký audit.</p>
              )}
              {(data?.recentAuditLogs || []).map((log) => (
                <div key={log.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-900">{log.action}</p>
                  <p className="mt-1 text-slate-600">{log.description || "-"}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                </div>
              ))}
              <Link to="/owner/audit-logs" className="block text-center text-sm font-medium text-purple-600 hover:text-purple-700">
                Xem tất cả audit logs
              </Link>
            </div>
          </AdminSectionCard>
        </div>

        <AdminSectionCard title="Người dùng mới" description="Đăng ký gần đây">
          <div className="space-y-3 px-6 py-4">
            {(data?.recentUsers || []).map((user) => (
              <div key={user.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <Activity size={16} className="text-purple-600" />
                <div>
                  <p className="font-medium text-slate-900">{user.fullName}</p>
                  <p className="text-slate-600">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminSectionCard>
      </div>
    </DashboardLayout>
  );
}
