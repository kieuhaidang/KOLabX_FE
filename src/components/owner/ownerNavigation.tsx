import { LayoutDashboard, Users, DollarSign, ScrollText } from "lucide-react";

export const ownerNavigationItems = [
  { path: "/owner/dashboard", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
  { path: "/owner/admins", label: "Quản lý Admin", icon: <Users size={20} /> },
  { path: "/owner/revenue", label: "Doanh thu", icon: <DollarSign size={20} /> },
  { path: "/owner/financial-settings", label: "Cài đặt tài chính", icon: <DollarSign size={20} /> },
  { path: "/owner/audit-logs", label: "Nhật ký audit", icon: <ScrollText size={20} /> },
];
