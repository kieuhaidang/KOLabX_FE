import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { ApiError } from "../../services/api";
import {
  getOwnerFinancialSettings,
  updateOwnerFinancialSettings,
  type PlatformFinancialSettings,
} from "../../services/ownerService";
import { AdminNotice, AdminPageIntro, AdminSectionCard } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ownerNavigationItems } from "../owner/ownerNavigation";

export function OwnerFinancialSettingsPage() {
  const [settings, setSettings] = useState<PlatformFinancialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await getOwnerFinancialSettings();
        if (!cancelled) setSettings(response.settings);
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải cài đặt.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await updateOwnerFinancialSettings({
        platformFeePercent: settings.platformFeePercent,
        kocPayoutPercent: settings.kocPayoutPercent,
        payoutDelayDays: settings.payoutDelayDays,
        autoReleaseEnabled: settings.autoReleaseEnabled,
      });
      setSettings(response.settings);
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navigationItems={ownerNavigationItems} role="owner">
      <div className="space-y-6">
        <AdminPageIntro eyebrow="Tài chính" title="Cài đặt tài chính nền tảng" description="Phí nền tảng, payout KOC và tự động giải phóng." />
        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}
        {successMessage && <AdminNotice tone="info">{successMessage}</AdminNotice>}
        <AdminSectionCard title="Tham số" description="Chỉ Owner được chỉnh sửa">
          {loading && <p className="px-6 py-6 text-sm text-slate-600">Đang tải...</p>}
          {!loading && settings && (
            <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
              <label className="text-sm">
                Phí nền tảng (%)
                <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2" value={settings.platformFeePercent} onChange={(e) => setSettings({ ...settings, platformFeePercent: Number(e.target.value) })} />
              </label>
              <label className="text-sm">
                Payout KOC (%)
                <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2" value={settings.kocPayoutPercent} onChange={(e) => setSettings({ ...settings, kocPayoutPercent: Number(e.target.value) })} />
              </label>
              <label className="text-sm">
                Độ trễ payout (ngày)
                <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2" value={settings.payoutDelayDays} onChange={(e) => setSettings({ ...settings, payoutDelayDays: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.autoReleaseEnabled} onChange={(e) => setSettings({ ...settings, autoReleaseEnabled: e.target.checked })} />
                Tự động giải phóng thanh toán
              </label>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white md:col-span-2">
                <Save size={16} />
                {saving ? "Đang lưu..." : "Lưu cài đặt"}
              </button>
            </div>
          )}
        </AdminSectionCard>
      </div>
    </DashboardLayout>
  );
}

