import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  Filter,
  TrendingUp,
  Award,
  Star,
  Heart,
  Users,
  Sparkles,
  Check,
  BarChart3,
  Clock3,
  X,
  Video,
  Radio,
  PackageSearch,
  Globe,
  Camera,
  MessageSquare,
  Music2,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trophy,
  ExternalLink,
  Plus,
  Send
} from "lucide-react";
import { PublicHeader } from "../layouts/PublicHeader";
import { PublicFooter } from "../layouts/PublicFooter";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ApiError, API_BASE_URL } from "../../services/api";
import { listKocProfiles, type KocProfile } from "../../services/profileService";
import { REAL_KOLS, REAL_KOL_CATEGORY_LABEL } from "../../data/realKols";
import { getStoredUser, getHomePathForRole } from "../../services/authService";
import { useAuth } from "../auth/AuthProvider";
import { toggleShortlist, getMyShortlist } from "../../services/shortlistService";
import { listCampaigns, type Campaign } from "../../services/campaignService";
import { createBooking } from "../../services/bookingService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { formatThousands, parseThousands } from "../../utils/numberFormat";

type ViewMode = "grid" | "table";
type TabMode = "discovery" | "shortlist";

const categoryIdByType = {
  technology: "tech",
  fashion_beauty: "fashion_beauty",
  travel: "travel",
  lifestyle_food: "lifestyle_food",
  tiktok: "tiktok",
} as const;

const platformsByCategory: Record<string, string[]> = {
  technology: ["YouTube", "TikTok", "Facebook"],
  fashion_beauty: ["Instagram", "TikTok", "YouTube"],
  travel: ["YouTube", "TikTok", "Instagram"],
  lifestyle_food: ["TikTok", "YouTube", "Instagram"],
  tiktok: ["TikTok", "Instagram"],
};

const bioByCategory: Record<string, string> = {
  technology: "Chuyên review thiết bị công nghệ, tập trung nội dung trải nghiệm thực tế và tư vấn mua sắm.",
  fashion_beauty: "Sáng tạo nội dung thời trang và làm đẹp theo xu hướng, ưu tiên format ngắn dễ viral.",
  travel: "Khai thác nội dung du lịch trải nghiệm, truyền cảm hứng khám phá với storytelling tự nhiên.",
  lifestyle_food: "Nội dung đời sống và ẩm thực gần gũi, phù hợp chiến dịch cần độ tin cậy cao.",
  tiktok: "Creator định dạng ngắn, bắt trend nhanh và tối ưu chuyển đổi qua social commerce.",
};

const categoryPresets = [
  { id: "all", name: "Tất cả" },
  { id: "tech", name: REAL_KOL_CATEGORY_LABEL.technology },
  { id: "fashion_beauty", name: REAL_KOL_CATEGORY_LABEL.fashion_beauty },
  { id: "travel", name: REAL_KOL_CATEGORY_LABEL.travel },
  { id: "lifestyle_food", name: REAL_KOL_CATEGORY_LABEL.lifestyle_food },
  { id: "tiktok", name: REAL_KOL_CATEGORY_LABEL.tiktok },
];

const topProducts = [
  {
    id: 1,
    name: "Apple iPhone 15 Pro",
    category: "Công nghệ",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1470&auto=format&fit=crop",
    kolsUsed: "248 KOLs",
    totalCampaigns: 96,
    avgRating: 4.9,
  },
  {
    id: 2,
    name: "Apple AirPods Pro",
    category: "Công nghệ",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=1470&auto=format&fit=crop",
    kolsUsed: "211 KOLs",
    totalCampaigns: 84,
    avgRating: 4.8,
  },
  {
    id: 3,
    name: "Nintendo Switch",
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?q=80&w=1470&auto=format&fit=crop",
    kolsUsed: "176 KOLs",
    totalCampaigns: 69,
    avgRating: 4.8,
  },
  {
    id: 4,
    name: "Canon EOS R6",
    category: "Nhiếp ảnh",
    image: "https://images.unsplash.com/photo-1616627561839-074385245ff6?q=80&w=1470&auto=format&fit=crop",
    kolsUsed: "149 KOLs",
    totalCampaigns: 57,
    avgRating: 4.7,
  },
];

const avatarObjectPositionById: Record<number, string> = {
  1: "center 20%",
  4: "center 24%",
  5: "center 22%",
  6: "center 18%",
  7: "center 30%",
  8: "center 22%",
  9: "center 28%",
  10: "center 26%",
  11: "center 22%",
};


