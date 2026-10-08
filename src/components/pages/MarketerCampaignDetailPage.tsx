import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { API_BASE_URL } from "../../services/api";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Users,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Pause,
  Play,
} from "lucide-react";
import { getCampaignById, updateCampaign, topupCampaign, type Campaign } from "../../services/campaignService";
import { listApplicantsByCampaign, updateBookingStatus, type Booking } from "../../services/bookingService";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VNĐ`;
}

function CampaignProductGallery({ images, productName }: { images: string[]; productName?: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <div className="space-y-2">
      <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        <img src={images[activeIdx]} alt={productName} className="w-full h-full object-contain" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                idx === activeIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MarketerCampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applicants, setApplicants] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreedMap, setAgreedMap] = useState<Record<number, boolean>>({});
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [topupError, setTopupError] = useState("");

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [campaignRes, applicantsRes] = await Promise.all([
        getCampaignById(Number(id)),
        listApplicantsByCampaign(Number(id)),
      ]);
      setCampaign(campaignRes.campaign);
      setApplicants(applicantsRes.items);
    } catch (err: any) {
      setError(err.message || "Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: Campaign["status"]) => {
    if (!campaign) return;
    try {
      await updateCampaign(campaign.id, { status: newStatus });
      setCampaign({ ...campaign, status: newStatus });
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleReviewApplicant = async (bookingId: number, status: Booking["status"]) => {
    try {
      const res = await updateBookingStatus(bookingId, status);
      if (res.requiresPayment && res.checkoutUrl) {
        alert("Chiến dịch chưa nạp ngân sách. Đang chuyển hướng đến cổng thanh toán PayOS để trả tiền cho KOC...");
        window.location.assign(res.checkoutUrl);
        return;
      }
      await fetchData();
    } catch (err: any) {
      alert("Lỗi: " + (err.payload?.message || err.message));
    }
  };

  const toggleAgree = (bookingId: number, checked: boolean) => {
    setAgreedMap(prev => ({ ...prev, [bookingId]: checked }));
  };

  const handleTopupSubmit = async () => {
    setTopupError("");
    const amount = Number(topupAmount);
    if (isNaN(amount) || amount < 10000) {
      setTopupError("Số tiền nạp tối thiểu là 10,000 VNĐ");
      return;
    }
    if (!campaign) return;
    
    setToppingUp(true);
    try {
      const res = await topupCampaign(campaign.id, amount);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        alert("Đã xảy ra lỗi khi tạo link nạp tiền.");
      }
    } catch (err: any) {
      setTopupError(err.payload?.message || err.message || "Lỗi nạp tiền");
    } finally {
      setToppingUp(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error || !campaign) return <div className="p-8 text-red-600">{error || "Campaign not found"}</div>;

  const pendingApplicants = applicants.filter(a => a.status === 'pending');
  const activeBookings = applicants.filter(a => a.status !== 'pending' && a.status !== 'rejected' && a.status !== 'cancelled');

  return (
    <DashboardLayout role="marketer">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link to="/marketer/campaigns" className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                campaign.status === 'open' ? 'bg-green-100 text-green-700' : 
                campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                campaign.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {campaign.status.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-500">{campaign.category} • {campaign.platform} • {new Date(campaign.startDate).toLocaleDateString("vi-VN")} - {new Date(campaign.endDate).toLocaleDateString("vi-VN")}</p>
          </div>
          <div className="flex gap-2">
            {['open', 'scheduled', 'in_progress'].includes(campaign.status) && (
              <Link 
                to={`/marketer/bookings?campaignId=${campaign.id}`} 
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover font-bold text-sm shadow-sm transition-all"
              >
                <Users size={18} /> Đặt lịch KOL/KOC
              </Link>
            )}
            {campaign.status === 'open' ? (
              <button onClick={() => handleStatusChange('paused')} className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 font-medium">
                <Pause size={18} /> Tạm dừng
              </button>
            ) : (campaign.status === 'paused' || campaign.status === 'scheduled') ? (
              <button onClick={() => handleStatusChange('open')} className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-xl hover:bg-green-50 font-medium">
                <Play size={18} /> {campaign.status === 'scheduled' ? 'Kích hoạt ngay' : 'Tiếp tục'}
              </button>
            ) : null}
            <button onClick={() => handleStatusChange('cancelled')} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 font-medium border border-rose-200">
              <XCircle size={18} /> Đóng/Hủy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign & Product details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Mô tả chiến dịch</h3>
                <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{campaign.description || "Chưa có mô tả."}</p>
              </div>

              {(campaign.productName || (campaign.productImages && campaign.productImages.length > 0)) && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm">Sản phẩm tài trợ</h4>
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/80 grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    {/* Images Slideshow */}
                    {campaign.productImages && campaign.productImages.length > 0 ? (
                      <CampaignProductGallery images={campaign.productImages} productName={campaign.productName} />
                    ) : (
                      <div className="h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 text-xs">
                        Chưa có hình ảnh sản phẩm
                      </div>
                    )}
                    {/* Details */}
                    <div className="space-y-2 text-xs">
                      {campaign.productName && (
                        <div>
                          <p className="font-black text-slate-400 uppercase tracking-wider">Tên sản phẩm</p>
                          <p className="font-bold text-slate-800 text-sm">{campaign.productName}</p>
                        </div>
                      )}
                      {campaign.productDescription && (
                        <div>
                          <p className="font-black text-slate-400 uppercase tracking-wider">Mô tả sản phẩm</p>
                          <p className="text-slate-600 whitespace-pre-line leading-relaxed">{campaign.productDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="text-primary" size={20} />
                Danh sách ứng viên ({pendingApplicants.length})
              </h3>
              <div className="divide-y divide-slate-100">
                {pendingApplicants.length === 0 && (
                  <div className="py-8 text-center text-slate-500">
                    Chưa có ứng viên mới.{" "}
                    {['open', 'scheduled', 'in_progress'].includes(campaign.status) && (
                      <Link 
                        to={`/marketer/bookings?campaignId=${campaign.id}`} 
                        className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                      >
                        Tìm & mời KOC ngay
                      </Link>
                    )}
                  </div>
                )}
                {pendingApplicants.map(app => (
                  <div key={app.id} className="py-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <img 
                            src={app.avatarUrl?.startsWith('http') ? app.avatarUrl : (app.avatarUrl ? `${API_BASE_URL}${app.avatarUrl}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.display_name}`)} 
                            alt={app.display_name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{app.display_name || app.kocName || "KOC Chưa rõ tên"}</p>
                          <p className="text-sm text-slate-500">{app.followers?.toLocaleString()} followers • {app.engagement_rate}% engagement</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-sm text-slate-700">"{app.note}"</p>
                      </div>
                      <div className="flex gap-4 text-sm font-medium">
                        <span className="text-emerald-600">Báo giá: {formatCurrency(app.offeredPrice)}</span>
                        <span className="text-blue-600">Giao hàng: {app.estimatedDeliveryDays} ngày</span>
                        {app.sampleLink && (
                          <a href={app.sampleLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-primary flex items-center gap-1">
                            Link mẫu <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2">
                      {app.status === 'pending' ? (
                        <>
                          <button 
                            onClick={async () => {
                              if (!confirm("Bạn có chắc chắn muốn duyệt ứng viên này và bắt đầu hợp đồng? Số tiền báo giá của KOC sẽ được trừ trực tiếp từ ngân sách khả dụng của chiến dịch.")) return;
                              await handleReviewApplicant(app.id, 'accepted');
                            }} 
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-sm"
                          >
                            Chấp nhận
                          </button>
                          <button onClick={() => handleReviewApplicant(app.id, 'rejected')} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold text-sm">Từ chối</button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Briefcase className="text-primary" size={20} />
                KOC đang làm việc ({activeBookings.length})
              </h3>
              <div className="divide-y divide-slate-100">
                {activeBookings.length === 0 && <p className="py-8 text-center text-slate-500">Chưa có KOC nào đang thực hiện job.</p>}
                {activeBookings.map(app => (
                  <div key={app.id} className="py-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden">
                           <img 
                             src={app.avatarUrl?.startsWith('http') ? app.avatarUrl : (app.avatarUrl ? `${API_BASE_URL}${app.avatarUrl}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.display_name}`)} 
                             alt={app.display_name} 
                             className="w-full h-full object-cover"
                           />
                        </div>
                        <p className="font-bold">{app.display_name || app.kocName || "KOC Chưa rõ tên"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">Video bản thảo (Draft)</p>
                        {app.draftLink ? (
                          <a href={app.draftLink} target="_blank" rel="noreferrer" className="flex items-center justify-between text-primary font-medium">
                            Xem bản thảo <ExternalLink size={16} />
                          </a>
                        ) : <p className="text-sm text-slate-400">Chưa nộp</p>}
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">Video chính thức (Final)</p>
                        {app.finalLink ? (
                          <div className="flex items-center justify-between">
                            <a href={app.finalLink} target="_blank" rel="noreferrer" className="text-primary font-medium flex items-center gap-1">
                              Xem video chính thức <ExternalLink size={16} />
                            </a>
                            {['accepted', 'draft_submitted', 'final_submitted', 'revision_requested'].includes(app.status) && (
                              <button 
                                onClick={() => handleReviewApplicant(app.id, 'completed')}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm"
                              >
                                Nghiệm thu & Trả tiền
                              </button>
                            )}
                          </div>
                        ) : <p className="text-sm text-slate-400">Chưa nộp</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Tổng quan ngân sách</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ngân sách mục tiêu</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(campaign.budget)}</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Tổng ngân sách đã nạp</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(campaign.totalDeposited || 0)}</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Ngân sách khả dụng (Chưa phân bổ)</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(campaign.remainingBudget || 0)}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Đang tạm giữ (Đang làm việc)</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(applicants.filter(a => ['accepted', 'in_progress', 'draft_submitted', 'final_submitted', 'revision_requested', 'ready_to_connect'].includes(a.status)).reduce((sum, a) => sum + a.offeredPrice, 0))}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Đã chi trả hoàn thành</p>
                  <p className="text-xl font-bold text-slate-700">
                    {formatCurrency(applicants.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.offeredPrice, 0))}
                  </p>
                </div>
              </div>
              
              {['open', 'scheduled', 'paused', 'in_progress', 'pending_payment'].includes(campaign.status) && (
                <button 
                  onClick={() => setIsTopupOpen(true)}
                  className="w-full mt-4 py-3 bg-primary text-white rounded-2xl hover:bg-primary-hover font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <DollarSign size={16} /> Nạp thêm ngân sách
                </button>
              )}
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
               <div className="flex items-center gap-2 mb-4 text-orange-400">
                 <AlertTriangle size={20} />
                 <h3 className="font-bold">Lưu ý bảo mật</h3>
               </div>
               <ul className="text-sm text-slate-400 space-y-3 list-disc pl-4">
                 <li>Chỉ nhấn <b>Nghiệm thu</b> khi bạn đã kiểm tra kỹ video chính thức đúng brief.</li>
                 <li>Tiền sẽ được chuyển ngay cho KOC sau khi bạn xác nhận.</li>
                 <li>Mọi hành động được ghi lại trong nhật ký hệ thống.</li>
               </ul>
            </div>
          </div>
        </div>
      </div>

      {/* TOPUP DIALOG */}
      <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
        <DialogContent className="create-campaign-modal max-w-md rounded-3xl p-0 overflow-hidden shadow-2xl border-0 max-h-[90vh] flex flex-col">
          <div className="bg-primary p-6 text-white shrink-0">
            <DialogTitle className="text-xl font-bold">Nạp thêm ngân sách chiến dịch</DialogTitle>
            <DialogDescription className="text-blue-100 opacity-90">
              Nhập số tiền bạn muốn nạp thêm để thanh toán cho các KOC.
            </DialogDescription>
          </div>
          <div className="create-campaign-modal-body p-6 space-y-4 overflow-y-auto flex-1">
             {topupError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/30 text-rose-200 rounded-xl text-sm">
                   {topupError}
                </div>
             )}
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-300">Số tiền nạp (VND) - Tối thiểu 10,000 VND</label>
               <input 
                 type="number" 
                 className="w-full h-11 border border-slate-700 rounded-xl px-3 bg-slate-800 text-sm focus:ring-[#1E3B8E]"
                 value={topupAmount} 
                 onChange={e => setTopupAmount(e.target.value)} 
                 placeholder="VD: 5000000" 
               />
             </div>
             <DialogFooter className="pt-4 flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsTopupOpen(false)} 
                  className="px-4 py-2 text-sm rounded-xl h-auto"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleTopupSubmit} 
                  disabled={toppingUp} 
                  className="create-campaign-submit px-6 py-2 text-sm font-bold rounded-xl h-auto shadow-md"
                >
                  {toppingUp ? "Đang xử lý..." : "Xác nhận nạp"}
                </Button>
             </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
