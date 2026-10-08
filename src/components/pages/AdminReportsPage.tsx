import { useEffect, useMemo, useState } from "react";
import { BarChart3, Briefcase, PieChart, TrendingUp } from "lucide-react";
import { ApiError } from "../../services/api";
import { getAdminReports, type AdminReportsResponse } from "../../services/adminService";
import { AdminNotice, AdminPageIntro, AdminSectionCard } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { adminNavigationItems } from "../admin/adminNavigation";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VNĐ`;
}

function campaignStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Bản nháp",
    open: "Đang mở",
    in_progress: "Đang triển khai",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return map[status] || status;
}

type ReportsState = AdminReportsResponse | null;

export function AdminReportsPage() {
  const [data, setData] = useState<ReportsState>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await getAdminReports();
        if (!cancelled) setData(response);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải báo cáo hệ thống.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const revenuePeak = useMemo(() => {
    return Math.max(...(data?.monthlyRevenue.map((item) => item.totalAmount) || [1]));
  }, [data]);

  return (
    <DashboardLayout
  navigationItems={adminNavigationItems}
  role="admin"
>
  <div className="space-y-6">
    <AdminPageIntro
      eyebrow="Analytics Dashboard"
      title="Báo cáo & Phân tích hệ thống"
      description="Theo dõi doanh thu, hiệu suất chiến dịch, top Marketer/KOC và các chỉ số vận hành quan trọng của nền tảng KOLab."
    />

        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminSectionCard title="Doanh thu theo tháng" description="6 mốc gần nhất dựa trên dữ liệu earnings." actions={<TrendingUp className="text-emerald-600" size={18} />}>
            {loading && <p className="text-sm text-slate-600">Đang tải biểu đồ doanh thu...</p>}

            {!loading && data && (
              <div className="space-y-4">
                {data.monthlyRevenue.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{item.label}</p>
                        <p className="text-slate-500">{item.bookingsCount} booking</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatCurrency(item.totalAmount)}</p>
                        <p className="text-slate-500">Đã thanh toán {formatCurrency(item.paidAmount)}</p>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-[linear-gradient(90deg,_#059669_0%,_#0ea5e9_100%)]"
                        style={{ width: `${Math.max((item.totalAmount / revenuePeak) * 100, 10)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Phân bổ nền tảng" description="Các nền tảng chiến dịch đang được sử dụng nhiều nhất." actions={<PieChart className="text-primary" size={18} />}>
            {loading && <p className="text-sm text-slate-600">Đang tải phân bổ nền tảng...</p>}

            {!loading && data && (
              <div className="space-y-3">
                {data.platformBreakdown.map((item, index) => (
                  <div key={item.platform} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.platform}</p>
                      <p className="text-sm text-slate-500">Thứ hạng #{index + 1}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">{item.count} chiến dịch</span>
                  </div>
                ))}
              </div>
            )}
          </AdminSectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <AdminSectionCard title="Top KOC theo thu nhập" actions={<BarChart3 className="text-primary" size={18} />}>
            {loading && <p className="text-sm text-slate-600">Đang tải danh sách KOC...</p>}
            {!loading && data && (
              <div className="space-y-3">
                {data.topKocs.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">#{index + 1} {item.fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.bookingCount} booking tạo doanh thu</p>
                    <p className="mt-2 text-sm font-medium text-emerald-700">{formatCurrency(item.totalAmount)}</p>
                  </div>
                ))}
              </div>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Top marketer theo ngân sách" actions={<Briefcase className="text-amber-600" size={18} />}>
            {loading && <p className="text-sm text-slate-600">Đang tải marketer nổi bật...</p>}
            {!loading && data && (
              <div className="space-y-3">
                {data.topMarketers.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">#{index + 1} {item.fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.campaignCount} chiến dịch đã tạo</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(item.totalBudget)}</p>
                  </div>
                ))}
              </div>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Trạng thái chiến dịch" actions={<PieChart className="text-rose-600" size={18} />}>
            {loading && <p className="text-sm text-slate-600">Đang tải trạng thái chiến dịch...</p>}
            {!loading && data && (
              <div className="space-y-3">
                {data.campaignStatusBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-800">{campaignStatusLabel(item.status)}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </AdminSectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