const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function formatFollowers(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VND`;
}

function buildInitialAvatar(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "K";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="top-kol-avatar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF3300" />
          <stop offset="100%" stop-color="#008080" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#top-kol-avatar-gradient)" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="54" font-weight="700">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function normalizePersonName(value: string) {
  return normalizeText(value).replace(/[()]/g, "").replace(/\s+/g, " ").trim();
}



function getMatchedRealKolByName(name: string) {
  const normalizedName = normalizePersonName(name);
  return REAL_KOLS.find((kol) => {
    const normalizedKolName = normalizePersonName(kol.name);
    return normalizedKolName === normalizedName || normalizedKolName.includes(normalizedName) || normalizedName.includes(normalizedKolName);
  });
}

type TopKolCategoryId = "tech" | "fashion_beauty" | "travel" | "lifestyle_food" | "tiktok";

interface TopKolItem {
  id: number;
  categoryId: TopKolCategoryId;
  name: string;
  category: string;
  plan: string;
  avatar: string;
  followers: string;
  followersNum: number;
  engagementNum: number;
  engagementRate: string;
  avgViews: string;
  avgViewsNum: number;
  collaborations: number;
  rating: number;
  verified: boolean;
  topRank: number;
  growth: string;
  platforms: string[];
  responseTime: string;
  completionRate: string;
  bio: string;
  location: string;
  languages: string[];
  services: string[];
  recentBrands: string[];
  avatarObjectPosition: string;
}

function mapCategoryIdFromProfile(profile: KocProfile): TopKolCategoryId {
  const niche = normalizeText(profile.niche || "");
  const platform = normalizeText(profile.platform || "");
  if (niche.includes("cong nghe") || niche.includes("tech")) return "tech";
  if (niche.includes("thoi trang") || niche.includes("fashion") || niche.includes("lam dep") || niche.includes("beauty")) return "fashion_beauty";
  if (niche.includes("du lich") || niche.includes("travel")) return "travel";
  if (niche.includes("phong cach song") || niche.includes("lifestyle") || niche.includes("am thuc") || niche.includes("food")) return "lifestyle_food";
  if (platform.includes("tiktok")) return "tiktok";
  return "lifestyle_food";
}

function matchesTopKolCategory(
  kol: { categoryId: string; category: string; platforms: string[] },
  selectedCategory: string
) {
  if (selectedCategory === "all") return true;
  if (selectedCategory === "tiktok") {
    return kol.platforms.some((platform) => normalizeText(platform).includes("tiktok"));
  }
  return kol.categoryId === selectedCategory;
}

function TopKolAvatar({
  src,
  alt,
  objectPosition,
  size,
  className = "",
  bordered = true,
  elevated = true,
}: {
  src: string;
  alt: string;
  objectPosition: string;
  size: number;
  className?: string;
  bordered?: boolean;
  elevated?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-full bg-slate-100 ${className}`.trim()}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        border: bordered ? "4px solid white" : "none",
        boxShadow: elevated ? "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)" : "none",
      }}
    >
      <ImageWithFallback
        src={src}
        alt={alt}
        className="block"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition,
        }}
      />
    </div>
  );
}

function TopKolMetricBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border text-xs font-bold"
      style={{
        padding: "6px 14px",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderColor: "rgba(255,255,255,0.25)",
        color: "white",
      }}
    >
      {children}
    </span>
  );
}

