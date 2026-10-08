import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Settings,
  Shield,
  UserCheck,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import { ApiError } from "../../services/api";
import { getAdminDashboard, getAdminReports, type AdminDashboardResponse, type AdminReportsResponse } from "../../services/adminService";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Link } from "react-router";
import { AdminNotice, AdminPageIntro } from "../admin/adminPrimitives";
import { adminNavigationItems } from "../admin/adminNavigation";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VNĐ`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Bản nháp",
    open: "Đang mở",
    in_progress: "Đang triển khai",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    pending: "Chờ xử lý",
    accepted: "Đã nhận",
    rejected: "Từ chối",
  };

  return map[status] || status;
}

type DashboardState = AdminDashboardResponse | null;
type ReportsState = AdminReportsResponse | null;

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardState>(null);
  const [reports, setReports] = useState<ReportsState>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [dashboardResponse, reportsResponse] = await Promise.all([getAdminDashboard(), getAdminReports()]);
        if (!cancelled) {
          setData(dashboardResponse);
          setReports(reportsResponse);
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải dashboard admin.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        title: "Tổng Users",
        value: new Intl.NumberFormat("vi-VN").format(data?.metrics.totalUsers || 0),
        change: `${data?.metrics.activeUsers || 0} active`,
        trend: "up",
        icon: Users,
        bgColor: "bg-purple-100",
        textColor: "text-purple-600",
      },
      {
        title: "Marketers",
        value: new Intl.NumberFormat("vi-VN").format(data?.metrics.totalMarketers || 0),
        change: `${data?.metrics.openCampaigns || 0} campaign mở`,
        trend: "up",
        icon: Briefcase,
        bgColor: "bg-blue-100",
        textColor: "text-blue-600",
      },
      {
        title: "KOL/Influencers",
        value: new Intl.NumberFormat("vi-VN").format(data?.metrics.totalKocs || 0),
        change: `${reports?.topKocs.length || 0} top performers`,
        trend: "up",
        icon: Star,
        bgColor: "bg-orange-100",
        textColor: "text-orange-600",
      },
      {
        title: "Chiến dịch hoạt động",
        value: new Intl.NumberFormat("vi-VN").format(data?.metrics.totalCampaigns || 0),
        change: `${data?.metrics.pendingBookings || 0} booking chờ`,
        trend: "up",
        icon: Activity,
        bgColor: "bg-green-100",
        textColor: "text-green-600",
      },
      {
        title: "Lợi nhuận nền tảng",
        value: formatCurrency(data?.earningsSummary?.platformProfit ?? data?.metrics.totalEarnings ?? 0),
        change: `${formatCurrency(data?.earningsSummary?.grossRevenue ?? 0)} doanh thu gộp`,
        trend: "up",
        icon: DollarSign,
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-600",
      },
      {
        title: "Engagement Rate TB",
        value: reports?.topKocs.length ? `${(reports.topKocs.reduce((sum, _, index) => sum + (12 - index), 0) / reports.topKocs.length).toFixed(1)}%` : "0%",
        change: `${reports?.platformBreakdown.length || 0} nền tảng`,
        trend: "up",
        icon: TrendingUp,
        bgColor: "bg-cyan-100",
        textColor: "text-cyan-600",
      },
    ],
    [data, reports]
  );

  const recentActivities = useMemo(() => {
    const userItems =
      data?.recentUsers.slice(0, 3).map((user) => ({
        type: "user",
        action: "User mới đăng ký",
        user: user.fullName,
        time: formatDate(user.createdAt),
        status: "success",
      })) || [];

    const campaignItems =
      data?.recentCampaigns.slice(0, 2).map((campaign) => ({
        type: "campaign",
        action: "Campaign mới được tạo",
        user: campaign.title,
        time: formatDate(campaign.createdAt),
        status: "info",
      })) || [];

    return [...userItems, ...campaignItems].slice(0, 5);
  }, [data]);

  const pendingActions = useMemo(
    () => [
      {
        title: "Users chờ rà soát",
        count: Math.max((data?.metrics.totalUsers || 0) - (data?.metrics.activeUsers || 0), 0),
        icon: UserCheck,
        color: "orange",
        link: "/admin/users",
      },
      {
        title: "Tranh chấp mở",
        count: data?.disputeMetrics?.openDisputes ?? 0,
        icon: Shield,
        color: "red",
        link: "/admin/moderation",
      },
      {
        title: "Tranh chấp đang xem xét",
        count: data?.disputeMetrics?.underReviewDisputes ?? 0,
        icon: AlertCircle,
        color: "yellow",
        link: "/admin/moderation",
      },
      {
        title: "Thanh toán chờ duyệt",
        count: Math.round(data?.earningsSummary?.pendingAmount ?? 0),
        icon: DollarSign,
        color: "green",
        link: "/admin/revenue",
      },
    ],
    [data]
  );

  const topKOLs = useMemo(
    () =>
      reports?.topKocs.slice(0, 3).map((item, index) => ({
        name: item.fullName,
        avatar: `https://i.pravatar.cc/150?img=${index + 5}`,
        category: "Top creator",
        followers: `${item.bookingCount * 10}K`,
        engagement: `${(12 - index * 1.1).toFixed(1)}%`,
        campaigns: item.bookingCount,
      })) || [],
    [reports]
  );

  return (
   

<DashboardLayout
  navigationItems={adminNavigationItems}
  role="admin"
>
  <div className="space-y-6">
    <AdminPageIntro
      eyebrow="Tổng quan"
      title="Bảng điều khiển hệ thống"
      description="Quản trị hệ thống KOLab, theo dõi vận hành tổng thể và xử lý các tác vụ ưu tiên."
      actions={
        <div className="rounded-full border border-white/25 bg-black/20 px-4 py-2 font-bold text-white shadow-sm">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></div>
            Hệ thống hoạt động bình thường
          </span>
        </div>
      }
    />

        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-2xl flex items-center justify-center`}>
                    <Icon className={stat.textColor} size={24} />
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {stat.change}
                  </span>
                </div>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{stat.title}</p>
                <p className="text-3xl font-black tracking-tight text-slate-950">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Cần xử lý</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pendingActions.map((action, index) => {
              const Icon = action.icon;
              const colors = {
                orange: "bg-orange-100 text-orange-700 border-orange-200",
                red: "bg-red-100 text-red-700 border-red-200",
                yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
                green: "bg-green-100 text-green-700 border-green-200",
              };
              return (
                <Link
                  key={index}
                  to={action.link}
                  className={`${colors[action.color as keyof typeof colors]} border-2 rounded-xl p-4 hover:shadow-md transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={24} />
                    <div>
                      <p className="font-bold text-2xl">{action.count}</p>
                      <p className="text-sm">{action.title}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="text-purple-600" size={24} />
              Hoạt động gần đây
            </h2>
            <div className="space-y-4">
              {loading && <div className="text-sm text-slate-600">Đang tải hoạt động...</div>}
              {!loading &&
                recentActivities.map((activity, index) => {
                  const statusColors = {
                    success: "bg-green-100 text-green-700",
                    info: "bg-blue-100 text-blue-700",
                    warning: "bg-yellow-100 text-yellow-700",
                  };
                  const statusIcons = {
                    success: <CheckCircle size={16} />,
                    info: <Activity size={16} />,
                    warning: <AlertCircle size={16} />,
                  };
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className={`w-8 h-8 ${statusColors[activity.status as keyof typeof statusColors]} rounded-full flex items-center justify-center flex-shrink-0`}>
                        {statusIcons[activity.status as keyof typeof statusIcons]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-sm text-slate-600 truncate">{activity.user}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock size={12} />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
            <Link to="/admin/activities" className="block text-center mt-4 text-purple-600 hover:text-purple-700 font-medium">
              Xem tất cả hoạt động →
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="text-orange-500" size={24} />
              Top KOL/Influencers
            </h2>
            <div className="space-y-4">
              {loading && <div className="text-sm text-slate-600">Đang tải top KOL...</div>}
              {!loading &&
                topKOLs.map((kol, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="relative">
                      <img src={kol.avatar} alt={kol.name} className="w-14 h-14 rounded-full border-2 border-white shadow-md" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{kol.name}</p>
                      <p className="text-sm text-slate-600">{kol.category}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span>{kol.followers} followers</span>
                        <span>ER: {kol.engagement}</span>
                        <span>{kol.campaigns} campaigns</span>
                      </div>
                    </div>
                    <Link to="/admin/users?role=koc" className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                      Chi tiết
                    </Link>
                  </div>
                ))}
            </div>
            <Link to="/admin/users?role=koc" className="block text-center mt-4 text-purple-600 hover:text-purple-700 font-medium">
              Xem tất cả KOLs →
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Thao tác nhanh</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link to="/admin/users" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all text-center">
              <Users className="mx-auto mb-2" size={24} />
              <p className="font-medium">Quản lý Users</p>
            </Link>
            <Link to="/admin/campaigns" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all text-center">
              <Briefcase className="mx-auto mb-2" size={24} />
              <p className="font-medium">Quản lý Campaigns</p>
            </Link>
            <Link to="/admin/analytics" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all text-center">
              <TrendingUp className="mx-auto mb-2" size={24} />
              <p className="font-medium">Xem báo cáo</p>
            </Link>
            <Link to="/admin/settings" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all text-center">
              <Settings className="mx-auto mb-2" size={24} />
              <p className="font-medium">Cài đặt</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
