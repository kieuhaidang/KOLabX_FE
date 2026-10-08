import { useEffect, useState } from "react";
import { Lock, User } from "lucide-react";
import { ApiError } from "../../services/api";
import { changePassword, getMyProfile, type AccountProfile } from "../../services/profileService";
import { AdminNotice, AdminPageIntro, AdminSectionCard } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { adminNavigationItems } from "../admin/adminNavigation";
import { ownerNavigationItems } from "../owner/ownerNavigation";

type AdminAccountProfilePageProps = {
  layoutRole: "admin" | "owner";
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function roleLabel(role: string) {
  if (role === "owner") return "Chủ hệ thống";
  if (role === "admin") return "Quản trị viên";
  if (role === "marketer") return "Marketer";
  if (role === "koc") return "KOC";
  return role;
}

function statusLabel(status: string) {
  if (status === "active") return "Hoạt động";
  if (status === "inactive") return "Tạm ngưng";
  if (status === "banned") return "Bị khóa";
  return status;
}

export function AdminAccountProfilePage({ layoutRole }: AdminAccountProfilePageProps) {
  const navigationItems = layoutRole === "owner" ? ownerNavigationItems : adminNavigationItems;
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await getMyProfile();
        if (!cancelled) setProfile(response.profile as AccountProfile);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải thông tin tài khoản.");
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    setSaving(true);
    try {
      const response = await changePassword({ currentPassword, newPassword, confirmPassword });
      setSuccessMessage(response.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể đổi mật khẩu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navigationItems={navigationItems} role={layoutRole}>
      <div className="space-y-6">
        <AdminPageIntro
          eyebrow="Tài khoản"
          title="Hồ sơ cá nhân"
          description="Thông tin đăng nhập và đổi mật khẩu tài khoản quản trị."
          actions={<User className="text-white/80" size={28} />}
        />

        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}
        {successMessage && <AdminNotice tone="success">{successMessage}</AdminNotice>}

        <AdminSectionCard title="Thông tin tài khoản" description="Dữ liệu từ hệ thống cho tài khoản đang đăng nhập.">
          {loading && <p className="px-6 py-6 text-sm text-slate-600">Đang tải...</p>}
          {!loading && profile && (
            <dl className="grid gap-4 px-6 py-6 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-slate-500">Họ tên</dt>
                <dd className="mt-1 font-medium text-slate-900">{profile.fullName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-1 font-medium text-slate-900">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Vai trò</dt>
                <dd className="mt-1 font-medium text-slate-900">{roleLabel(profile.role)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Trạng thái</dt>
                <dd className="mt-1 font-medium text-slate-900">{statusLabel(profile.status)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Ngày tạo</dt>
                <dd className="mt-1 text-slate-800">{formatDateTime(profile.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Cập nhật lần cuối</dt>
                <dd className="mt-1 text-slate-800">{formatDateTime(profile.updatedAt)}</dd>
              </div>
            </dl>
          )}
          {!loading && !profile && !errorMessage && (
            <div className="px-6 py-6 text-sm text-slate-600">
              KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin tÃ i khoáº£n cho ngÆ°á»i dÃ¹ng hiá»‡n táº¡i.
            </div>
          )}
        </AdminSectionCard>

        <AdminSectionCard title="Đổi mật khẩu" description="Nhập mật khẩu hiện tại để xác nhận trước khi lưu mật khẩu mới.">
          <form onSubmit={handleChangePassword} className="space-y-4 px-6 py-6 max-w-lg">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Mật khẩu hiện tại</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Mật khẩu mới</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
            >
              <Lock size={18} />
              {saving ? "Đang lưu..." : "Cập nhật mật khẩu"}
            </button>
          </form>
        </AdminSectionCard>
      </div>
    </DashboardLayout>
  );
}
