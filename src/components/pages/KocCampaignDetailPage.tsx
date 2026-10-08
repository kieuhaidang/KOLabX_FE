import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Globe, 
  Layers3, 
  Rocket, 
  ExternalLink,
  CheckCircle,
  Sparkles,
  History,
  MessageSquare
} from "lucide-react";
import { getBookingById, submitBookingSubmission, type Booking, type BookingStatus } from "../../services/bookingService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Separator } from "../ui/separator";

// --- UTILS ---
function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VND`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' });
}

function KocCampaignProductGallery({ images, productName }: { images: string[]; productName?: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <div className="space-y-2">
      <div className="h-48 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        <img src={images[activeIdx]} alt={productName} className="w-full h-full object-contain" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
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

export function KocCampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [draftLink, setDraftLink] = useState("");
  const [finalLink, setFinalLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await getBookingById(Number(id));
        setBooking(res.booking);
        setDraftLink(res.booking.draftLink || "");
        setFinalLink(res.booking.finalLink || "");
      } catch (err: any) {
        setError(err.message || "Không thể tải chi tiết chiến dịch.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleUpdateLinks = async () => {
    if (!id) return;
    if (!draftLink.trim() && !finalLink.trim()) {
      setError("Vui lòng nhập ít nhất một link video.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await submitBookingSubmission(Number(id), { draftLink, finalLink });
      setBooking(res.booking);
      setDraftLink(res.booking.draftLink || "");
      setFinalLink(res.booking.finalLink || "");
      setSuccessMessage(
        finalLink.trim()
          ? "Đã nộp sản phẩm cho Marketer. Trạng thái: Đã nộp final, chờ Marketer duyệt."
          : "Đã nộp sản phẩm cho Marketer. Trạng thái: Đã nộp bản thảo, chờ phản hồi."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể nộp sản phẩm.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyles: Record<BookingStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-purple-100 text-purple-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    cancelled: "bg-slate-100 text-slate-700",
    draft_submitted: "bg-blue-100 text-blue-700",
    revision_requested: "bg-orange-100 text-orange-700",
    final_submitted: "bg-amber-100 text-amber-800",
    ready_to_connect: "bg-blue-50 text-blue-600",
    payment_rejected: "bg-rose-100 text-rose-800",
  };

  const statusLabels: Record<BookingStatus, string> = {
    pending: "Chờ duyệt đơn",
    accepted: "Đang thực hiện",
    in_progress: "Đang thực hiện",
    completed: "Đã hoàn thành",
    rejected: "Đã từ chối",
    cancelled: "Đã hủy",
    draft_submitted: "Đã nộp bản thảo, chờ phản hồi",
    revision_requested: "Marketer yêu cầu chỉnh sửa",
    final_submitted: "Đã nộp final, chờ Marketer duyệt",
    ready_to_connect: "Sẵn sàng kết nối",
    payment_rejected: "Thanh toán bị từ chối",
  };

  const canSubmit = booking
    ? ["accepted", "in_progress", "draft_submitted", "revision_requested", "final_submitted"].includes(booking.status)
    : false;

  if (loading) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
  if (error || !booking) return <div className="p-8 text-red-600">{error || "Không tìm thấy job."}</div>;

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <Link to="/koc/campaigns" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{booking.campaign?.title}</h1>
              <Badge className={statusStyles[booking.status]}>{statusLabels[booking.status]}</Badge>
            </div>
            <p className="text-slate-500 text-sm">
              Hợp tác với: <span className="font-semibold">{booking.campaign?.marketerName}</span> • Ngày tạo: {formatDate(booking.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brief Section */}
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="text-purple-600" size={20} />
                  <CardTitle className="text-lg">Chi tiết yêu cầu (Brief)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Mô tả chiến dịch</h4>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{booking.campaign?.description || "Không có mô tả chi tiết."}</p>
                </div>
                
                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="text-blue-500" size={18} />
                      <div>
                        <p className="text-slate-400 font-medium">Nền tảng</p>
                        <p className="text-slate-900 font-semibold">{booking.campaign?.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Layers3 className="text-emerald-500" size={18} />
                      <div>
                        <p className="text-slate-400 font-medium">Lĩnh vực</p>
                        <p className="text-slate-900 font-semibold">{booking.campaign?.category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <BadgeDollarSign className="text-amber-500" size={18} />
                      <div>
                        <p className="text-slate-400 font-medium">Thù lao thỏa thuận</p>
                        <p className="text-slate-900 font-semibold text-lg">{formatCurrency(booking.offeredPrice)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sponsor Product Section */}
                {(booking.campaign?.productName || (booking.campaign?.productImages && booking.campaign.productImages.length > 0)) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-4">Sản phẩm tài trợ</h4>
                      <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/80 grid md:grid-cols-2 gap-6">
                        {/* Left: slideshow */}
                        {booking.campaign.productImages && booking.campaign.productImages.length > 0 ? (
                          <KocCampaignProductGallery images={booking.campaign.productImages} productName={booking.campaign.productName} />
                        ) : (
                          <div className="h-48 w-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-300">
                            Chưa có hình ảnh
                          </div>
                        )}
                        {/* Right: info */}
                        <div className="space-y-3">
                          {booking.campaign.productName && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Tên sản phẩm</p>
                              <p className="font-bold text-slate-800 text-lg">{booking.campaign.productName}</p>
                            </div>
                          )}
                          {booking.campaign.productDescription && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Mô tả sản phẩm</p>
                              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{booking.campaign.productDescription}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Workspace / Workspace Submission */}
            {booking.reviewNote && booking.status === "revision_requested" ? (
              <Card className="rounded-3xl border-orange-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-orange-50 border-b border-orange-100">
                  <CardTitle className="text-lg text-orange-800">Phản hồi từ Marketer</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-orange-900 whitespace-pre-line">{booking.reviewNote}</p>
                  <p className="mt-2 text-xs text-orange-700">Vui lòng chỉnh sửa và nộp lại link video bên dưới.</p>
                </CardContent>
              </Card>
            ) : null}

            {canSubmit && (
              <Card className="rounded-3xl border-purple-200 shadow-lg shadow-purple-500/5 overflow-hidden">
                <CardHeader className="bg-purple-50 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <Rocket className="text-purple-600" size={20} />
                    <CardTitle className="text-lg">Nơi làm việc & Nộp sản phẩm</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Link Video bản thảo (Draft)</label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Dán link drive/video nháp tại đây..." 
                          value={draftLink}
                          onChange={e => setDraftLink(e.target.value)}
                        />
                        {booking.draftLink && (
                          <Button variant="outline" size="icon" asChild>
                            <a href={booking.draftLink} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Gửi bản thảo để Brand góp ý trước khi đăng chính thức.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Link Video chính thức (Final)</label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Dán link TikTok/FB đã đăng công khai..." 
                          value={finalLink}
                          onChange={e => setFinalLink(e.target.value)}
                        />
                        {booking.finalLink && (
                          <Button variant="outline" size="icon" asChild>
                            <a href={booking.finalLink} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Chỉ nộp khi video đã được đăng công khai.</p>
                    </div>

                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                    {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

                    <div className="pt-2">
                      <Button
                        onClick={handleUpdateLinks}
                        disabled={submitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 shadow-md"
                      >
                        {submitting ? "Đang nộp..." : "Nộp sản phẩm"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Info (For Pending) */}
            {booking.status === 'pending' && (
              <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-amber-50/50 border-b border-slate-100">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="text-amber-600" size={20} /> Nội dung ứng tuyển của bạn
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 italic text-slate-600">
                     "{booking.note}"
                   </div>
                   <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-white rounded-xl border border-slate-100">
                        <p className="text-slate-400">Giá đề xuất</p>
                        <p className="font-bold">{formatCurrency(booking.offeredPrice)}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-100">
                        <p className="text-slate-400">Thời gian làm bài</p>
                        <p className="font-bold">{booking.estimatedDeliveryDays} ngày</p>
                      </div>
                   </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
             {/* Communication Sidebar */}
             <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm">Giao tiếp</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 rounded-2xl h-12"
                    onClick={() => navigate(`/koc/messages?bookingId=${booking.id}`)}
                  >
                    <MessageSquare className="text-purple-600" size={18} />
                    Chat với Brand
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-2xl h-12 text-slate-500"
                    onClick={() => navigate("/koc/script-doctor")}
                  >
                    <Sparkles className="text-blue-500" size={18} />
                    AI Script Doctor (Gợi ý)
                  </Button>
                </CardContent>
             </Card>

             {/* Timeline Sidebar */}
             <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History size={16} /> Lịch sử hoạt động
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                   <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                      {/* Bước 1: Đã ứng tuyển / Lời mời tạo */}
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-[24px] h-[24px] rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                          <CheckCircle className="text-emerald-600" size={12} />
                        </div>
                        <p className="text-xs font-bold text-slate-900">Đã nộp đơn ứng tuyển</p>
                        <p className="text-[10px] text-slate-500">{formatDate(booking.createdAt)}</p>
                      </div>
                      
                      {/* Bước 2: Brand phê duyệt */}
                      {booking.status !== 'pending' && booking.status !== 'rejected' && booking.status !== 'cancelled' && (
                        <div className="relative pl-8">
                          <div className="absolute left-0 top-1 w-[24px] h-[24px] rounded-full bg-purple-100 border-2 border-white flex items-center justify-center">
                            <CheckCircle className="text-purple-600" size={12} />
                          </div>
                          <p className="text-xs font-bold text-slate-900">Brand đã phê duyệt</p>
                          <p className="text-[10px] text-slate-500">{formatDate(booking.updatedAt)}</p>
                        </div>
                      )}

                      {/* Trạng thái bị từ chối / hủy */}
                      {(booking.status === 'rejected' || booking.status === 'cancelled') && (
                        <div className="relative pl-8">
                          <div className="absolute left-0 top-1 w-[24px] h-[24px] rounded-full bg-rose-100 border-2 border-white flex items-center justify-center">
                            <CheckCircle className="text-rose-600" size={12} />
                          </div>
                          <p className="text-xs font-bold text-rose-700">
                            {booking.status === 'rejected' ? 'Brand đã từ chối' : 'Yêu cầu hợp tác đã hủy'}
                          </p>
                          <p className="text-[10px] text-slate-500">{formatDate(booking.updatedAt)}</p>
                        </div>
                      )}
                      
                      {/* Bước 3: Hoàn thành & Nhận thanh toán */}
                      <div className={`relative pl-8 ${booking.status === 'completed' ? '' : 'opacity-40'}`}>
                        <div className={`absolute left-0 top-1 w-[24px] h-[24px] rounded-full border-2 border-white flex items-center justify-center ${
                          booking.status === 'completed' ? 'bg-emerald-100' : 'bg-slate-100'
                        }`}>
                          {booking.status === 'completed' && <CheckCircle className="text-emerald-600" size={12} />}
                        </div>
                        <p className="text-xs font-bold text-slate-900">Hoàn thành & Nhận thanh toán</p>
                        <p className="text-[10px] text-slate-500">
                          {booking.status === 'completed' ? formatDate(booking.updatedAt) : 'Dự kiến'}
                        </p>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper icons/types to avoid circular deps or missing components
function BadgeDollarSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      <path d="M16 21H8" />
      <path d="M16 3H8" />
    </svg>
  );
}
