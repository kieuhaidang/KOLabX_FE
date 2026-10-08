import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { 
  Wallet, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { adminListWithdrawals, adminUpdateWithdrawalStatus, type Withdrawal } from "../../services/withdrawalService";
import { adminNavigationItems } from "../admin/adminNavigation";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VNĐ`;
}

export function AdminWithdrawalsPage() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<Withdrawal | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminListWithdrawals(filter === "all" ? undefined : filter as any);
      setItems(res.items);
    } catch (err: any) {
      alert("Lỗi tải danh sách: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (selectedItem) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedItem]);

  const handleUpdateStatus = async (status: Withdrawal["status"]) => {
    if (!selectedItem) return;
    try {
      await adminUpdateWithdrawalStatus(selectedItem.id, status, adminNote);
      setSelectedItem(null);
      setAdminNote("");
      fetchData();
      alert("Đã cập nhật trạng thái yêu cầu!");
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <DashboardLayout navigationItems={adminNavigationItems} role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="text-primary" size={32} />
              Quản lý rút tiền
            </h1>
            <p className="text-slate-500 mt-1">Duyệt và xử lý các yêu cầu thanh toán từ KOC</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            {['all', 'pending', 'completed', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  filter === s ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ duyệt' : s === 'completed' ? 'Hoàn tất' : 'Từ chối'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4">KOC & Ngân hàng</th>
                  <th className="px-6 py-4">Số tiền</th>
                  <th className="px-6 py-4">Ngày yêu cầu</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? <tr><td colSpan={5} className="px-6 py-10 text-center">Đang tải...</td></tr> : null}
                {!loading && items.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Không có yêu cầu nào.</td></tr>}
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">
                          {item.kocId}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.bankAccountName}</p>
                          <p className="text-xs text-slate-500">{item.bankName} • {item.bankAccountNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-primary">{formatCurrency(item.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'pending' && (
                        <button 
                          onClick={() => setSelectedItem(item)}
                          className="p-2 hover:bg-blue-50 text-primary rounded-lg transition-all"
                        >
                          <ArrowRight size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedItem && createPortal(
          <div className="kolab-app-shell">
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedItem(null);
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 space-y-6">
              <h3 className="text-2xl font-black text-slate-900">Xử lý yêu cầu rút tiền</h3>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Chủ tài khoản</span>
                  <span className="font-bold">{selectedItem.bankAccountName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Số tài khoản</span>
                  <span className="font-bold">{selectedItem.bankAccountNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Ngân hàng</span>
                  <span className="font-bold">{selectedItem.bankName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-primary font-black uppercase tracking-wider text-[10px]">Số tiền cần chuyển</span>
                  <span className="text-xl font-black text-primary">{formatCurrency(selectedItem.amount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Ghi chú cho KOC</label>
                <textarea 
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="VD: Đã chuyển tiền, vui lòng kiểm tra tài khoản."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedItem(null)} className="flex-1 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest">Đóng</button>
                <button onClick={() => handleUpdateStatus('rejected')} className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100">Từ chối</button>
                <button onClick={() => handleUpdateStatus('completed')} className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-600/20">Xác nhận đã chuyển</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </DashboardLayout>
  );
}
