import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { 
  User, 
  Sparkles, 
  Instagram, 
  Youtube, 
  Music, 
  CheckCircle, 
  ArrowRight, 
  Camera, 
  MapPin, 
  Globe, 
  Target, 
  TrendingUp,
  Award,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Upload,
  Check,
  Users
} from "lucide-react";
import { PublicHeader } from "../layouts/PublicHeader";
import { updateMyProfile, getMyProfile, type KocProfile } from "../../services/profileService";
import { uploadFile } from "../../services/api";

export function KOLProfileBuilderPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    location: "Hà Nội",
    avatarUrl: "",
    categories: [] as string[],
    platforms: [] as string[],
    followers: 10000,
    engagementRate: 5.5,
    priceRange: "2M - 5M VNĐ",
  });

  useEffect(() => {
    let cancelled = false;
    const checkProfile = async () => {
      try {
        const response = await getMyProfile();
        if (cancelled) return;
        const kocProfile = response.profile as KocProfile;
        // If they already have niche and platform filled, they don't need the builder
        if (kocProfile.niche && kocProfile.platform) {
          navigate("/koc/profile", { replace: true });
        }
      } catch (err) {
        // Silently fail, user might not be logged in or first time
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    checkProfile();
    return () => { cancelled = true; };
  }, [navigate]);

  if (fetching) return (
    <div className="public-dark-page flex min-h-screen items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

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

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadFile(file);
      setFormData(prev => ({ ...prev, avatarUrl: result.url }));
    } catch (err: any) {
      setError(err.message || "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  };

  const handleCategoryToggle = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      
      const payload = {
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        avatarUrl: formData.avatarUrl,
        niche: formData.categories.join(", "),
        platform: formData.platforms.join(", "),
        followers: formData.followers,
        engagementRate: formData.engagementRate,
        verified: true // Setting true for first-time builder
      };

      await updateMyProfile(payload);
      setStep(3); // Move to final success step
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra khi lưu hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-dark-page">
      <PublicHeader theme="dark" />

      <div className="container mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-500" 
                 style={{ width: `${((step - 1) / 2) * 100}%` }}
               />
            </div>
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= s ? "bg-primary text-white shadow-lg" : "bg-white text-slate-400 border-2 border-slate-200"
                }`}
              >
                {step > s ? <Check size={20} /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cơ bản</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Năng lực</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Hoàn tất</span>
          </div>
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[32px] border border-slate-100 bg-white p-10 shadow-2xl shadow-blue-900/5">
               <div className="text-center mb-10">
                  <h1 className="text-3xl font-black text-slate-900 mb-2">Thông tin cá nhân</h1>
                  <p className="text-slate-500">Hãy cho các thương hiệu biết bạn là ai</p>
               </div>

               <div className="space-y-8">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center">
                    <div 
                      onClick={handleAvatarClick}
                      className="group relative w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl cursor-pointer hover:border-primary transition-all"
                    >
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-primary">
                          <Camera size={32} className="mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Tải ảnh</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-white" size={24} />
                      </div>
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh đại diện chuyên nghiệp</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tên hiển thị</label>
                      <input 
                        type="text"
                        value={formData.displayName}
                        onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                        placeholder="VD: Nam Phạm (Nắng)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Vị trí hiện tại</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                          value={formData.location}
                          onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium appearance-none"
                        >
                          <option>Hà Nội</option>
                          <option>TP. Hồ Chí Minh</option>
                          <option>Đà Nẵng</option>
                          <option>Cần Thơ</option>
                          <option>Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Giới thiệu ngắn</label>
                    <textarea 
                      rows={4}
                      value={formData.bio}
                      onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium resize-none"
                      placeholder="Chia sẻ về phong cách sáng tạo nội dung của bạn..."
                    />
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={() => setStep(2)}
                      disabled={!formData.displayName || !formData.bio}
                      className="flex w-full items-center justify-center gap-3 rounded-full bg-primary py-5 font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-primary/10 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Tiếp tục
                      <ChevronRight size={20} />
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Step 2: Capacity */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="rounded-[32px] border border-slate-100 bg-white p-10 shadow-2xl shadow-blue-900/5">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-black text-slate-900 mb-2">Năng lực sáng tạo</h1>
                  <p className="text-slate-500">Số liệu thật giúp bạn nổi bật hơn trong mắt nhãn hàng</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-medium flex items-center gap-2">
                    <Sparkles size={16} /> {error}
                  </div>
                )}

                <div className="space-y-10">
                  {/* Category Selection */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                       <Target size={16} /> Lĩnh vực chuyên môn
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => handleCategoryToggle(cat)}
                          className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                            formData.categories.includes(cat)
                              ? "bg-primary border-primary text-white shadow-lg shadow-primary/10"
                              : "bg-white border-slate-100 text-slate-600 hover:border-blue-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                       <Globe size={16} /> Nền tảng hoạt động
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {platforms.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handlePlatformToggle(p.id)}
                          className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${
                            formData.platforms.includes(p.id)
                              ? "border-primary bg-blue-50/50"
                              : "border-slate-100 hover:border-blue-100"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${p.color}`}>
                            <p.icon size={24} />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tổng Followers</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="number"
                          value={formData.followers}
                          onChange={e => setFormData(prev => ({ ...prev, followers: parseInt(e.target.value) }))}
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tỉ lệ tương tác (%)</label>
                      <div className="relative">
                        <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="number"
                          step="0.1"
                          value={formData.engagementRate}
                          onChange={e => setFormData(prev => ({ ...prev, engagementRate: parseFloat(e.target.value) }))}
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mức giá mong muốn</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                          value={formData.priceRange}
                          onChange={e => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold appearance-none"
                        >
                          <option>500K - 2M VNĐ</option>
                          <option>2M - 5M VNĐ</option>
                          <option>5M - 10M VNĐ</option>
                          <option>10M - 50M VNĐ</option>
                          <option>Trên 50M VNĐ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      onClick={() => setStep(1)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-slate-200 py-5 font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
                    >
                      <ChevronLeft size={20} /> Quay lại
                    </button>
                    <button 
                      onClick={handleFinalSubmit}
                      disabled={loading || formData.categories.length === 0 || formData.platforms.length === 0}
                      className="flex flex-[2] items-center justify-center gap-3 rounded-full bg-primary py-5 font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-primary/10 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
                      Hoàn tất hồ sơ
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Step 3: Success & AI Matching */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto text-center animate-in fade-in zoom-in duration-700">
             <div className="mb-8 flex justify-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10 border-2 border-emerald-100">
                   <CheckCircle size={48} />
                </div>
             </div>
             
             <h1 className="text-4xl font-black text-slate-900 mb-4">Hồ sơ đã sẵn sàng!</h1>
             <p className="text-xl text-slate-600 mb-12 max-w-xl mx-auto">
               Chúc mừng! Bạn đã hoàn thành việc xây dựng hồ sơ chuyên nghiệp. Bây giờ hãy bắt đầu khám phá các chiến dịch phù hợp.
             </p>

             <div className="grid gap-6 mb-12">
                <div className="flex items-center gap-6 rounded-[32px] border border-slate-100 bg-white p-8 text-left shadow-xl shadow-blue-900/5">
                   <div className="w-20 h-20 bg-blue-50 rounded-[24px] flex items-center justify-center text-primary">
                      <Award size={40} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">Dành riêng cho bạn</h3>
                      <p className="text-slate-500 font-medium">Chúng tôi đã tìm thấy 5 chiến dịch phù hợp 95% với thế mạnh của bạn.</p>
                   </div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => navigate("/koc/campaigns")}
                  className="flex items-center gap-3 rounded-full bg-primary px-10 py-5 font-black uppercase tracking-widest text-white shadow-2xl shadow-primary/10 transition-all hover:bg-primary-hover"
                >
                  Khám phá Job ngay
                  <ArrowRight size={20} />
                </button>
                <button 
                  onClick={() => navigate("/koc")}
                  className="rounded-full border-2 border-slate-100 bg-white px-10 py-5 font-black uppercase tracking-widest text-slate-700 transition-all hover:border-primary hover:text-primary"
                >
                  Về Dashboard
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
