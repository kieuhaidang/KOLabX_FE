import { useEffect, useMemo, useState } from "react";
import { DollarSign, Download, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { listAdminEarnings, type AdminEarning, type AdminEarningsSummary } from "../../services/adminService";
import { ApiError } from "../../services/api";
import { AdminNotice, AdminPageIntro, AdminSectionCard, AdminStatCard, AdminTableShell } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { adminNavigationItems } from "../admin/adminNavigation";
type AdminEarningsPageProps = {
  navigationItems?: typeof adminNavigationItems;
  layoutRole?: "admin" | "owner";
  pageTitle?: string;
  pageDescription?: string;
};

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VNĐ`;
}

function formatPaidAt(value: string | null, status: AdminEarning["status"]) {
  if (status !== "paid") return "-";
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function earningStatusLabel(status: AdminEarning["status"]) {
  if (status === "paid") return "Đã thanh toán";
  if (status === "pending") return "Chờ thanh toán";
  return "Đã hủy";
}

function earningStatusBadge(status: AdminEarning["status"]) {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

const emptySummary: AdminEarningsSummary = {
  grossRevenue: 0,
  creatorCommission: 0,
  platformProfit: 0,
  paidAmount: 0,
  pendingAmount: 0,
  totalRecords: 0,
};

export function AdminEarningsPage({
  navigationItems = adminNavigationItems,
  layoutRole = "admin",
  pageTitle = "Dòng tiền và thanh toán hệ thống",
  pageDescription = "Theo dõi các khoản thanh toán theo booking, KOC và chiến dịch với trạng thái xử lý rõ ràng.",
}: AdminEarningsPageProps) {
  const [items, setItems] = useState<AdminEarning[]>([]);
  const [summary, setSummary] = useState<AdminEarningsSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await listAdminEarnings();
        if (!cancelled) {
          setItems(response.items);
          setSummary(response.summary ?? emptySummary);
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải dữ liệu thu nhập hệ thống.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => summary, [summary]);

  return (
    <DashboardLayout navigationItems={navigationItems} role={layoutRole}>
      <div className="space-y-6">
        <AdminPageIntro
          eyebrow="Thu nhập"
          title={pageTitle}
          description={pageDescription}
          actions={
            <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-purple-600 transition-colors hover:bg-purple-50">
              <Download size={18} />
              Xuất báo cáo
            </button>
          }
        />

        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Tổng doanh thu"
            value={formatCurrency(metrics.grossRevenue)}
            subtitle={`${metrics.totalRecords} giao dịch · Đã thanh toán ${formatCurrency(metrics.paidAmount)}`}
            icon={<Wallet size={20} />}
          />
          <AdminStatCard
            title="Hoa hồng KOC"
            value={formatCurrency(metrics.creatorCommission)}
            subtitle="Tổng payout cho creator (paid + pending)"
            icon={<DollarSign size={20} />}
            tone="success"
          />
          <AdminStatCard
            title="Lợi nhuận nền tảng"
            value={formatCurrency(metrics.platformProfit)}
            subtitle="Doanh thu giao dịch trừ hoa hồng KOC"
            icon={<TrendingUp size={20} />}
          />
          <AdminStatCard
            title="Chờ thanh toán"
            value={formatCurrency(metrics.pendingAmount)}
            subtitle="Payout KOC chưa xử lý"
            icon={<ReceiptText size={20} />}
            tone="warning"
          />
        </div>

        <AdminSectionCard title="Danh sách thanh toán" description="Toàn bộ khoản thanh toán theo chiến dịch, marketer và KOC.">
          {loading && <div className="px-6 py-8 text-sm text-slate-600">Đang tải dữ liệu thanh toán...</div>}

          {!loading && items.length === 0 && <div className="px-6 py-8 text-sm text-slate-600">Chưa có dữ liệu thu nhập để hiển thị.</div>}

          {!loading && items.length > 0 && (
            <AdminTableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Chiến dịch</th>
                    <th className="px-6 py-4 font-medium">Marketer</th>
                    <th className="px-6 py-4 font-medium">KOC</th>
                    <th className="px-6 py-4 font-medium">Số tiền</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium">Ngày trả</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{item.campaignTitle}</p>
                        <p className="mt-1 text-slate-500">Booking #{item.bookingId}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{item.marketerName}</td>
                      <td className="px-6 py-4 text-slate-700">{item.kocName}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${earningStatusBadge(item.status)}`}>{earningStatusLabel(item.status)}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatPaidAt(item.paidAt, item.status)}</td>
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
