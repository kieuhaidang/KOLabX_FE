import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  DollarSign,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useAuth } from "../auth/AuthProvider";
import { getMarketerStats, type MarketerStats } from "../../services/campaignService";
import { listMarketerSubmissions, type MarketerSubmission } from "../../services/bookingService";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VND`;
}

function formatChartDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

export function MarketerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MarketerStats | null>(null);
  const [submissions, setSubmissions] = useState<MarketerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      setLoading(true);
      setErrorMessage("");
      try {
        const [statsResponse, submissionResponse] = await Promise.all([
          getMarketerStats(),
          listMarketerSubmissions(),
        ]);

        if (cancelled) return;
        setStats(statsResponse);
        setSubmissions(submissionResponse.items);
      } catch (error) {
        console.error("Failed to fetch marketer dashboard", error);
        if (!cancelled) setErrorMessage("Không thể tải dữ liệu tổng quan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    return (stats?.spendingTrend || []).map((item) => ({
      date: formatChartDate(item.date),
      amount: item.amount,
    }));
  }, [stats]);

  const pendingReviews = useMemo(() => {
    return submissions
      .filter(
        (item) =>
          item.status === "draft_submitted" ||
          item.status === "final_submitted" ||
          (Boolean(item.draftLink || item.finalLink) && item.status !== "completed")
      )
      .sort((a, b) => +new Date(b.submittedAt || 0) - +new Date(a.submittedAt || 0))
      .slice(0, 3);
  }, [submissions]);

  return (
    <DashboardLayout role="marketer">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Chào mừng, {user?.fullName}!</h1>
            <p className="text-slate-600">Theo dõi hiệu quả chiến dịch và ngân sách của bạn.</p>
          </div>
          <Link
            to="/marketer/campaigns"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/10 transition-all hover:bg-primary-hover"
          >
            <Plus size={20} />
            Tạo chiến dịch mới
          </Link>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="rounded-2xl bg-green-100 p-3 text-green-600">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng chi tiêu</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : formatCurrency(stats?.totalSpent || 0)}</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">Dựa trên các job đã hoàn thành</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">KOC đang làm việc</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : stats?.activeKocs || 0}</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">KOC đã được duyệt vào chiến dịch</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="rounded-2xl bg-purple-100 p-3 text-purple-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tỷ lệ ROI ước tính</p>
                <h3 className="text-2xl font-bold">4.2x</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">Hiệu suất trung bình của sàn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold">Xu hướng chi tiêu (30 ngày qua)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--kl-primary)" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="var(--kl-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(value) => `${Number(value) / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: number) => [formatCurrency(value), "Số tiền"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--kl-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-secondary to-primary p-6 text-white">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-bold">Thông tin từ AI</h3>
              </div>
              <p className="mb-4 text-sm text-purple-100">Tạo brief chiến dịch hoặc tìm KOC phù hợp bằng AI Smart Matching.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/marketer/auto-briefing" className="rounded-xl bg-white px-4 py-2 text-center text-sm font-bold text-purple-600 hover:bg-purple-50">
                  Auto Briefing
                </Link>
                <Link to="/marketer/smart-matching" className="rounded-xl bg-white/15 px-4 py-2 text-center text-sm font-bold text-white ring-1 ring-white/30 hover:bg-white/20">
                  Smart Matching
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-orange-500" size={20} />
                  <h3 className="font-bold">Kịch bản chờ duyệt</h3>
                </div>
                <Link to="/marketer/submissions" className="text-xs font-medium text-primary hover:underline">
                  Xem tất cả
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingReviews.length === 0 && (
                  <div className="p-4 text-sm text-slate-600">Không có booking chờ duyệt.</div>
                )}
                {pendingReviews.map((review) => (
                  <div key={review.bookingId} className="p-4 hover:bg-slate-50">
                    <p className="mb-1 font-medium">{review.kocName}</p>
                    <p className="mb-1 text-sm text-slate-600">{review.campaignTitle}</p>
                    <p className="mb-2 text-xs text-slate-500">{formatDateTime(review.submittedAt)}</p>
                    <Link
                      to="/marketer/submissions"
                      className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Xem bài nộp
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold">Lối tắt nhanh</h3>
              <div className="grid gap-4">
                <Link to="/marketer/campaigns" className="group flex items-center justify-between rounded-2xl bg-slate-50 p-4 transition-all hover:bg-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white p-2 shadow-sm">
                      <Briefcase size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Danh sách chiến dịch</p>
                      <p className="text-sm text-slate-500">Quản lý và cập nhật tiến độ</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </Link>

                <Link to="/top-kols" className="group flex items-center justify-between rounded-2xl bg-slate-50 p-4 transition-all hover:bg-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white p-2 shadow-sm">
                      <TrendingUp size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Khám phá Top KOC</p>
                      <p className="text-sm text-slate-500">Tìm kiếm gương mặt đại diện mới</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-orange-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