function TopKolCapabilityChip({
  children,
  icon,
  palette = "indigo",
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  palette?: "indigo" | "emerald";
}) {
  const colors =
    palette === "emerald"
      ? {
          background: "white",
          borderColor: "#A7F3D0",
          color: "#065F46",
          iconBackground: "#F0FDF4",
          iconColor: "#059669",
        }
      : {
          background: "white",
          borderColor: "#C7D2FE",
          color: "#312E81",
          iconBackground: "#EEF2FF",
          iconColor: "#FF3300",
        };

  return (
    <span
      className="inline-flex items-center rounded-xl border text-[11px] font-bold sm:text-xs shadow-sm"
      style={{
        columnGap: 6,
        padding: "7px 12px",
        background: colors.background,
        borderColor: colors.borderColor,
        color: colors.color,
      }}
    >
      {icon ? (
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-lg"
          style={{ backgroundColor: colors.iconBackground, color: colors.iconColor }}
        >
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

function TopKolKpiCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "purple" | "blue" | "dark" }) {
  const isDark = tone === "dark";
  const valueColor =
    tone === "green"
      ? "#10B981"
      : tone === "purple"
        ? "#0D9488"
        : tone === "blue"
          ? "#3B82F6"
          : "#F8FAFC";

  const cardBg = isDark
    ? "bg-gradient-to-br from-primary/20 to-slate-900/50 border-primary/40 text-white shadow-[0_0_15px_rgba(255,51,0,0.15)]"
    : "bg-slate-900/60 border-slate-800 text-slate-100";

  return (
    <div className={`rounded-2xl border px-4 py-4 transition-all duration-300 hover:border-slate-700/80 ${cardBg}`}>
      <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-orange-400" : "text-slate-400"}`}>{label}</p>
      <p className="mt-1 text-base sm:text-lg font-black leading-tight" style={{ color: isDark ? "#FFFFFF" : valueColor }}>
        {value}
      </p>
    </div>
  );
}

function TopKolInfoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm ${className}`.trim()}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-3 text-orange-400/90">{title}</p>
      <div className="text-sm text-slate-200 font-medium leading-relaxed">{children}</div>
    </section>
  );
}

function getPlatformIcon(platform: string) {
  const normalized = platform.toLowerCase();
  if (normalized.includes("youtube")) return <Video size={12} />;
  if (normalized.includes("tiktok")) return <Music2 size={12} />;
  if (normalized.includes("facebook")) return <MessageSquare size={12} />;
  if (normalized.includes("instagram")) return <Camera size={12} />;
  return <Globe size={12} />;
}

// --- MODAL: INVITATION ---
function InvitationModal({ koc, campaigns, onClose }: { koc: any; campaigns: Campaign[]; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    campaignId: campaigns[0]?.id || "",
    note: `Chào ${koc.name}, mình thấy profile của bạn rất phù hợp với chiến dịch của bên mình. Hy vọng được hợp tác cùng bạn!`,
    offeredPrice: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.campaignId) return alert("Vui lòng chọn một chiến dịch.");
    setLoading(true);
    try {
      await createBooking({
        campaignId: Number(data.campaignId),
        kocId: koc.id,
        direction: "marketer_invited",
        offeredPrice: Number(data.offeredPrice) || 0,
        note: data.note,
        status: 'pending'
      });
      alert("Đã gửi lời mời thành công!");
      onClose();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="create-campaign-modal max-w-xl rounded-[32px] p-0 overflow-hidden shadow-2xl border-none max-h-[90vh] flex flex-col">
        <div className="bg-primary p-8 text-white shrink-0">
          <DialogTitle className="text-2xl font-bold">Mời hợp tác</DialogTitle>
          <DialogDescription className="text-orange-100 opacity-90">Gửi lời mời trực tiếp đến KOC {koc.name}</DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="create-campaign-modal-body p-8 space-y-6 bg-transparent overflow-y-auto flex-1">
           <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Chọn chiến dịch</label>
             <select 
               className="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 text-sm focus:ring-primary"
               value={data.campaignId}
               onChange={e => setData({...data, campaignId: e.target.value})}
               required
             >
               <option value="">-- Chọn chiến dịch đang mở --</option>
               {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Báo giá đề xuất (Để trống nếu muốn thỏa thuận sau)</label>
              <Input type="text" placeholder="VD: 2.000.000" value={formatThousands(data.offeredPrice)} onChange={e => setData({...data, offeredPrice: String(parseThousands(e.target.value))})} />
           </div>
           <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Lời nhắn</label>
             <Textarea rows={4} value={data.note} onChange={e => setData({...data, note: e.target.value})} placeholder="Viết vài câu chào hỏi..." required />
           </div>
           <DialogFooter className="pt-4">
              <Button type="button" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12 rounded-xl" onClick={onClose}>Hủy</Button>
              <Button type="submit" className="create-campaign-submit flex-1 h-12 rounded-xl font-bold shadow-lg" disabled={loading}>
                {loading ? "Đang gửi..." : "Xác nhận gửi lời mời"}
              </Button>
           </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN PAGE ---
export function TopKOLsPage() {
  const { user, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabMode>("discovery");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKolId, setSelectedKolId] = useState<number | null>(null);
  const [runtimeProfiles, setRuntimeProfiles] = useState<KocProfile[]>([]);
  const [shortlistIds, setShortlistIds] = useState<number[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [invitingKol, setInvitingKol] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const isMarketer = user?.role === "marketer" || user?.role === "admin";

  const fetchData = async () => {
    setLoading(true);
    setProfileError("");
    try {
      const marketerFlag = user?.role === "marketer" || user?.role === "admin";
      
      // 1. Load profiles (Critical)
      const profilesRes = await listKocProfiles({ sort: "engagement_desc" });
      const profilesItems = profilesRes?.items || [];
      setRuntimeProfiles(profilesItems);

      // 2. Load optional data (Shortlist and Campaigns)
      if (marketerFlag) {
        try {
          const [shortlistRes, campaignsRes] = await Promise.all([
            getMyShortlist().catch(err => { console.error("Shortlist load failed:", err); return { items: [] }; }),
            listCampaigns({ status: 'open' }).catch(err => { console.error("Campaigns load failed:", err); return { items: [] }; })
          ]);

          const sIds = (shortlistRes?.items || []).map((i: any) => {
             const id = i.koc_id || i.user_id;
             return id ? Number(id) : null;
          }).filter((id): id is number => id !== null);
          
          setShortlistIds(sIds);
          setMyCampaigns(campaignsRes?.items || []);
        } catch (optionalErr) {
          console.error("Optional data processing failed:", optionalErr);
        }
      }
    } catch (error) {
      console.error("CRITICAL: fetchData failed:", error);
      setProfileError("Không thể tải danh sách KOLs. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isBootstrapping) {
      fetchData();
    }
  }, [isMarketer, isBootstrapping]);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".public-dark-page .cp-reveal"));
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [loading, activeTab, viewMode]);

  const topKOLs = useMemo((): TopKolItem[] => {
    const profiles = runtimeProfiles || [];
    const baseList: TopKolItem[] = profiles.map((profile, index) => {
        const categoryId = mapCategoryIdFromProfile(profile);
        const category = categoryPresets.find((item) => item.id === categoryId)?.name || "Lifestyle & Food";
        const name = profile.displayName?.trim() || profile.fullName || "KOL";
        const matchedRealKol = getMatchedRealKolByName(name);
        
        const followersNum = profile.followers > 0 ? profile.followers : 2200000 - index * 55000;
        const engagementNum = profile.engagementRate > 0 ? Number(profile.engagementRate.toFixed(1)) : Number((13.5 - (index % 6) * 0.7).toFixed(1));
        const avgViewsNum = Math.round(followersNum * 0.18);
        const platforms = profile.platform ? profile.platform.split(/[,+/]/).map(v => v.trim()).filter(Boolean) : ["TikTok"];

        return {
          id: Number(profile.userId),
          categoryId,
          name,
          category,
          plan: profile.plan ?? "free",
          avatar: profile.avatarUrl ? (profile.avatarUrl.startsWith("http") ? profile.avatarUrl : `${API_BASE_URL}${profile.avatarUrl}`) : buildInitialAvatar(name),
          followers: formatFollowers(followersNum),
          followersNum,
          engagementNum,
          engagementRate: `${engagementNum}%`,
          avgViews: avgViewsNum >= 1000000 ? `${(avgViewsNum / 1000000).toFixed(1)}M` : `${Math.round(avgViewsNum / 1000)}K`,
          avgViewsNum,
          collaborations: 60 + (index % 10) * 12,
          rating: Number((4.6 + (index % 5) * 0.08).toFixed(1)),
          verified: Boolean(profile.verified),
          topRank: index + 1,
          growth: `+${(8 + (index % 9) * 1.3).toFixed(1)}%`,
          platforms,
          responseTime: `${1 + (index % 4)}-${3 + (index % 4)} giờ`,
          completionRate: `${92 + (index % 5) * 2}%`,
          bio: profile.bio || bioByCategory[matchedRealKol?.category || "lifestyle_food"] || "Nội dung chất lượng cao.",
          location: profile.location || ["Hà Nội", "TP.HCM", "Đà Nẵng"][index % 3],
          languages: ["Tiếng Việt", "English"],
          services: ["Review sản phẩm", "Video ngắn", "Livestream"],
          recentBrands: ["Anker", "Maybelline", "Shopee", "Grab", "Samsung"].slice(index % 2, index % 2 + 3),
          avatarObjectPosition: matchedRealKol ? avatarObjectPositionById[matchedRealKol.id] || "center" : "center",
        };
    });

    let finalList = [...baseList];
    if (finalList.length < 15) {
      const existingNames = new Set(finalList.map(item => normalizePersonName(item.name)));
      const fallbackKols = REAL_KOLS.filter(
        (kol) => !existingNames.has(normalizePersonName(kol.name))
      );
      
      const neededCount = 15 - finalList.length;
      const padItems = fallbackKols.slice(0, neededCount).map((item, idx): TopKolItem => {
        const index = finalList.length + idx;
        const followersNum = 2200000 - index * 55000;
        const engagementNum = Number((13.5 - (index % 6) * 0.7).toFixed(1));
        const avgViewsNum = Math.round(followersNum * 0.18);
        return {
          id: item.id,
          categoryId: categoryIdByType[item.category],
          name: item.name,
          category: REAL_KOL_CATEGORY_LABEL[item.category],
          avatar: buildInitialAvatar(item.name),
          followers: formatFollowers(followersNum),
          followersNum,
          engagementNum,
          engagementRate: `${engagementNum}%`,
          avgViews: avgViewsNum >= 1000000 ? `${(avgViewsNum / 1000000).toFixed(1)}M` : `${Math.round(avgViewsNum / 1000)}K`,
          avgViewsNum,
          collaborations: 60 + (index % 10) * 12,
          rating: Number((4.6 + (index % 5) * 0.08).toFixed(1)),
          verified: true,
          plan: "free",
          topRank: index + 1,
          growth: `+${(8 + (index % 9) * 1.3).toFixed(1)}%`,
          platforms: platformsByCategory[item.category] || ["TikTok"],
          responseTime: `${1 + (index % 4)}-${3 + (index % 4)} giờ`,
          completionRate: `${92 + (index % 5) * 2}%`,
          bio: bioByCategory[item.category],
          location: ["Hà Nội", "TP.HCM", "Đà Nẵng"][index % 3],
          languages: ["Tiếng Việt", "English"],
          services: ["Review sản phẩm", "Video ngắn", "Livestream"],
          recentBrands: ["Anker", "Maybelline", "Shopee", "Grab", "Samsung"].slice(index % 2, index % 2 + 3),
          avatarObjectPosition: avatarObjectPositionById[item.id] || "center",
        };
      });
      finalList = [...finalList, ...padItems];
    }

    return finalList.slice(0, 15);
  }, [runtimeProfiles]);

  const filteredKols = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = topKOLs;
    
    if (activeTab === "shortlist") {
      list = list.filter(k => shortlistIds.includes(Number(k.id)));
    }

    return list.filter((kol) => {
      if (!matchesTopKolCategory(kol, selectedCategory)) return false;
      if (!q) return true;
      return `${kol.name} ${kol.category} ${kol.platforms.join(" ")}`.toLowerCase().includes(q);
    });
  }, [topKOLs, searchQuery, selectedCategory, activeTab, shortlistIds]);

  const categories = useMemo(() =>
      categoryPresets.map((category) => ({
        ...category,
        count: category.id === "all" ? topKOLs.length : topKOLs.filter((kol) => matchesTopKolCategory(kol, category.id)).length,
      })),
    [topKOLs]
  );

  const selectedKol = useMemo(
    () => (selectedKolId ? topKOLs.find((kol) => Number(kol.id) === Number(selectedKolId)) ?? null : null),
    [selectedKolId, topKOLs]
  );

  const handleToggleShortlist = async (e: React.MouseEvent, kocId: number) => {
    e.stopPropagation();
    if (!isMarketer) return navigate("/login?role=marketer");
    const targetId = Number(kocId);
    try {
      const res = await toggleShortlist(targetId);
      if (res.status === 'added') {
        setShortlistIds(prev => Array.from(new Set([...prev, targetId])));
      } else {
        setShortlistIds(prev => prev.filter(id => Number(id) !== targetId));
      }
    } catch (error) {
      alert("Lỗi khi cập nhật danh sách yêu thích.");
    }
  };

  return (
    <div className="public-dark-page">
      <PublicHeader theme="dark" />

      <section className="public-dark-section container mx-auto px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="cp-reveal mx-auto mb-10 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-full mb-6 border border-blue-100">
            <Award size={16} />
            <span className="text-sm font-bold uppercase tracking-wider">Top KOLs Ecosystem</span>
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight text-white md:text-6xl">
            Khám phá <span className="text-primary">Creators</span> hàng đầu
          </h1>
          <div className="mb-8 flex justify-center">
             <div className="flex rounded-full border border-white/15 bg-white/[0.075] p-1.5 shadow-inner shadow-white/5">
                <button 
                  onClick={() => setActiveTab("discovery")}
                  className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all sm:px-8 ${activeTab === "discovery" ? "bg-primary text-white shadow-lg" : "border border-white/10 text-slate-300 hover:text-white"}`}
                >
                  <Search size={18} /> Khám phá
                </button>
                <button 
                   onClick={() => setActiveTab("shortlist")}
                   className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all sm:px-8 ${activeTab === "shortlist" ? "bg-primary text-white shadow-lg" : "border border-white/10 text-slate-300 hover:text-white"}`}
                >
                  <Heart size={18} fill={activeTab === "shortlist" ? "white" : "none"} /> Đã lưu ({shortlistIds.length})
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Top Products Section */}
      <section className="public-section-teal px-4 py-16 sm:px-6 lg:px-8">
        <div className="container mx-auto">
        <div className="cp-reveal mb-10 flex items-center justify-between">
           <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Trophy className="text-amber-500" size={32} />
            Sản phẩm được chọn nhiều nhất
          </h2>
        </div>

        <div className="cp-stagger grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {topProducts.map((product) => (
            <div
              key={product.id}
              className="cp-reveal group overflow-hidden rounded-[28px] border border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative aspect-[4/3]">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 px-4 py-1.5 bg-primary text-white rounded-full text-xs font-black shadow-lg">
                  Top #{product.id}
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 bg-blue-50 text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                  {product.category}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mb-4 line-clamp-1">{product.name}</h3>
 
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter">KOLs sử dụng</span>
                    <span className="font-extrabold text-primary">{product.kolsUsed}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Đánh giá TB</span>
                    <div className="flex items-center gap-1">
                      <Star className="text-amber-400 fill-amber-400" size={14} />
                      <span className="font-extrabold text-slate-900">{product.avgRating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="cp-reveal mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <TrendingUp className="text-primary" size={32} />
            {activeTab === "discovery" ? "Bảng xếp hạng KOLs" : "Danh sách bạn quan tâm"}
          </h2>
 
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên KOL..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
              />
            </div>
            <div className="flex rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
              <button onClick={() => setViewMode("grid")} className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-900"}`}>Grid</button>
              <button onClick={() => setViewMode("table")} className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${viewMode === "table" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-900"}`}>Table</button>
            </div>
          </div>
        </div>
 
        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
                selectedCategory === cat.id
                  ? "bg-primary border-primary text-white shadow-lg"
                  : "bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
 
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-12 h-12 border-4 border-blue-100 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-slate-500 font-bold">Đang tải danh sách Creators...</p>
          </div>
        ) : profileError ? (
          <div className="bg-red-50 border border-red-100 text-red-700 p-8 rounded-[32px] text-center">
             <p className="text-lg font-bold mb-2">Ối! Đã có lỗi xảy ra</p>
             <p className="mb-6">{profileError}</p>
             <button onClick={fetchData} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">Thử lại</button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="cp-stagger grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredKols.map((kol) => (
              <div key={kol.id} className="cp-reveal group relative overflow-hidden rounded-[28px] border border-slate-100 bg-white transition-all duration-300 hover:shadow-2xl">
                <button 
                  onClick={(e) => handleToggleShortlist(e, kol.id)}
                  className={`absolute top-6 right-6 z-10 p-3 rounded-full backdrop-blur-md transition-all ${shortlistIds.includes(kol.id) ? 'bg-rose-500 text-white' : 'bg-white/30 text-white hover:bg-white/50'}`}
                >
                  <Heart size={20} fill={shortlistIds.includes(kol.id) ? "white" : "none"} />
                </button>

                <div className="relative h-28 bg-primary">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black/20" />
                   <div className="absolute top-4 left-6 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                    Rank #{kol.topRank}
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[-56px] transition-transform duration-300 group-hover:scale-105">
                    <TopKolAvatar src={kol.avatar} alt={kol.name} objectPosition={kol.avatarObjectPosition} size={112} />
                  </div>
                </div>
 
                <div className="px-8 pt-20 pb-8">
                  <div className="text-center mb-8">
                    <div className="mb-2 flex items-center justify-center gap-2">
                       <h3 className="font-extrabold text-xl text-slate-900 leading-tight">{kol.name}</h3>
                       {kol.verified && <Check size={14} className="p-0.5 bg-blue-500 text-white rounded-full" />}
                       {kol.plan === "plus" && (
                         <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-800 border border-amber-200">
                           Plus
                         </span>
                       )}
                    </div>
                    <span className="inline-block px-4 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100">
                      {kol.category}
                    </span>
                  </div>
 
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="rounded-[20px] bg-slate-50/50 p-4 border border-slate-100">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Followers</p>
                       <div className="flex items-center justify-between">
                         <span className="font-black text-slate-900">{kol.followers}</span>
                         <span className="text-[10px] font-bold text-emerald-500">{kol.growth}</span>
                       </div>
                    </div>
                    <div className="rounded-[20px] bg-slate-50/50 p-4 border border-slate-100">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tương tác</p>
                       <span className="font-black text-emerald-600">{kol.engagementRate}</span>
                    </div>
                    <div className="rounded-[20px] bg-slate-50/50 p-4 border border-slate-100">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Lượt xem TB</p>
                       <span className="font-black text-slate-900">{kol.avgViews}</span>
                    </div>
                    <div className="rounded-[20px] bg-slate-50/50 p-4 border border-slate-100">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Hoàn thành</p>
                       <span className="font-black text-primary">{kol.completionRate}</span>
                    </div>
                  </div>
 
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                       <Star className="text-amber-400 fill-amber-400" size={18} />
                       <span className="font-black text-slate-900">{kol.rating}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">({kol.collaborations})</span>
                    </div>
                    <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => setSelectedKolId(kol.id)}
                         className="px-5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-900 text-xs font-black uppercase tracking-widest hover:border-primary hover:bg-slate-50 hover:text-primary transition-all shadow-sm"
                       >
                         Chi tiết
                       </button>
                       {isMarketer && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); setInvitingKol(kol); }}
                            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover transition-all shadow-lg shadow-primary/10"
                         >
                           <Plus size={20} />
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredKols.length === 0 && <div className="col-span-full py-20 text-center text-slate-400">Không tìm thấy KOC phù hợp.</div>}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[32px] border border-slate-100 bg-white shadow-sm">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 font-black text-[10px] uppercase text-slate-400">
                   <tr>
                      <th className="px-8 py-5">#</th>
                      <th className="px-8 py-5">KOL</th>
                      <th className="px-8 py-5">Followers</th>
                      <th className="px-8 py-5">Engagement</th>
                      <th className="px-8 py-5">Hoàn thành</th>
                      <th className="px-8 py-5">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredKols.map(kol => (
                     <tr key={kol.id} className="group hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedKolId(kol.id)}>
                        <td className="px-8 py-5 font-black text-slate-300">#{kol.topRank}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <TopKolAvatar src={kol.avatar} alt={kol.name} objectPosition={kol.avatarObjectPosition} size={40} bordered={false} elevated={false} />
                            <div><p className="font-bold text-slate-900">{kol.name}</p><p className="text-[10px] text-slate-400">{kol.category}</p></div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-900">{kol.followers}</p>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase">{kol.growth}</p>
                        </td>
                        <td className="px-8 py-5 font-black text-emerald-600">{kol.engagementRate}</td>
                        <td className="px-8 py-5 font-black text-primary">{kol.completionRate}</td>
                        <td className="px-8 py-5">
                           <div className="flex gap-2">
                             <button onClick={(e) => { e.stopPropagation(); setSelectedKolId(kol.id); }} className="text-primary hover:underline font-bold text-xs uppercase tracking-widest">Detail</button>
                             {isMarketer && <button onClick={(e) => { e.stopPropagation(); setInvitingKol(kol); }} className="text-primary"><Plus size={20}/></button>}
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selectedKol && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedKolId(null)} />
          <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800/85 rounded-[40px] shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="absolute top-6 right-6 z-10">
                <button onClick={() => setSelectedKolId(null)} className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all border border-slate-800 shadow-md">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[90vh] overflow-y-auto">
                <div className="relative h-56 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/40 border-b border-slate-900">
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
                   <div className="absolute top-[-50px] right-[-50px] w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                   
                   <div className="absolute left-10 bottom-[-32px] flex items-end gap-6 z-10">
                      <div className="rounded-full bg-slate-950 p-1 border border-slate-800 shadow-2xl">
                        <TopKolAvatar src={selectedKol.avatar} alt={selectedKol.name} objectPosition={selectedKol.avatarObjectPosition} size={130} className="border-4 border-slate-950" bordered={false} elevated={false} />
                      </div>
                      <div className="pb-6">
                        <div className="flex items-center gap-3 mb-1.5">
                          <h2 className="text-3xl font-black text-white tracking-tight leading-none">{selectedKol.name}</h2>
                          {selectedKol.verified && <Check size={18} className="p-0.5 bg-blue-500 text-white rounded-full shadow-lg" />}
                        </div>
                        <p className="text-primary-light text-orange-400 font-extrabold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                          <span>{selectedKol.category}</span>
                          <span className="text-slate-600">•</span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">Top #{selectedKol.topRank}</span>
                        </p>
                      </div>
                   </div>
                </div>

                <div className="px-10 pt-16 pb-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                       <TopKolInfoCard title="Giới thiệu">
                          <p className="text-base leading-relaxed italic text-slate-350 font-medium">"{selectedKol.bio}"</p>
                       </TopKolInfoCard>

                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <TopKolKpiCard label="Followers" value={selectedKol.followers} tone="dark" />
                          <TopKolKpiCard label="Tương tác" value={selectedKol.engagementRate} tone="green" />
                          <TopKolKpiCard label="Hợp tác" value={String(selectedKol.collaborations)} tone="purple" />
                          <TopKolKpiCard label="Phản hồi" value={selectedKol.responseTime} />
                          <TopKolKpiCard label="Hoàn thành" value={selectedKol.completionRate} tone="green" />
                          <TopKolKpiCard label="Xếp hạng" value={`#${selectedKol.topRank}`} tone="blue" />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <TopKolInfoCard title="Khu vực">
                          <p className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                            {selectedKol.location}
                          </p>
                       </TopKolInfoCard>

                       <TopKolInfoCard title="Nền tảng chính">
                          <div className="flex flex-wrap gap-2.5">
                             {selectedKol.platforms.map(p => (
                               <div key={p} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl hover:border-primary/50 transition-all duration-300">
                                  {getPlatformIcon(p)}
                                  <span className="text-xs font-bold">{p}</span>
                               </div>
                             ))}
                          </div>
                       </TopKolInfoCard>

                       {selectedKol.services && selectedKol.services.length > 0 && (
                         <TopKolInfoCard title="Dịch vụ">
                            <div className="flex flex-wrap gap-2">
                               {selectedKol.services.map((service: string) => (
                                 <span key={service} className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg font-bold">
                                   {service}
                                 </span>
                               ))}
                            </div>
                         </TopKolInfoCard>
                       )}

                       {selectedKol.recentBrands && selectedKol.recentBrands.length > 0 && (
                         <TopKolInfoCard title="Nhãn hàng hợp tác gần đây">
                            <div className="flex flex-wrap gap-2">
                               {selectedKol.recentBrands.map((brand: string) => (
                                 <span key={brand} className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg font-semibold border-dashed">
                                   {brand}
                                 </span>
                               ))}
                            </div>
                         </TopKolInfoCard>
                       )}
                    </div>
                  </div>

                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-between p-8 bg-gradient-to-r from-slate-900 to-slate-900/40 rounded-[32px] border border-slate-800/80 shadow-2xl relative overflow-hidden">
                     <div className="absolute right-0 top-0 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                     <div className="mb-6 sm:mb-0 text-center sm:text-left z-10">
                        <p className="text-xs font-black text-primary uppercase tracking-widest mb-1.5">Bắt đầu chiến dịch</p>
                        <p className="text-slate-400 text-sm font-medium">Làm việc cùng {selectedKol.name} ngay hôm nay để tối ưu hóa ROI của bạn.</p>
                     </div>
                     <div className="z-10 w-full sm:w-auto flex justify-center">
                       {isMarketer ? (
                         <button
                            onClick={() => { setSelectedKolId(null); setInvitingKol(selectedKol); }}
                            className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-hover hover:scale-102 hover:shadow-[0_0_20px_rgba(255,51,0,0.3)] transition-all duration-300 shadow-xl shadow-primary/10"
                          >
                            Mời hợp tác
                          </button>
                       ) : (
                          <Link to="/login?role=marketer" className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-hover hover:scale-102 hover:shadow-[0_0_20px_rgba(255,51,0,0.3)] transition-all duration-300 shadow-xl shadow-primary/10 text-center">Mời hợp tác</Link>
                       )}
                     </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {invitingKol && <InvitationModal koc={invitingKol} campaigns={myCampaigns} onClose={() => setInvitingKol(null)} />}

      <PublicFooter />
    </div>
  );
}
