import { useEffect, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Send,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { getMyWallet, requestWalletWithdrawal, type WalletData, type WalletTransaction } from "../../services/walletService";
import type { Withdrawal } from "../../services/withdrawalService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VND`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

export function MarketerWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWalletData = async () => {
    try {
      const res = await getMyWallet();
      setData(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Không thể tải thông tin ví.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 50000) {
      setErrorMsg("Số tiền rút tối thiểu là 50,000 VND");
      return;
    }

    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin tài khoản ngân hàng");
      return;
    }

    if (data && data.wallet.balance < parsedAmount) {
      setErrorMsg("Số dư ví không đủ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestWalletWithdrawal({
        amount: parsedAmount,
        bankName,
        bankAccountNumber,
        bankAccountName,
      });
      setSuccessMsg(res.message || "Yêu cầu rút tiền đã được gửi thành công");
      setAmount("");
      // Refresh data
      await fetchWalletData();
    } catch (err: any) {
      setErrorMsg(err.payload?.message || err.message || "Lỗi khi gửi yêu cầu rút tiền.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIcon = (type: WalletTransaction["type"]) => {
    if (type === "refund") {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ArrowDownRight size={20} />
        </div>
      );
    }
    if (type === "withdrawal") {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ArrowUpRight size={20} />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Send size={20} />
      </div>
    );
  };

  const getWithdrawalStatusBadge = (status: Withdrawal["status"]) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
          <CheckCircle size={12} /> Thành công
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          <Clock size={12} /> Đã duyệt
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          <XCircle size={12} /> Bị từ chối
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
        <Clock size={12} /> Chờ xử lý
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="marketer">
        <div className="p-12 text-center text-slate-500">Đang tải thông tin ví...</div>
      </DashboardLayout>
    );
  }

  const wallet = data?.wallet;
  const transactions = data?.transactions || [];
  const withdrawals = data?.withdrawals || [];

  return (
    <DashboardLayout role="marketer">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Ví Điện Tử</h1>
          <p className="text-slate-500">Quản lý số dư hoàn trả và yêu cầu rút tiền về tài khoản ngân hàng của bạn.</p>
        </div>

        {/* Top Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-secondary to-deep p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
              <Wallet size={200} />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between space-y-8">
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Số dư khả dụng</span>
                <h2 className="text-4xl font-black">{formatCurrency(wallet?.balance || 0)}</h2>
              </div>
              <p className="text-xs text-slate-400">Số tiền được hoàn trả từ các chiến dịch đóng hoặc hủy.</p>
            </div>
          </div>

          {/* Refund Stats Card */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Tổng tiền hoàn trả</span>
              <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-900">
                {formatCurrency(
                  transactions
                    .filter((t) => t.type === "refund")
                    .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                )}
              </h3>
              <p className="mt-2 text-xs text-slate-400">Từ các chiến dịch đã kết thúc dư ngân sách.</p>
            </div>
          </div>

          {/* Withdrawal Stats Card */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Đã rút thành công</span>
              <div className="rounded-full bg-rose-50 p-2 text-rose-600">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-900">
                {formatCurrency(
                  withdrawals
                    .filter((w) => w.status === "completed")
                    .reduce((sum, w) => sum + Number(w.amount || 0), 0)
                )}
              </h3>
              <p className="mt-2 text-xs text-slate-400">Đã chuyển khoản thực tế về ngân hàng.</p>
            </div>
          </div>
        </div>

        {/* Actions & History Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Withdrawal Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Send size={18} className="text-primary" />
                Rút tiền về ngân hàng
              </h3>

              {errorMsg && (
                <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700 flex items-start gap-2">
                  <AlertCircle className="shrink-0 mt-0.5" size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 rounded-2xl bg-green-50 border border-green-100 p-4 text-sm text-green-700 flex items-start gap-2">
                  <CheckCircle className="shrink-0 mt-0.5" size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tên ngân hàng</label>
                  <Input
                    placeholder="VD: Vietcombank, Techcombank..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Số tài khoản</label>
                  <Input
                    type="text"
                    placeholder="VD: 19035698424016"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tên chủ tài khoản</label>
                  <Input
                    placeholder="VD: NGUYEN VAN A"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Số tiền rút (VND)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      type="number"
                      placeholder="Tối thiểu 50,000 VND"
                      className="pl-9"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Hệ thống sẽ duyệt và chuyển khoản thủ công trong 24h.</p>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || (wallet?.balance || 0) < 50000}
                  className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold h-12 rounded-2xl shadow-md transition-all mt-4"
                >
                  {submitting ? "Đang xử lý..." : "Yêu cầu rút tiền"}
                </Button>
              </form>
            </div>

            {/* Note Panel */}
            <div className="rounded-[32px] bg-slate-900 p-6 text-white shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle size={18} />
                <h4 className="font-bold">Lưu ý thanh toán</h4>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Thông tin tài khoản nhận tiền cần trùng khớp với thông tin đăng ký của bạn.</li>
                <li>Rút tiền tối thiểu <b>50,000 VNĐ</b> cho mỗi giao dịch.</li>
                <li>Mọi giao dịch rút tiền đều được kiểm duyệt bởi ban quản trị KOLab để phòng chống gian lận.</li>
              </ul>
            </div>
          </div>

          {/* Right: History Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Transactions Log */}
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Lịch sử giao dịch ví</h3>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2">
                {transactions.length === 0 ? (
                  <p className="py-8 text-center text-slate-500 text-sm">Chưa có giao dịch nào được thực hiện.</p>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="font-bold text-sm text-slate-900">{tx.description}</p>
                          <p className="text-xs text-slate-500">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold text-sm ${
                            tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Withdrawal Requests Status */}
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Danh sách yêu cầu rút tiền</h3>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-2">
                {withdrawals.length === 0 ? (
                  <p className="py-8 text-center text-slate-500 text-sm">Chưa có yêu cầu rút tiền nào.</p>
                ) : (
                  withdrawals.map((w) => (
                    <div key={w.id} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-sm text-slate-900">
                          Rút về {w.bankName} - {w.bankAccountNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(w.createdAt)}
                          {w.adminNote ? ` • Note: ${w.adminNote}` : ""}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-sm text-slate-900">{formatCurrency(w.amount)}</p>
                        {getWithdrawalStatusBadge(w.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
