import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../auth/AuthProvider";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useLocation, useSearchParams, useNavigate } from "react-router";
import { formatThousands, parseThousands } from "../../utils/numberFormat";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  X,
  ExternalLink
} from "lucide-react";
import { ApiError } from "../../services/api";
import { listBookings, createBooking, updateBookingStatus, type Booking } from "../../services/bookingService";
import { listCampaigns, type Campaign } from "../../services/campaignService";
import { listKocProfiles } from "../../services/profileService";

export function BookingsPage() {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMarketer = location.pathname.includes("/marketer/");
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [kocsMap, setKocsMap] = useState<Record<number, string>>({});
  const [newBooking, setNewBooking] = useState({ campaignId: "", kocId: "", offeredPrice: "" });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (isBootstrapping) return;

    let cancelled = false;
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await listBookings();
        if (!cancelled) {
          setBookings(response.items);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage("Không thể tải danh sách đặt lịch.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [isBootstrapping]);

  // Tải danh sách KOC
  useEffect(() => {
    if (isMarketer) {
      listKocProfiles({}).then(res => {
        const kmap: Record<number, string> = {};
        res.items.forEach((k: any) => {
          kmap[k.userId] = k.displayName || k.fullName || `KOC #${k.userId}`;
        });
        setKocsMap(kmap);
      }).catch(() => {});
    }
  }, [isMarketer]);

  // Tải danh sách chiến dịch cho Marketer
  useEffect(() => {
    if (isMarketer) {
      listCampaigns({}).then(res => {
        setCampaigns(res.items);
      }).catch(() => {
        setErrorMessage("Không thể tải danh sách chiến dịch.");
      });
    }
  }, [isMarketer]);

  // Bắt sự kiện chuyển hướng từ trang tìm kiếm KOLs
  useEffect(() => {
    const kocId = searchParams.get("kocId");
    if (kocId && isMarketer) {
      setNewBooking(prev => ({ ...prev, kocId }));
      setIsCreateModalOpen(true);
    }
  }, [searchParams, isMarketer]);

  // Tự động mở chi tiết Booking nếu có bookingId trên URL query params
  useEffect(() => {
    const bookingIdParam = searchParams.get("bookingId");
    if (bookingIdParam && bookings.length > 0) {
      const bId = Number(bookingIdParam);
      const found = bookings.find(b => b.id === bId);
      if (found) {
        setSelectedBooking(found);
        // Xóa query param để tránh tự động mở lại khi đóng modal
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("bookingId");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, bookings, setSearchParams]);

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (isCreateModalOpen || selectedBooking) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isCreateModalOpen, selectedBooking]);

  const handleCreateBooking = async () => {
    if (!newBooking.campaignId || !newBooking.kocId) {
      alert("Vui lòng nhập ID KOC và ID chiến dịch.");
      return;
    }
    try {
      const res = await createBooking({
        campaignId: Number(newBooking.campaignId),
        kocId: Number(newBooking.kocId),
        direction: "marketer_invited",
        offeredPrice: Number(newBooking.offeredPrice) || 0,
      });
      if (res && res.booking) {
        setBookings([res.booking, ...bookings]);
      }
    } catch (error) {
      console.error("Lỗi API createBooking", error);
      alert("Không thể tạo booking.");
    }
    setIsCreateModalOpen(false);
    setSearchParams({});
    setNewBooking({ campaignId: "", kocId: "", offeredPrice: "" });
  };

  const handleUpdateStatusDirect = async (bookingId: number, status: string) => {
    try {
      if (typeof updateBookingStatus === "function") {
        const res = await updateBookingStatus(bookingId, status as any);
        if (res && res.booking) {
          setBookings(bookings => bookings.map(b => b.id === bookingId ? res.booking : b));
          setSelectedBooking(current => current?.id === bookingId ? res.booking : current);
        }
      }
    } catch (e) {
      console.error("Lỗi API", e);
      alert("Không thể cập nhật trạng thái.");
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedBooking) return;
    await handleUpdateStatusDirect(selectedBooking.id, status);
  };

  // Lọc Booking theo trạng thái và tìm kiếm
  const filteredBookings = bookings.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch =
      b.id.toString().includes(searchQuery) ||
      b.campaignId.toString().includes(searchQuery) ||
      b.kocId.toString().includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"><Clock size={14} /> Chờ duyệt</span>;
      case "accepted":
      case "in_progress":
        return <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"><Clock size={14} /> Đang làm việc</span>;
      case "draft_submitted":
        return <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"><Clock size={14} /> Đã nộp bản thảo</span>;
      case "revision_requested":
        return <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"><Clock size={14} /> Yêu cầu sửa</span>;
      case "final_submitted":
        return <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium"><Clock size={14} /> Chờ nghiệm thu</span>;
      case "completed":
        return <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle size={14} /> Hoàn thành</span>;
      case "rejected":
        return <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium"><XCircle size={14} /> Đã từ chối</span>;
      case "cancelled":
        return <span className="flex items-center w-fit gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium"><XCircle size={14} /> Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <DashboardLayout role={isMarketer ? "marketer" : "koc"}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý Đặt lịch</h1>
            <p className="text-slate-600">
              {isMarketer ? "Theo dõi và quản lý các lời mời hợp tác gửi đến KOL/KOC." : "Xem và phản hồi các lời mời hợp tác từ Brand."}
            </p>
          </div>
          {isMarketer && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-600 transition-all shadow-md"
            >
              + Tạo Booking mới
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm ID, Chiến dịch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {["all", "pending", "accepted", "completed", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === f ? "bg-purple-100 text-purple-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {f === "all" ? "Tất cả" : f === "pending" ? "Chờ duyệt" : f === "accepted" ? "Đã nhận" : f === "completed" ? "Hoàn thành" : "Đã hủy"}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">{errorMessage}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">{isMarketer ? "KOC" : "Thương hiệu"}</th>
                  <th className="px-6 py-4 font-semibold">Chiến dịch</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold">Cập nhật lúc</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                ) : filteredBookings.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Không tìm thấy booking nào phù hợp.</td></tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">#{booking.id}</td>
                      <td className="px-6 py-4 font-medium">
                        {isMarketer ? (booking.kocName || `KOC #${booking.kocId}`) : (booking.marketerName || `Brand #${booking.marketerId}`)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {booking.campaignTitle || `Campaign #${booking.campaignId}`}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(booking.updatedAt).toLocaleDateString("vi-VN")}</td>
                      <td className="px-6 py-4 text-right">
                        {!isMarketer && booking.status === "pending" && booking.direction === "marketer_invited" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleUpdateStatusDirect(booking.id, "accepted")} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">Chấp nhận</button>
                            <button onClick={() => handleUpdateStatusDirect(booking.id, "rejected")} className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-md text-xs font-medium hover:bg-rose-200 transition-colors">Từ chối</button>
                            <button onClick={() => setSelectedBooking(booking)} className="px-3 py-1.5 text-purple-600 font-medium hover:bg-purple-50 rounded-md text-xs transition-colors">Chi tiết</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {!isMarketer && booking.status === "pending" && booking.direction === "koc_applied" && (
                              <button onClick={() => handleUpdateStatusDirect(booking.id, "cancelled")} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium hover:bg-rose-100 transition-colors">Hủy ứng tuyển</button>
                            )}
                            {booking.status !== "pending" && booking.status !== "rejected" && booking.status !== "cancelled" && (
                              <button
                                onClick={() => navigate(isMarketer ? `/marketer/campaigns/${booking.campaignId}` : `/koc/campaigns/${booking.id}`)}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 transition-colors"
                              >
                                {isMarketer ? "Đến chiến dịch" : "Làm việc"}
                              </button>
                            )}
                            <button 
                              onClick={() => setSelectedBooking(booking)}
                              className="text-purple-600 font-medium hover:bg-purple-50 rounded-md text-xs px-3 py-1.5 transition-colors"
                            >
                              Thông tin
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCreateModalOpen && createPortal(
        <div className="kolab-app-shell">
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCreateModalOpen(false);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          >
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-bold text-lg">Tạo Booking mới</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:bg-slate-100 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <label className="block text-sm font-medium mb-1">KOC ID</label>
                <input
                  type="text"
                  value={newBooking.kocId}
                  onChange={(e) => setNewBooking({...newBooking, kocId: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Nhập ID của KOC..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chiến dịch</label>
                {campaigns.length > 0 ? (
                  <select
                    value={newBooking.campaignId}
                    onChange={(e) => setNewBooking({...newBooking, campaignId: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  >
                    <option value="">Chọn chiến dịch...</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newBooking.campaignId}
                    onChange={(e) => setNewBooking({...newBooking, campaignId: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Nhập ID Chiến dịch (VD: 1)..."
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá đề xuất (VNĐ)</label>
                <input
                  type="text"
                  value={formatThousands(newBooking.offeredPrice)}
                  onChange={(e) => setNewBooking({...newBooking, offeredPrice: String(parseThousands(e.target.value))})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="VD: 5.000.000"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 shrink-0">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-white transition-colors">Hủy</button>
              <button onClick={handleCreateBooking} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-600 transition-all">Gửi lời mời hợp tác</button>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedBooking && createPortal(
        <div className="kolab-app-shell">
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedBooking(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          >
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-lg">Chi tiết Booking #{selectedBooking.id}</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-500 hover:bg-slate-100 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">Trạng thái:</span>
                {getStatusBadge(selectedBooking.status)}
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="text-slate-600 text-sm">{isMarketer ? "KOC:" : "Thương hiệu:"}</span>
                <span className="font-medium text-slate-900">
                  {isMarketer ? (selectedBooking.kocName || `KOC #${selectedBooking.kocId}`) : (selectedBooking.marketerName || `Brand #${selectedBooking.marketerId}`)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="text-slate-600 text-sm">Chiến dịch:</span>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    navigate(isMarketer ? `/marketer/campaigns/${selectedBooking.campaignId}` : `/koc/campaigns/${selectedBooking.id}`);
                  }}
                  className="font-bold text-purple-600 hover:text-purple-800 hover:underline text-right cursor-pointer flex items-center gap-1 justify-end max-w-[70%] transition-colors"
                  title="Đi đến trang chi tiết chiến dịch"
                >
                  <span className="truncate">{selectedBooking.campaignTitle || `#${selectedBooking.campaignId}`}</span>
                  <ExternalLink size={14} className="shrink-0" />
                </button>
              </div>
              {(selectedBooking.campaignPlatform || selectedBooking.campaignCategory) && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-slate-600 text-sm">Chi tiết chiến dịch:</span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {[selectedBooking.campaignPlatform, selectedBooking.campaignCategory].filter(Boolean).join(" • ")}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="text-slate-600 text-sm">Giá đề xuất:</span>
                <span className="font-medium text-purple-600">{new Intl.NumberFormat("vi-VN").format(selectedBooking.offeredPrice || 0)} VNĐ</span>
              </div>
              {!!selectedBooking.estimatedDeliveryDays && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-slate-600 text-sm">Thời gian làm bài:</span>
                  <span className="font-medium text-slate-900">{selectedBooking.estimatedDeliveryDays} ngày</span>
                </div>
              )}
              {selectedBooking.sampleLink && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-slate-600 text-sm">Link video mẫu:</span>
                  <a 
                    href={selectedBooking.sampleLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    Xem video mẫu <ExternalLink size={14} />
                  </a>
                </div>
              )}
              {selectedBooking.draftLink && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-slate-600 text-sm">Video nháp (Draft):</span>
                  <a 
                    href={selectedBooking.draftLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-purple-600 hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    Xem bản thảo <ExternalLink size={14} />
                  </a>
                </div>
              )}
              {selectedBooking.finalLink && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-slate-600 text-sm">Video chính thức (Final):</span>
                  <a 
                    href={selectedBooking.finalLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-emerald-600 hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    Xem video chính thức <ExternalLink size={14} />
                  </a>
                </div>
              )}
              {selectedBooking.note && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-600 text-sm block mb-1">Lời nhắn / Đề xuất:</span>
                  <div className="bg-slate-50 rounded-xl p-3 text-slate-700 text-sm italic border border-slate-100 leading-relaxed whitespace-pre-line">
                    "{selectedBooking.note}"
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex flex-wrap justify-end gap-2 bg-slate-50 shrink-0">
              <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-white transition-colors">Đóng</button>
              
              {selectedBooking.status !== "pending" && selectedBooking.status !== "rejected" && selectedBooking.status !== "cancelled" && (
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    navigate(isMarketer ? `/marketer/campaigns/${selectedBooking.campaignId}` : `/koc/campaigns/${selectedBooking.id}`);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  {isMarketer ? "Đến trang chiến dịch" : "Đến trang làm việc"}
                </button>
              )}
              
              {/* Các nút xử lý nghiệp vụ Booking */}
              {!isMarketer && selectedBooking.status === "pending" && selectedBooking.direction === "marketer_invited" && (
                <>
                  <button onClick={() => handleUpdateStatus("rejected")} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors">Từ chối</button>
                  <button onClick={() => handleUpdateStatus("accepted")} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Chấp nhận</button>
                </>
              )}
              {!isMarketer && selectedBooking.status === "pending" && selectedBooking.direction === "koc_applied" && (
                <button onClick={() => handleUpdateStatus("cancelled")} className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors">Hủy ứng tuyển</button>
              )}
              {isMarketer && selectedBooking.status === "pending" && selectedBooking.direction === "marketer_invited" && (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-sm text-amber-600 italic">Đang chờ KOC phản hồi...</span>
                  <button onClick={() => handleUpdateStatus("cancelled")} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors">Hủy lời mời</button>
                </div>
              )}
              {isMarketer && selectedBooking.status === "pending" && selectedBooking.direction === "koc_applied" && (
                <>
                  <button onClick={() => handleUpdateStatus("rejected")} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors">Từ chối ứng tuyển</button>
                  <button 
                    onClick={async () => {
                      if (!confirm("Bạn có chắc chắn muốn duyệt ứng viên này và bắt đầu hợp đồng? Số tiền báo giá của KOC sẽ được trừ trực tiếp từ ngân sách khả dụng của chiến dịch.")) return;
                      await handleUpdateStatus("accepted");
                    }} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Chấp nhận ứng tuyển
                  </button>
                </>
              )}
              {isMarketer && (selectedBooking.status === "accepted" || selectedBooking.status === "in_progress") && (
                <button onClick={() => handleUpdateStatus("completed")} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">Đánh dấu hoàn thành</button>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </DashboardLayout>
  );
}