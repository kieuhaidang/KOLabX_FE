import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useLocation } from "react-router";
import { 
  Search,
  Paperclip,
  Send,
  Bot,
  CheckCheck,
  Check,
  FileText,
  MoreVertical,
  Trash2,
  EyeOff,
  X,
  Image as ImageIcon,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { listBookings, type Booking } from "../../services/bookingService";
import * as messageService from "../../services/messageService";
import * as campaignService from "../../services/campaignService";
import type { Campaign } from "../../services/campaignService";
import { listKocProfiles } from "../../services/profileService";
import { REAL_KOLS } from "../../data/realKols";
import { useAuth } from "../auth/AuthProvider";
import { apiRequest, API_BASE_URL } from "../../services/api";

export function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isMarketer = location.pathname.includes("/marketer/");
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [campaignsMap, setCampaignsMap] = useState<Record<number, string>>({});
  const [kocsMap, setKocsMap] = useState<Record<number, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<messageService.Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // File states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsArchiving] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debounce search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookingsRes, campaignsRes, kocsRes] = await Promise.all([
          listBookings({ onlyVisible: true, search: debouncedSearch }), 
          campaignService.listCampaigns({}),
          isMarketer ? listKocProfiles({}).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
        ]);
        if (cancelled) return;

        setBookings(bookingsRes.items);
        
        // If selectedBooking is no longer in the list after search, keep it or clear it?
        // Usually, we keep the active conversation. 

        const cmap: Record<number, string> = {};
        campaignsRes.items.forEach((c: any) => {
          cmap[c.id] = c.title;
        });
        setCampaignsMap(cmap);

        const kmap: Record<number, string> = {};
        REAL_KOLS.forEach((k) => {
          kmap[k.id] = k.name;
        });
        kocsRes.items.forEach((k: any) => {
          kmap[k.userId] = k.displayName || k.fullName || `KOC #${k.userId}`;
        });
        setKocsMap(kmap);

        if (bookingsRes.items.length > 0 && !selectedBooking) {
          setSelectedBooking(bookingsRes.items[0]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu MessagesPage:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [isMarketer, debouncedSearch]);

  useEffect(() => {
    if (!selectedBooking) return;
    let cancelled = false;
    
    const fetchMessages = async () => {
      try {
        const res = await messageService.listMessagesByBooking(selectedBooking.id);
        if (!cancelled) {
          setMessages(res.items);
          // Auto mark as read if there are unread messages from others
          const currentUserId = Number(user?.id);
          const hasUnread = res.items.some(m => !m.isRead && Number(m.senderId) !== currentUserId);
          if (hasUnread) {
            await messageService.markMessagesAsRead(selectedBooking.id);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn", error);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => { 
      cancelled = true; 
      clearInterval(interval);
    };
  }, [selectedBooking, user?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File quá lớn. Vui lòng chọn file dưới 5MB.");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if (!selectedBooking) return;
    if (!messageInput.trim() && !selectedFile) return;
    
    const content = messageInput.trim();
    const fileToUpload = selectedFile;
    
    setMessageInput(""); 
    setSelectedFile(null);
    setFilePreview(null);

    try {
      let fileUrl: string | undefined = undefined;
      let fileType: string | undefined = undefined;

      if (fileToUpload) {
        // Step 1: Upload file to server
        const formData = new FormData();
        formData.append("file", fileToUpload);
        
        const uploadRes = await apiRequest<{ url: string; fileType: string }>("/api/upload", {
          method: "POST",
          auth: true,
          body: formData,
        });
        fileUrl = uploadRes.url;
        fileType = uploadRes.fileType;
      }

      // Step 2: Send message with file URL
      const res = await messageService.createMessage(selectedBooking.id, content, fileUrl, fileType);
      if (res.item) {
        setMessages((prev) => [...prev, res.item]);
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn", error);
      alert("Gửi tin nhắn thất bại. Vui lòng thử lại.");
    }
  };

  const handleHideChat = async (bookingId: number) => {
    try {
      await messageService.hideChat(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      if (selectedBooking?.id === bookingId) setSelectedBooking(null);
    } catch (error) {
      alert("Lỗi khi ẩn đoạn chat");
    }
  };

  const handleDeleteChat = async (bookingId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này?")) return;
    try {
      await messageService.deleteChat(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      if (selectedBooking?.id === bookingId) setSelectedBooking(null);
    } catch (error) {
      alert("Lỗi khi xóa đoạn chat");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout role={isMarketer ? "marketer" : "koc"}>
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Trò chuyện</h1>
            <p className="text-sm text-slate-500">
              {isMarketer ? "Trao đổi với KOC về chiến dịch và nội dung." : "Thảo luận chi tiết công việc với thương hiệu."}
            </p>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Sidebar: Conversations List */}
          <div className="w-80 border-r border-white/[0.08] flex flex-col bg-[#171b1f]">
            <div className="p-4 border-b border-white/[0.08] bg-[#111418]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className="w-full rounded-xl border border-white/[0.12] bg-[#111418] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Tìm kiếm theo tên hoặc chiến dịch..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.08] bg-[#171b1f]">
              {loading && <div className="p-10 text-center"><div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div></div>}
              {bookings.map((booking) => (
                <div 
                  key={booking.id} 
                  onClick={() => setSelectedBooking(booking)}
                  className={`group flex items-center gap-3 px-4 py-4 cursor-pointer border-l-4 transition-all ${
                    selectedBooking?.id === booking.id
                      ? "border-primary bg-orange-500/[0.14] shadow-sm"
                      : "border-transparent bg-[#1b1f24] hover:bg-[#23282e]"
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                    {(isMarketer ? (kocsMap[booking.kocId] || "K") : "B")[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="truncate font-bold text-white text-sm">
                        {isMarketer ? (kocsMap[booking.kocId] || `KOC #${booking.kocId}`) : (booking.marketerName || `Thương hiệu`)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(booking.updatedAt).toLocaleDateString("vi-VN")}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 hover:bg-white/10 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleHideChat(booking.id)} className="flex items-center gap-2 cursor-pointer">
                              <EyeOff size={14} /> <span>Ẩn trò chuyện</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteChat(booking.id)} className="flex items-center gap-2 text-red-600 cursor-pointer focus:text-red-600">
                              <Trash2 size={14} /> <span>Xóa lịch sử</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-xs text-[#aab6c5] truncate">{campaignsMap[booking.campaignId] || `Chiến dịch #${booking.campaignId}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedBooking ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {(isMarketer ? (kocsMap[selectedBooking.kocId] || "K") : "B")[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{isMarketer ? (kocsMap[selectedBooking.kocId] || `KOC #${selectedBooking.kocId}`) : (selectedBooking.marketerName || `Thương hiệu`)}</p>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        <p className="text-[11px] text-slate-500 font-medium">Đang trực tuyến • {campaignsMap[selectedBooking.campaignId]}</p>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><MoreVertical size={20}/></button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {messages.map((msg, index) => {
                    const isMe = msg.senderId === user?.id;
                    const showTime = index === 0 || new Date(msg.sentAt).getTime() - new Date(messages[index-1].sentAt).getTime() > 300000;

                    return (
                      <div key={msg.id} className="flex flex-col">
                        {showTime && (
                          <div className="text-center my-4">
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100 uppercase tracking-wider">
                              {new Date(msg.sentAt).toLocaleDateString("vi-VN")} {formatTime(msg.sentAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] group relative`}>
                            <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMe 
                                ? "bg-blue-600 text-white rounded-tr-none" 
                                : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                            }`}>
                              {msg.fileUrl && (
                                <div className="mb-2">
                                  {msg.fileType?.startsWith("image/") ? (
                                    <a 
                                      href={`${API_BASE_URL}${msg.fileUrl}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="block hover:opacity-90 transition-opacity"
                                    >
                                      <img 
                                        src={`${API_BASE_URL}${msg.fileUrl}`} 
                                        alt="Attachment" 
                                        className="rounded-lg max-h-60 w-full object-cover border border-black/10"
                                      />
                                    </a>
                                  ) : (
                                    <div className="p-2 bg-black/5 rounded-lg flex items-center gap-2 border border-black/5 group-hover:bg-black/10 transition-colors">
                                       <FileText size={16} className="text-blue-500" />
                                       <a 
                                         href={`${API_BASE_URL}${msg.fileUrl}`} 
                                         target="_blank" 
                                         rel="noopener noreferrer" 
                                         className="underline truncate text-xs font-bold hover:text-blue-500"
                                       >
                                         {msg.fileType?.includes("pdf") ? "Xem tài liệu PDF" : "Mở tệp đính kèm"}
                                       </a>
                                    </div>
                                  )}
                                </div>
                              )}
                              {msg.content}
                            </div>
                            {isMe && (
                              <div className="flex justify-end mt-1 items-center gap-1">
                                {msg.isRead ? (
                                  <span className="text-[10px] text-blue-500 font-bold flex items-center gap-0.5"><CheckCheck size={12}/> Đã xem</span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5"><Check size={12}/> Đã gửi</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attachment Preview Area */}
                {(selectedFile || filePreview) && (
                  <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-3">
                     <div className="relative group">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
                        ) : (
                          <div className="h-16 w-16 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-500">
                             <FileText size={20} />
                             <span className="text-[8px] mt-1 font-bold truncate px-1 w-full text-center">{selectedFile?.name}</span>
                          </div>
                        )}
                        <button 
                          onClick={removeFile}
                          className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-lg hover:bg-black transition-colors"
                        >
                          <X size={12} />
                        </button>
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedFile?.name}</p>
                        <p className="text-[10px] text-slate-500">{(selectedFile!.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng gửi</p>
                     </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <div className="flex items-end gap-3 bg-slate-100 rounded-2xl p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all border border-transparent focus-within:border-blue-200">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-slate-500 hover:bg-white hover:text-blue-600 rounded-xl transition-colors"
                    >
                      <Paperclip size={20} />
                    </button>
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={1}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 resize-none max-h-32"
                      placeholder="Viết tin nhắn..."
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={(!messageInput.trim() && !selectedFile)}
                      className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-600/20"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/30">
                <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
                   <MessageSquare size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Trung tâm trao đổi công việc</h3>
                <p className="text-slate-500 max-w-sm">Hãy chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu thảo luận chi tiết chiến dịch.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
