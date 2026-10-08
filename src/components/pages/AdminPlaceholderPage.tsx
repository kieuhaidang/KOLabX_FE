import React from "react";
import { Link, useLocation } from "react-router";
import { Briefcase, LayoutDashboard, Settings, Shield, TrendingUp, Users, Wrench } from "lucide-react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { adminNavigationItems } from "../admin/adminNavigation";
import { AdminPageIntro } from "../admin/adminPrimitives";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/admin/campaigns": {
    title: "Quản lý Campaigns",
    description: "Khu vực này sẽ dùng để quản lý toàn bộ campaign, trạng thái hoạt động, ngân sách và kiểm soát chất lượng chiến dịch.",
  },
  "/admin/moderation": {
    title: "Kiểm duyệt nội dung",
    description: "Theo dõi nội dung chờ duyệt, cảnh báo vi phạm và các trường hợp cần xử lý thủ công bởi quản trị viên.",
  },
  "/admin/settings": {
    title: "Cài đặt hệ thống",
    description: "Quản lý cấu hình nền tảng, chính sách vận hành, quyền hạn và các thiết lập nâng cao dành cho admin.",
  },
  "/admin/activities": {
    title: "Nhật ký hoạt động",
    description: "Theo dõi các hành động mới nhất trong hệ thống: user, campaign, moderation, thanh toán và cảnh báo.",
  },
  "/admin/support": {
    title: "Khiếu nại & hỗ trợ",
    description: "Khu vực dành cho các ticket hỗ trợ, khiếu nại chưa xử lý và các trường hợp cần ưu tiên phản hồi.",
  },
};

const quickLinks = [
  { to: "/admin/dashboard", label: "Về tổng quan", icon: <LayoutDashboard size={18} /> },
  { to: "/admin/users", label: "Quản lý users", icon: <Users size={18} /> },
  { to: "/admin/campaigns", label: "Quản lý campaigns", icon: <Briefcase size={18} /> },
  { to: "/admin/analytics", label: "Xem analytics", icon: <TrendingUp size={18} /> },
  { to: "/admin/moderation", label: "Tranh chấp", icon: <Shield size={18} /> },
  { to: "/admin/settings", label: "Cài đặt", icon: <Settings size={18} /> },
];

export function AdminPlaceholderPage() {
  const location = useLocation();
  const meta = pageMeta[location.pathname] || {
    title: "Module admin",
    description: "Khu vực này đang được hoàn thiện để đồng bộ cùng hệ thống quản trị hiện tại.",
  };

  return (
    <DashboardLayout navigationItems={adminNavigationItems} role="admin">
      <div className="space-y-6">
        <AdminPageIntro
          eyebrow="Admin module"
          title={meta.title}
          description={meta.description}
          actions={<Wrench size={24} className="text-purple-100" />}
        />

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-3">Trạng thái</h2>
          <p className="text-slate-600 leading-7">
            Module này đã có route và điều hướng đầy đủ để không bị gãy luồng sử dụng trong admin.
            Phần xử lý dữ liệu chi tiết sẽ được kết nối tiếp theo khi bạn chốt yêu cầu nghiệp vụ cho module này.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-4">Đi nhanh tới module khác</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="font-medium text-slate-800">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
