import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import {
  DollarSign,
  TrendingUp,
  Eye,
  Heart,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Target,
  Users,
  Award
} from "lucide-react";
import { ApiError } from "../../services/api";
import { listBookings, updateBookingStatus, type Booking } from "../../services/bookingService";
import { listCampaigns, type Campaign } from "../../services/campaignService";
import { getMyEarnings, type Earning } from "../../services/earningService";
import { getMyProfile, type KocProfile } from "../../services/profileService";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VND`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

function bookingStatusLabel(status: Booking["status"]) {
  if (status === "accepted") return { label: "Đã nhận", style: "bg-green-100 text-green-700", icon: CheckCircle };
  if (status === "pending") return { label: "Chờ duyệt", style: "bg-yellow-100 text-yellow-700", icon: Clock };
  if (status === "completed") return { label: "Hoàn thành", style: "bg-slate-200 text-slate-700", icon: CheckCircle };
  if (status === "rejected") return { label: "Từ chối", style: "bg-rose-100 text-rose-700", icon: AlertCircle };
  return { label: "Đã hủy", style: "bg-slate-200 text-slate-700", icon: AlertCircle };
}

export function KOCDashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.trim().split(/\s+/).filter(Boolean).pop() || "bạn";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [profile, setProfile] = useState<KocProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [bookingsRes, campaignsRes, earningsRes, profileRes] = await Promise.all([
          listBookings(), 
          listCampaigns({}), 
          getMyEarnings(),
          getMyProfile()
        ]);
        if (cancelled) return;
        
        setBookings(bookingsRes.items);
        setCampaigns(campaignsRes.items);
        setEarnings(earningsRes.items);
        setProfile(profileRes.profile as KocProfile);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage("Lỗi đồng bộ dữ liệu hệ thống.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  const handleUpdateStatus = async (bookingId: number, status: string) => {
    try {
      await updateBookingStatus(bookingId, status as any);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: status as any, updatedAt: new Date().toISOString() } : b));
    } catch (e) {}
  };

  const totalIncome = useMemo(() => earnings.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0), [earnings]);
  const pendingIncome = useMemo(() => earnings.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amount, 0), [earnings]);
  const runningCampaigns = useMemo(() => bookings.filter((item) => item.status === "accepted").length, [bookings]);
  const pendingBookings = useMemo(() => bookings.filter((item) => item.status === "pending").length, [bookings]);

  const campaignById = useMemo(() => {
    const map = new Map<number, Campaign>();
    campaigns.forEach((item) => map.set(item.id, item));
    return map;
  }, [campaigns]);

  // Profile is considered complete if niche and platform are filled
  const isProfileComplete = Boolean(profile?.niche && profile?.platform);

  return (
    <DashboardLayout role="koc">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Chào mừng trở lại, {firstName}!</h1>
            <p className="text-slate-500 font-medium">Bạn đang có {pendingBookings} lời mời hợp tác mới cần phản hồi.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-xs font-bold uppercase tracking-wider">Hệ thống ổn định</span>
          </div>
        </div>

        {errorMessage && <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700 font-bold">{errorMessage}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-all">
               <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4">
                  <DollarSign size={24} />
               </div>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Tổng thu nhập</p>
               <p className="text-2xl font-black text-slate-900">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                 <Eye size={24} />
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Đang chờ</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(pendingIncome)}</p>
           </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                   <Heart size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Tỉ lệ hoàn thành</p>
                <p className="text-2xl font-black text-slate-900">{profile?.completionRate ?? 96.5}%</p>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-all">
               <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
               </div>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Ranking KOC</p>
               <p className="text-2xl font-black text-slate-900">{profile?.kocRank ?? "Top 150"}</p>
            </div>
        </div>

        {!isProfileComplete && (
          <div className="bg-primary rounded-[40px] p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-2xl shadow-primary/30">
            <Sparkles className="absolute -right-6 -top-6 w-48 h-48 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full mb-4 border border-white/20">
                 <Award size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white">Chỉ dành cho KOC mới</span>
              </div>
              <h3 className="text-3xl font-black mb-2">Hoàn thiện hồ sơ để nhận Job ngay!</h3>
              <p className="text-blue-100 font-medium text-lg">Xác thực năng lực của bạn qua hồ sơ 3 bước và nhận đề xuất từ các Brand lớn.</p>
            </div>
            <Link to="/kol-profile-builder" className="relative z-10 px-8 py-4 bg-white text-primary rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl flex items-center gap-3">
              Bắt đầu xây dựng
              <ArrowRight size={20} />
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-primary/5 overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Lời mời mới nhất</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Các nhãn hàng đang chờ sự phản hồi của bạn</p>
                  </div>
                  <Link to="/koc/bookings" className="text-primary font-black uppercase tracking-widest text-xs hover:underline">Xem tất cả</Link>
               </div>
               <div className="divide-y divide-slate-50">
                  {bookings.filter(b => b.status === "pending").length === 0 ? (
                    <div className="p-12 text-center text-slate-400">Không có lời mời nào đang chờ.</div>
                  ) : (
                    bookings.filter(b => b.status === "pending").slice(0, 3).map(b => {
                      const meta = bookingStatusLabel(b.status);
                      return (
                        <div key={b.id} className="p-8 hover:bg-blue-50/20 transition-colors">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-primary">
                                    <Target size={28} />
                                 </div>
                                 <div>
                                    <h4 className="text-lg font-black text-slate-900">{campaignById.get(b.campaignId)?.title || "Campaign"}</h4>
                                    <p className="text-slate-500 text-sm font-medium">Cập nhật: {formatDate(b.updatedAt)}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <Link 
                                   to={`/koc/bookings?bookingId=${b.id}`}
                                   className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all text-center inline-block"
                                 >
                                   Xem chi tiết
                                 </Link>
                              </div>
                           </div>
                        </div>
                      )
                    })
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-primary/5 p-8">
               <h3 className="text-xl font-black text-slate-900 mb-6">Hiệu suất tháng này</h3>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                       <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tỉ lệ phản hồi</span>
                       <span className="text-sm font-black text-primary">{profile?.responseRate ?? 92}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-primary rounded-full" style={{ width: `${profile?.responseRate ?? 92}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                       <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tốc độ phản hồi</span>
                       <span className="text-sm font-black text-emerald-600">{profile?.responseTime ?? "~2 giờ"}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: profile?.responseTime === "< 1 giờ" ? "95%" : "85%" }} />
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-primary/5 p-8">
               <h3 className="text-xl font-black text-slate-900 mb-6">Mẹo cho KOC</h3>
               <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                  <div className="flex gap-4">
                     <Sparkles className="text-primary shrink-0" size={24} />
                     <p className="text-sm text-blue-900 font-medium leading-relaxed">
                        Các nhãn hàng thường ưu tiên các KOC có **Ảnh Profile chuyên nghiệp** và **Bio chi tiết**. Đừng quên cập nhật nhé!
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
