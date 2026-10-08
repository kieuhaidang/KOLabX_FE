import {
  LayoutDashboard,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  CreditCard,
  Settings,
  Shield,
  Wallet,
} from "lucide-react";

export const adminNavigationItems = [
  { path: "/admin/dashboard", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
  { path: "/admin/users", label: "Quản lý Users", icon: <Users size={20} /> },
  { path: "/admin/campaigns", label: "Quản lý Campaigns", icon: <Briefcase size={20} /> },
  { path: "/admin/analytics", label: "Báo cáo & Phân tích", icon: <TrendingUp size={20} /> },
  { path: "/admin/withdrawals", label: "Duyệt rút tiền", icon: <Wallet size={20} /> },
  { path: "/admin/payments", label: "Xác nhận thanh toán", icon: <CreditCard size={20} /> },
  { path: "/admin/revenue", label: "Doanh thu", icon: <DollarSign size={20} /> },
  { path: "/admin/moderation", label: "Kiểm duyệt", icon: <Shield size={20} /> },
  { path: "/admin/settings", label: "Cài đặt", icon: <Settings size={20} /> },
];
