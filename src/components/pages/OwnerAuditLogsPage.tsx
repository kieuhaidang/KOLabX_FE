import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ApiError } from "../../services/api";
import { listOwnerAuditLogs, type AuditLogItem } from "../../services/ownerService";
import { AdminNotice, AdminPageIntro, AdminSectionCard, AdminTableShell } from "../admin/adminPrimitives";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ownerNavigationItems } from "../owner/ownerNavigation";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

export function OwnerAuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await listOwnerAuditLogs({ search });
        if (!cancelled) setItems(response.items);
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải audit logs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  return (
    <DashboardLayout navigationItems={ownerNavigationItems} role="owner">
      <div className="space-y-6">
        <AdminPageIntro eyebrow="Audit" title="Nhật ký hành động" description="Theo dõi thay đổi quan trọng trên hệ thống." />
        {errorMessage && <AdminNotice tone="danger">{errorMessage}</AdminNotice>}
        <AdminSectionCard title="Tìm kiếm" description="Action, target hoặc mô tả">
          <label className="relative block px-6 py-4">
            <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm log..." className="w-full rounded-lg border py-3 pl-10 pr-4" />
          </label>
        </AdminSectionCard>
        <AdminSectionCard title="Danh sách" description="Mới nhất trước">
          {loading && <p className="px-6 py-6 text-sm text-slate-600">Đang tải...</p>}
          {!loading && (
            <AdminTableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Người thực hiện</th>
                    <th className="px-6 py-4">Hành động</th>
                    <th className="px-6 py-4">Đối tượng</th>
                    <th className="px-6 py-4">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100">
                      <td className="px-6 py-4 text-slate-600">{formatDate(log.createdAt)}</td>
                      <td className="px-6 py-4">{log.actorRole} #{log.actorId ?? "-"}</td>
                      <td className="px-6 py-4 font-medium">{log.action}</td>
                      <td className="px-6 py-4">{log.targetType} {log.targetId}</td>
                      <td className="px-6 py-4 text-slate-600">{log.description || "-"}</td>
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
