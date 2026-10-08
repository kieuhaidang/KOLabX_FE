import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { getMyEarnings, type Earning } from "../../services/earningService";
import { requestWithdrawal, getMyWithdrawals, type Withdrawal } from "../../services/withdrawalService";
import { formatThousands, parseThousands } from "../../utils/numberFormat";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VNĐ`;
}

export function EarningsPage() {
  const [items, setItems] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedEarningIds, setSelectedEarningIds] = useState<number[]>([]);
  const [withdrawTab, setWithdrawTab] = useState<"campaign" | "custom">("campaign");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [earningsRes, withdrawalsRes] = await Promise.all([
        getMyEarnings(),
        getMyWithdrawals(),
      ]);
      setItems(earningsRes.items);
      setWithdrawals(withdrawalsRes.items);
    } catch (error: any) {
      setErrorMessage(error.message || "Không thể tải dữ liệu thu nhập.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (isWithdrawModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isWithdrawModalOpen]);

  const availableEarnings = useMemo(() => {
    return items.filter((item) => item.withdrawalStatus === "available");
  }, [items]);

  useEffect(() => {
    if (isWithdrawModalOpen) {
      setSelectedEarningIds(availableEarnings.map((e) => e.id));
      setWithdrawTab("campaign");
      setWithdrawAmount("");
    }
  }, [isWithdrawModalOpen, availableEarnings]);

  const campaignTotal = useMemo(() => {
    return availableEarnings
      .filter((e) => selectedEarningIds.includes(e.id))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [availableEarnings, selectedEarningIds]);

  const totals = useMemo(() => {
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    
    const paidAmount = items
      .filter((item) => item.status === "paid" || item.withdrawalStatus === "withdrawn")
      .reduce((sum, item) => sum + item.amount, 0);

    const availableAmount = items
      .filter((item) => item.withdrawalStatus === "available")
      .reduce((sum, item) => sum + item.amount, 0);

    const pendingAmount = items
      .filter((item) => item.withdrawalStatus === "pending_withdrawal")
      .reduce((sum, item) => sum + item.amount, 0);

    return { totalAmount, paidAmount, availableAmount, pendingAmount };
  }, [items]);

  const handleWithdrawRequest = async () => {
    const amount = withdrawTab === "campaign" ? campaignTotal : parseThousands(withdrawAmount);
    const earningIds = withdrawTab === "campaign" ? selectedEarningIds : undefined;

    if (amount < 10000) {
      alert("Số tiền rút tối thiểu là 10.000 VND");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestWithdrawal(amount, earningIds);
      setSuccessMessage("Yêu cầu rút tiền đã được gửi!");
      setIsWithdrawModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      alert(err.message || "Lỗi yêu cầu rút tiền. Vui lòng kiểm tra thông tin ngân hàng trong Hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || (
    withdrawTab === "campaign"
      ? campaignTotal < 10000
      : !withdrawAmount || parseThousands(withdrawAmount) < 10000
  );

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Thu nhập</h1>
            <p className="text-slate-600">Theo dõi doanh thu và lịch sử thanh toán</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Wallet size={20} />
              Rút tiền
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <Download size={20} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {successMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-in fade-in slide-in-from-top-2">{successMessage}</div>}
        {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={20} />
              <p className="text-sm text-slate-600">Tổng thu nhập</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totals.totalAmount)}</p>
            <p className="text-sm text-green-600 mt-1">{items.length} booking</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-purple-600" size={20} />
              <p className="text-sm text-slate-600">Đã thanh toán</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totals.paidAmount)}</p>
            <p className="text-sm text-slate-600 mt-1">{items.filter((item) => item.status === "paid" || item.withdrawalStatus === "withdrawn").length} booking</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-600" size={20} />
              <p className="text-sm text-slate-600">Khả dụng</p>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totals.availableAmount)}</p>
            <p className="text-sm text-slate-600 mt-1">Tiền có thể rút</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-yellow-600" size={20} />
              <p className="text-sm text-slate-600">Đang chờ xử lý</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totals.pendingAmount)}</p>
            <p className="text-sm text-slate-600 mt-1">{withdrawals.filter(w => w.status === "pending").length} yêu cầu rút</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h2 className="font-bold text-xl">Lịch sử thu nhập</h2>
            </div>
            {loading ? <div className="p-6 text-sm">Đang tải...</div> : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {items.length === 0 && <p className="p-10 text-center text-slate-500">Chưa có dữ liệu thu nhập.</p>}
                {items.map(item => {
                  let badgeBg = "bg-amber-100 text-amber-700";
                  let badgeText = "Chờ nạp";
                  if (item.withdrawalStatus === "withdrawn") {
                    badgeBg = "bg-blue-100 text-blue-700";
                    badgeText = "Đã rút";
                  } else if (item.withdrawalStatus === "pending_withdrawal") {
                    badgeBg = "bg-amber-100 text-amber-700";
                    badgeText = "Chờ duyệt";
                  } else if (item.withdrawalStatus === "available") {
                    badgeBg = "bg-emerald-100 text-emerald-700";
                    badgeText = "Khả dụng";
                  } else if (item.withdrawalStatus === "rejected") {
                    badgeBg = "bg-rose-100 text-rose-700";
                    badgeText = "Từ chối";
                  }

                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">
                            {item.campaignTitle || `Booking #${item.bookingId}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.marketerName ? `${item.marketerName} • ` : ""}
                            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-emerald-600">{formatCurrency(item.amount)}</p>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${badgeBg}`}>
                          {badgeText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h2 className="font-bold text-xl">Yêu cầu rút tiền</h2>
            </div>
            {loading ? <div className="p-6 text-sm">Đang tải...</div> : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {withdrawals.length === 0 && <p className="p-10 text-center text-slate-500">Chưa có yêu cầu nào.</p>}
                {withdrawals.map(w => (
                  <div key={w.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        w.status === "completed" ? "bg-emerald-100 text-emerald-600" : 
                        w.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                      }`}>
                        {w.status === "completed" ? <CheckCircle2 size={18} /> : 
                         w.status === "pending" ? <Clock size={18} /> : <XCircle size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Rút về {w.bankName}</p>
                        <p className="text-xs text-slate-500">{new Date(w.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">-{formatCurrency(w.amount)}</p>
                      <p className={`text-[10px] font-black uppercase ${
                        w.status === "completed" ? "text-emerald-600" : 
                        w.status === "pending" ? "text-amber-600" : "text-rose-600"
                      }`}>
                        {w.status === "completed" ? "Hoàn tất" : 
                         w.status === "pending" ? "Đang xử lý" : "Từ chối"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isWithdrawModalOpen && createPortal(
          <div className="kolab-app-shell">
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsWithdrawModalOpen(false);
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 space-y-6 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="text-center shrink-0">
                  <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Wallet size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Yêu cầu rút tiền</h3>
                  <p className="text-slate-500 text-sm mt-1">Khả dụng: <span className="font-bold text-primary">{formatCurrency(totals.availableAmount)}</span></p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setWithdrawTab("campaign")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${withdrawTab === "campaign" ? "bg-white text-primary shadow" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    Chọn theo chiến dịch
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawTab("custom")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${withdrawTab === "custom" ? "bg-white text-primary shadow" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    Tự nhập số tiền
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-1 py-1">
                  {withdrawTab === "campaign" ? (
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 block">Chọn chiến dịch muốn rút</label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 border border-slate-100 p-2 rounded-2xl">
                        {availableEarnings.length === 0 ? (
                          <p className="text-center text-slate-500 text-xs py-8 font-medium">Không có khoản thu nhập nào khả dụng.</p>
                        ) : (
                          availableEarnings.map(item => (
                            <label
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-slate-100"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedEarningIds.includes(item.id)}
                                  onChange={() => {
                                    setSelectedEarningIds(prev =>
                                      prev.includes(item.id)
                                        ? prev.filter(id => id !== item.id)
                                        : [...prev, item.id]
                                    );
                                  }}
                                  className="rounded text-primary focus:ring-primary h-4 w-4"
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-900 line-clamp-1">
                                    {item.campaignTitle || `Booking #${item.bookingId}`}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {item.marketerName ? `${item.marketerName} • ` : ""}
                                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs font-black text-emerald-600 shrink-0">
                                +{formatCurrency(item.amount)}
                              </p>
                            </label>
                          ))
                        )}
                      </div>

                      <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                        <span className="text-xs font-black uppercase text-primary tracking-widest">Tổng rút đã chọn:</span>
                        <span className="text-xl font-black text-primary">{formatCurrency(campaignTotal)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 block">Số tiền muốn rút (VND)</label>
                      <input
                        type="text"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(formatThousands(e.target.value))}
                        placeholder="Tối thiểu 10.000"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-xl font-black text-primary"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start shrink-0">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                      Tiền sẽ được chuyển về tài khoản ngân hàng liên kết trong hồ sơ của bạn trong vòng 24 giờ. Số tiền rút tối thiểu là 10.000 VND.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 shrink-0 border-t border-slate-100">
                  <button
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="flex-1 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={isSubmitDisabled}
                    onClick={handleWithdrawRequest}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-lg shadow-primary/20"
                  >
                    Gửi yêu cầu
                  </button>
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
