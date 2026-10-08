import { useEffect, useMemo, useState, useRef } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useLocation } from "react-router";
import {
  Building2,
  Bell,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Camera,
  MapPin,
  Globe,
  Check,
  Upload,
  User,
  Instagram,
  Youtube,
  Music,
  Target,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { ApiError, uploadFile } from "../../services/api";
import { getMyProfile, updateMyProfile, type Profile, type KocProfile, type MarketerProfile } from "../../services/profileService";
import { listCampaigns, type Campaign } from "../../services/campaignService";
import { listBookings, type Booking } from "../../services/bookingService";
import { useAuth } from "../auth/AuthProvider";

const PRICE_OVERRIDE_STORAGE_KEY = "koc_price_overrides_vnd";

function toDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

const categories = [
  "Làm đẹp", "Thời trang", "Công nghệ", "Phong cách sống", 
  "Thể hình", "Ẩm thực", "Du lịch", "Giáo dục", "Mẹ và bé", "Gaming"
];

const platforms = [
  { id: "tiktok", name: "TikTok", icon: Music, color: "bg-black" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "bg-red-600" },
  { id: "facebook", name: "Facebook", icon: Globe, color: "bg-blue-600" },
];

export function ProfilePage() {
  const location = useLocation();
  const { user } = useAuth();
  const isMarketer = location.pathname.includes("/marketer/");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    displayName: "",
    bio: "",
    location: "",
    avatarUrl: "",
    niche: [] as string[],
    platform: [] as string[],
    followers: 0,
    engagementRate: 0,
    servicePrice: 0,
    companyName: "",
    brandName: "",
    industry: "",
    website: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await getMyProfile();
        if (cancelled) return;
        const p = response.profile;
        setProfile(p as Profile);
        if (isMarketer) {
          const mp = p as MarketerProfile;
          setFormData({
            fullName: mp.fullName || "",
            displayName: "",
            bio: mp.bio || "",
            location: "",
            avatarUrl: mp.avatarUrl || "",
            niche: [],
            platform: [],
            followers: 0,
            engagementRate: 0,
            servicePrice: 0,
            companyName: mp.companyName || "",
            brandName: mp.brandName || "",
            industry: mp.industry || "",
            website: mp.website || "",
            bankName: mp.bankName || "",
            bankAccountNumber: mp.bankAccountNumber || "",
            bankAccountName: mp.bankAccountName || "",
          });
        } else {
          const kp = p as KocProfile;
          setFormData({
            fullName: kp.fullName || "",
            displayName: kp.displayName || "",
            bio: kp.bio || "",
            location: kp.location || "Hà Nội",
            avatarUrl: kp.avatarUrl || "",
            niche: kp.niche ? kp.niche.split(", ").filter(Boolean) : [],
            platform: kp.platform ? kp.platform.split(", ").filter(Boolean) : [],
            followers: kp.followers || 0,
            engagementRate: kp.engagementRate || 0,
            servicePrice: kp.servicePrice || 0,
            companyName: "",
            brandName: "",
            industry: "",
            website: "",
            bankName: kp.bankName || "",
            bankAccountNumber: kp.bankAccountNumber || "",
            bankAccountName: kp.bankAccountName || "",
          });
        }
      } catch (err: any) {
        if (!cancelled) setErrorMessage(err.message || "Không thể tải hồ sơ.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const result = await uploadFile(file);
      setFormData(prev => ({ ...prev, avatarUrl: result.url }));
    } catch (err: any) {
      setErrorMessage("Lỗi tải ảnh: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const payload = isMarketer 
        ? {
            fullName: formData.fullName,
            companyName: formData.companyName,
            brandName: formData.brandName,
            industry: formData.industry,
            website: formData.website,
            bio: formData.bio,
            avatarUrl: formData.avatarUrl,
            bankName: formData.bankName,
            bankAccountNumber: formData.bankAccountNumber,
            bankAccountName: formData.bankAccountName,
          }
        : {
            fullName: formData.fullName,
            displayName: formData.displayName,
            bio: formData.bio,
            location: formData.location,
            avatarUrl: formData.avatarUrl,
            niche: formData.niche.join(", "),
            platform: formData.platform.join(", "),
            followers: formData.followers,
            engagementRate: formData.engagementRate,
            servicePrice: formData.servicePrice,
            bankName: formData.bankName,
            bankAccountNumber: formData.bankAccountNumber,
            bankAccountName: formData.bankAccountName,
          };

      const response = await updateMyProfile(payload);
      setProfile(response.profile);
      setIsEditing(false);
      setMessage("Hồ sơ đã được cập nhật thành công!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi cập nhật hồ sơ.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNiche = (n: string) => {
    setFormData(prev => ({
      ...prev,
      niche: prev.niche.includes(n) ? prev.niche.filter(i => i !== n) : [...prev.niche, n]
    }));
  };

  const togglePlatform = (p: string) => {
    setFormData(prev => ({
      ...prev,
      platform: prev.platform.includes(p) ? prev.platform.filter(i => i !== p) : [...prev.platform, p]
    }));
  };

  if (loading) return (
    <DashboardLayout role={isMarketer ? "marketer" : "koc"}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role={isMarketer ? "marketer" : "koc"}>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-end gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[40px] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={48} />
                  </div>
                )}
                {isEditing && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    <Upload className="text-white" size={24} />
                  </div>
                )}
                {isUploading && (
                   <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                   </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <div className="pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-slate-900">
                  {isMarketer ? (profile as MarketerProfile)?.fullName : ((profile as KocProfile)?.displayName || (profile as KocProfile)?.fullName)}
                </h1>
                {!isMarketer && (profile as KocProfile)?.verified && <Check size={18} className="p-0.5 bg-blue-500 text-white rounded-full" />}
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                {isMarketer ? ((profile as MarketerProfile)?.brandName || "Thương hiệu") : `${formData.niche[0] || "KOC"} • ${formData.location}`}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
             {isEditing ? (
               <>
                 <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                 >
                   Hủy
                 </button>
                 <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2"
                 >
                   {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                   Lưu thay đổi
                 </button>
               </>
             ) : (
               <button 
                onClick={() => setIsEditing(true)}
                className="px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all"
               >
                 Chỉnh sửa hồ sơ
               </button>
             )}
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle size={18} /> {message}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 font-bold text-sm flex items-center gap-2">
            <Bell size={18} /> {errorMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-primary/5 p-8">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                   <Target size={24} className="text-primary" />
                   Thông tin cơ bản
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</label>
                      <input 
                        type="text"
                        disabled={!isEditing}
                        value={formData.fullName}
                        onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-bold disabled:opacity-70"
                      />
                   </div>
                   {!isMarketer && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên hiển thị (Nghệ danh)</label>
                        <input 
                          type="text"
                          disabled={!isEditing}
                          value={formData.displayName}
                          onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-bold disabled:opacity-70"
                        />
                     </div>
                   )}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vị trí</label>
                      <select 
                        disabled={!isEditing}
                        value={formData.location}
                        onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-bold disabled:opacity-70 appearance-none"
                      >
                         <option>Hà Nội</option>
                         <option>TP. Hồ Chí Minh</option>
                         <option>Đà Nẵng</option>
                         <option>Khác</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email liên hệ</label>
                      <input 
                        type="email"
                        disabled
                        value={profile?.email || ""}
                        className="w-full px-5 py-3 bg-slate-100 border border-slate-100 rounded-2xl font-bold opacity-70"
                      />
                   </div>
                </div>

                <div className="mt-6 space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Giới thiệu bản thân</label>
                   <textarea 
                     disabled={!isEditing}
                     rows={4}
                     value={formData.bio}
                     onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                     className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium disabled:opacity-70 resize-none"
                   />
                </div>
             </div>

             {!isMarketer && (
               <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-primary/5 p-8">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                     <TrendingUp size={24} className="text-primary" />
                     Chỉ số & Năng lực
                  </h3>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lĩnh vực chuyên môn</label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(c => (
                          <button
                            key={c}
                            disabled={!isEditing}
                            onClick={() => toggleNiche(c)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                              formData.niche.includes(c)
                                ? "bg-primary border-primary text-white"
                                : "bg-white border-slate-100 text-slate-500 hover:border-blue-200"
                            } disabled:opacity-70`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tổng Followers</label>
                          <input 
                            type="number"
                            disabled={!isEditing}
                            value={formData.followers}
                            onChange={e => setFormData(prev => ({ ...prev, followers: parseInt(e.target.value) }))}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Engagement Rate (%)</label>
                          <input 
                            type="number"
                            step="0.1"
                            disabled={!isEditing}
                            value={formData.engagementRate}
                            onChange={e => setFormData(prev => ({ ...prev, engagementRate: parseFloat(e.target.value) }))}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                          />
                        </div>
                    </div>
                  </div>
               </div>
             )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-primary/5 p-8">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                   <Globe size={24} className="text-primary" />
                   Nền tảng chính
                </h3>
                <div className="grid gap-3">
                   {platforms.map(p => {
                      const isSelected = formData.platform.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          disabled={!isEditing}
                          onClick={() => togglePlatform(p.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            isSelected ? "border-primary bg-blue-50/30" : "border-slate-50 hover:border-blue-100"
                          } disabled:opacity-70`}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${p.color}`}>
                                 <p.icon size={16} />
                              </div>
                              <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                           </div>
                           {isSelected && <CheckCircle size={16} className="text-primary" />}
                        </button>
                      );
                   })}
                </div>
             </div>

             {!isMarketer && (
               <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-primary/5 p-8">
                  <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                     <DollarSign size={24} className="text-primary" />
                     Giá dịch vụ
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Mức giá tham khảo 1 video</p>
                  
                  <div className="space-y-4">
                     <input 
                       type="number"
                       disabled={!isEditing}
                       value={formData.servicePrice}
                       onChange={e => setFormData(prev => ({ ...prev, servicePrice: parseInt(e.target.value) }))}
                       className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-black text-lg text-primary"
                     />
                     <p className="text-xs text-slate-500 italic">Giá này sẽ được hiển thị cho Brand khi họ tìm kiếm bạn.</p>
                  </div>
               </div>
             )}

             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-primary/5 p-8">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                   <Building2 size={24} className="text-primary" />
                   Thông tin thanh toán
                </h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên ngân hàng</label>
                      <input 
                        type="text"
                        disabled={!isEditing}
                        value={formData.bankName}
                        onChange={e => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="VD: Vietcombank"
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số tài khoản</label>
                      <input 
                        type="text"
                        disabled={!isEditing}
                        value={formData.bankAccountNumber}
                        onChange={e => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                        placeholder="1234567890"
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chủ tài khoản (Viết không dấu)</label>
                      <input 
                        type="text"
                        disabled={!isEditing}
                        value={formData.bankAccountName}
                        onChange={e => setFormData(prev => ({ ...prev, bankAccountName: e.target.value.toUpperCase() }))}
                        placeholder="NGUYEN VAN A"
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm uppercase"
                      />
                   </div>
                </div>
             </div>

             <div className="bg-primary rounded-[40px] p-8 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/10 rotate-12 transition-transform group-hover:scale-125" />
                <h4 className="text-lg font-black mb-2 relative z-10">Bảo mật tài khoản</h4>
                <p className="text-blue-100 text-xs mb-6 relative z-10">Lần đổi mật khẩu cuối cùng: 15 ngày trước</p>
                <button className="w-full py-3 bg-white text-primary rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-50 transition-all relative z-10">
                   Đổi mật khẩu
                </button>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CheckCircle(props: any) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
