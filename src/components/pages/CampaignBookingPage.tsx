import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router";
import { DashboardLayout } from "../layouts/DashboardLayout";
import {
  Sparkles,
  Search,
  TrendingUp,
  BarChart3,
  Star,
  Users,
  CheckCircle,
  Heart,
  SlidersHorizontal,
  Clock3,
  X,
  Video,
  Radio,
  PackageSearch,
  Globe,
  Camera,
  Music2,
  MessageSquareMore,
} from "lucide-react";
import { ApiError, API_BASE_URL } from "../../services/api";
import { listKocProfiles, type KocProfile } from "../../services/profileService";
import { createBooking, listBookings, type Booking } from "../../services/bookingService";
import { listCampaigns, type Campaign } from "../../services/campaignService";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { kocOverrides } from "../../data/kocOverrides";
import { REAL_KOLS, REAL_KOL_CATEGORY_LABEL, type RealKol } from "../../data/realKols";
import { toggleShortlist, getMyShortlist } from "../../services/shortlistService";

const platforms = ["Instagram", "TikTok", "YouTube", "Facebook"];
const PRICE_OVERRIDE_STORAGE_KEY = "koc_price_overrides_vnd";
const categoryPresets = [
  { id: "all", name: "Tất cả" },
  { id: "favorites", name: "Đã lưu ❤️" },
  { id: "invited", name: "Đã mời ✉️" },
  { id: "tech", name: "Công nghệ" },
  { id: "fashion_beauty", name: "Thời trang & Làm đẹp" },
  { id: "travel", name: "Du lịch" },
  { id: "lifestyle_food", name: "Lifestyle & Food" },
  { id: "tiktok", name: "TikTok Creators" },
] as const;
type CategoryPresetId = (typeof categoryPresets)[number]["id"];
const platformsByRealKolCategory: Record<RealKol["category"], string[]> = {
  technology: ["YouTube", "TikTok", "Facebook"],
  fashion_beauty: ["Instagram", "TikTok", "YouTube"],
  travel: ["YouTube", "TikTok", "Instagram"],
  lifestyle_food: ["TikTok", "YouTube", "Instagram"],
  tiktok: ["TikTok", "Instagram"],
};
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

function mapQueryCategoryToPreset(rawCategory: string | null): CategoryPresetId {
  if (!rawCategory) return "all";
  const normalized = normalizeText(rawCategory);
  if (!normalized) return "all";

  if (normalized.includes("yeu thich") || normalized.includes("da luu") || normalized.includes("favorite")) return "favorites";
  if (normalized.includes("da moi") || normalized.includes("invited")) return "invited";
  if (normalized.includes("cong nghe") || normalized.includes("tech")) return "tech";
  if (normalized.includes("thoi trang") || normalized.includes("fashion") || normalized.includes("lam dep") || normalized.includes("beauty")) return "fashion_beauty";
  if (normalized.includes("du lich") || normalized.includes("travel")) return "travel";
  if (normalized.includes("am thuc") || normalized.includes("food") || normalized.includes("phong cach song") || normalized.includes("lifestyle")) return "lifestyle_food";
  if (normalized.includes("tiktok")) return "tiktok";
  return "all";
}

function matchesPreset(kocCategories: string[], kocPlatforms: string[], selectedPreset: CategoryPresetId) {
  if (selectedPreset === "all") return true;
  const normalizedCategories = kocCategories.map(normalizeText);
  const normalizedPlatforms = kocPlatforms.map(normalizeText);

  if (selectedPreset === "tech") {
    return normalizedCategories.some((category) => category.includes("cong nghe") || category.includes("tech"));
  }

  if (selectedPreset === "fashion_beauty") {
    return normalizedCategories.some((category) =>
      category.includes("thoi trang") || category.includes("fashion") || category.includes("lam dep") || category.includes("beauty")
    );
  }

  if (selectedPreset === "travel") {
    return normalizedCategories.some((category) => category.includes("du lich") || category.includes("travel"));
  }

  if (selectedPreset === "lifestyle_food") {
    return normalizedCategories.some((category) =>
      category.includes("phong cach song") || category.includes("lifestyle") || category.includes("am thuc") || category.includes("food")
    );
  }

  return normalizedPlatforms.some((platform) => platform.includes("tiktok"));
}

const parseK = (value: string) => {
  const cleaned = value.toUpperCase().replace(/\s/g, "");
  if (cleaned.endsWith("K")) return parseFloat(cleaned.replace("K", "")) * 1000;
  if (cleaned.endsWith("M")) return parseFloat(cleaned.replace("M", "")) * 1000000;
  return parseFloat(cleaned) || 0;
};

const parseMoney = (value: string) => {
  const cleaned = value.toUpperCase().replace(/\s/g, "").replace(/VNĐ|VND/g, "");
  if (cleaned.endsWith("M")) return (parseFloat(cleaned.replace("M", "")) || 0) * 1_000_000;
  if (cleaned.endsWith("K")) return (parseFloat(cleaned.replace("K", "")) || 0) * 1_000;
  return Number(cleaned.replace(/[^\d]/g, "")) || 0;
};

const formatMoneyInput = (value: string) => {
  const cleaned = value.replace(/[^\d]/g, "");
  if (!cleaned) return "";
  return new Intl.NumberFormat("vi-VN").format(Number(cleaned));
};

const parsePriceRange = (price: string) => {
  const [minRaw, maxRaw] = price.split("-");
  const min = parseMoney(minRaw || "0");
  const max = parseMoney(maxRaw || minRaw || "0");
  return { min, max: max || min };
};

const formatFollowers = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
};

const formatCurrencyVnd = (value: number) => {
  const rounded = Math.max(0, Math.round(value || 0));
  if (rounded <= 0) return "Liên hệ";
  return `${new Intl.NumberFormat("vi-VN").format(rounded)} VNĐ`;
};

function getTopKolMetricsById(id: number) {
  const normalizedId = id === 1 ? 2 : id;
  const index = Math.max(0, normalizedId - 1);
  const followersNum = Math.max(120000, 2200000 - index * 55000);
  const engagementNum = Number((13.5 - (index % 6) * 0.7).toFixed(1));
  const avgViewsNum = Math.round(followersNum * 0.18);
  return {
    followersNum,
    engagementRate: `${engagementNum}%`,
    avgViews: avgViewsNum >= 1000000 ? `${(avgViewsNum / 1000000).toFixed(1)}M` : `${Math.round(avgViewsNum / 1000)}K`,
    price: "Liên hệ",
  };
}

type KocInsights = {
  growth: string;
  collaborations: number;
  rating: number;
  responseTime: string;
  completionRate: string;
  audience: string;
  location: string;
  languages: string[];
  services: string[];
  recentBrands: string[];
};

function getTopKolInsightsById(id: number): KocInsights {
  const normalizedId = id === 1 ? 2 : id;
  const index = Math.max(0, normalizedId - 1);
  return {
    growth: `+${(8 + (index % 9) * 1.3).toFixed(1)}%`,
    collaborations: 60 + (index % 10) * 12,
    rating: Number((4.6 + (index % 5) * 0.08).toFixed(1)),
    responseTime: `${1 + (index % 4)}-${3 + (index % 4)} giờ`,
    completionRate: `${92 + (index % 5) * 2}%`,
    audience: `${18 + (index % 4) * 4}-${34 + (index % 3) * 2} tuổi • VN`,
    location: ["Hà Nội", "TP.HCM", "Đà Nẵng"][index % 3],
    languages: ["Tiếng Việt", "English"],
    services: ["Review sản phẩm", "Video ngắn", "Livestream"],
    recentBrands: ["Anker", "Maybelline", "Shopee", "Grab", "Samsung"].slice(index % 2, index % 2 + 3),
  };
}

type KocCard = {
  id: number;
  userId: number;
  name: string;
  avatar: string;
  followers: string;
  followersNum: number;
  engagementRate: string;
  categories: string[];
  avgViews: string;
  price: string;
  verified: boolean;
  bio: string;
  platforms: string[];
  growth: string;
  collaborations: number;
  rating: number;
  responseTime: string;
  completionRate: string;
  audience: string;
  location: string;
  languages: string[];
  services: string[];
  recentBrands: string[];
};

function mapProfileToCard(item: KocProfile): KocCard {
  const override = kocOverrides[item.userId] || {};
  const name = item.displayName?.trim() || override.name || item.fullName || `KOC ${item.userId}`;
  const matchedRealKol = getMatchedRealKolByName(name);
  const niche = item.niche || "Khác";
  const platform = item.platform || "Khác";
  const metrics = getTopKolMetricsById(item.userId);
  const insights = getTopKolInsightsById(item.userId);
  const followersNum = item.followers > 0 ? item.followers : metrics.followersNum;
  const engagementRate = item.engagementRate > 0 ? `${Number(item.engagementRate.toFixed(1))}%` : metrics.engagementRate;
  const avgViewsNum = Math.round(followersNum * 0.18);
  const price = item.servicePrice > 0 ? formatCurrencyVnd(item.servicePrice) : "Liên hệ";
  const parsedPlatforms = platform.split(/[,+/]/).map((value) => value.trim()).filter(Boolean);
  const platforms = matchedRealKol
    ? Array.from(new Set([...parsedPlatforms, ...platformsByRealKolCategory[matchedRealKol.category]]))
    : parsedPlatforms;

  return {
    id: item.id,
    userId: item.userId,
    name,
    avatar: item.avatarUrl ? (item.avatarUrl.startsWith("http") ? item.avatarUrl : `${API_BASE_URL}${item.avatarUrl}`) : (override.avatar || buildInitialAvatar(name)),
    followers: formatFollowers(followersNum),
    followersNum,
    engagementRate,
    categories: [niche],
    avgViews: avgViewsNum >= 1000000 ? `${(avgViewsNum / 1000000).toFixed(1)}M` : `${Math.round(avgViewsNum / 1000)}K`,
    price,
    verified: Boolean(item.verified),
    bio: item.bio || `${niche} Creator`,
    platforms,
    growth: insights.growth,
    collaborations: insights.collaborations,
    rating: insights.rating,
    responseTime: insights.responseTime,
    completionRate: insights.completionRate,
    audience: insights.audience,
    location: item.location || insights.location,
    languages: insights.languages,
    services: insights.services,
    recentBrands: insights.recentBrands,
  };
}

function mapRealKolToFallbackCard(kol: RealKol): KocCard {
  const metrics = getTopKolMetricsById(kol.id);
  const insights = getTopKolInsightsById(kol.id);
  return {
    id: kol.id,
    userId: kol.id,
    name: kol.name,
    avatar: buildInitialAvatar(kol.name),
    followers: formatFollowers(metrics.followersNum),
    followersNum: metrics.followersNum,
    engagementRate: metrics.engagementRate,
    categories: [REAL_KOL_CATEGORY_LABEL[kol.category]],
    avgViews: metrics.avgViews,
    price: "Liên hệ",
    verified: true,
    bio: `${REAL_KOL_CATEGORY_LABEL[kol.category]} Creator`,
    platforms: platformsByRealKolCategory[kol.category],
    growth: insights.growth,
    collaborations: insights.collaborations,
    rating: insights.rating,
    responseTime: insights.responseTime,
    completionRate: insights.completionRate,
    audience: insights.audience,
    location: insights.location,
    languages: insights.languages,
    services: insights.services,
    recentBrands: insights.recentBrands,
  };
}

type KOLProfileHeaderProps = {
  koc: KocCard;
  isShortlisted: boolean;
  onToggleShortlist: (e: React.MouseEvent) => void;
};

type KOLStatsSectionProps = {
  title: string;
  items: Array<{
    label: string;
    value: string;
    tone?: "default" | "blue" | "green" | "purple";
    icon?: React.ReactNode;
  }>;
};

type KOLActionBarProps = {
  canBook: boolean;
  canAdd: boolean;
  isBooking: boolean;
  isBooked: boolean;
  isRebook?: boolean;
  isAdded: boolean;
  onBook: () => void;
  onAddToCampaign: () => void;
};

function statValueTone(tone: "default" | "blue" | "green" | "purple" = "default") {
  if (tone === "blue") return "text-blue-600";
  if (tone === "green") return "text-emerald-700";
  if (tone === "purple") return "text-purple-700";
  return "text-slate-900";
}

function getAvatarObjectPosition(id: number) {
  return avatarObjectPositionById[id] || "center 18%";
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
        <linearGradient id="booking-avatar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#booking-avatar-gradient)" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="54" font-weight="700">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function BookingCapabilityChip({
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
          background: "linear-gradient(180deg, #F2FBF7 0%, #E8F8F0 100%)",
          borderColor: "#A7F3D0",
          color: "#065F46",
          iconBackground: "#FFFFFF",
          iconColor: "#059669",
        }
      : {
          background: "linear-gradient(180deg, #F8FAFF 0%, #EEF2FF 100%)",
          borderColor: "#C7D2FE",
          color: "#312E81",
          iconBackground: "#FFFFFF",
          iconColor: "#4F46E5",
        };

  return (
    <span
      className="inline-flex items-center rounded-full border text-[11px] font-medium sm:text-xs"
      style={{
        columnGap: 6,
        padding: "7px 11px",
        background: colors.background,
        borderColor: colors.borderColor,
        color: colors.color,
      }}
    >
      {icon ? (
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.iconBackground, color: colors.iconColor }}
        >
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

function BookingMetricBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border text-xs font-medium"
      style={{
        padding: "6px 10px",
        backgroundColor: "rgba(255,255,255,0.14)",
        borderColor: "rgba(255,255,255,0.18)",
        color: "white",
      }}
    >
      {children}
    </span>
  );
}

function BookingInfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</h4>
      {children}
    </section>
  );
}

function getServiceIcon(service: string) {
  if (service.toLowerCase().includes("review")) return <PackageSearch size={12} />;
  if (service.toLowerCase().includes("video")) return <Video size={12} />;
  if (service.toLowerCase().includes("live")) return <Radio size={12} />;
  return <Sparkles size={12} />;
}

function getPlatformIcon(platform: string) {
  const normalized = platform.toLowerCase();
  if (normalized.includes("youtube")) return <Video size={12} />;
  if (normalized.includes("tiktok")) return <Music2 size={12} />;
  if (normalized.includes("facebook")) return <MessageSquareMore size={12} />;
  if (normalized.includes("instagram")) return <Camera size={12} />;
  return <Globe size={12} />;
}

function normalizePersonName(value: string) {
  return normalizeText(value).replace(/[()]/g, "").replace(/\s+/g, " ").trim();
}

function getMatchedRealKolByName(name: string) {
  const normalizedName = normalizePersonName(name);
  return REAL_KOLS.find((kol) => {
    const normalizedKolName = normalizePersonName(kol.name);
    return (
      normalizedKolName === normalizedName ||
      normalizedKolName.includes(normalizedName) ||
      normalizedName.includes(normalizedKolName)
    );
  });
}

function KOLProfileHeader({ koc, isShortlisted, onToggleShortlist }: KOLProfileHeaderProps) {
  return (
    <div className="px-4 md:px-5 pt-4">
      <div
        className="relative rounded-2xl border border-slate-200 p-4 text-white"
        style={{ background: "linear-gradient(135deg, #1B1464 0%, #2B2A8F 100%)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="overflow-hidden rounded-full border-2 border-white/60 bg-white/15" style={{ width: 64, height: 64 }}>
              <ImageWithFallback
                src={koc.avatar}
                alt={koc.name}
                className="block"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: getAvatarObjectPosition(koc.userId),
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100">Creator profile</p>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">{koc.name}</h3>
              <p className="text-xs text-blue-100">{koc.categories.join(" • ")}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 items-center">
            <button
              onClick={onToggleShortlist}
              className={`p-2 rounded-full border transition-all ${
                isShortlisted
                  ? "bg-rose-500 text-white border-rose-400/35 shadow-md shadow-rose-500/20"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
              title={isShortlisted ? "Bỏ yêu thích" : "Yêu thích KOC"}
            >
              <Heart size={16} fill={isShortlisted ? "currentColor" : "none"} />
            </button>
            <BookingMetricBadge>Rating {koc.rating}</BookingMetricBadge>
            <BookingMetricBadge>Tăng trưởng {koc.growth}</BookingMetricBadge>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap" style={{ columnGap: 8, rowGap: 8 }}>
          {koc.platforms.map((platform) => (
            <BookingCapabilityChip key={platform} icon={getPlatformIcon(platform)}>
              {platform}
            </BookingCapabilityChip>
          ))}
        </div>
      </div>
    </div>
  );
}

function KOLStatsSection({ title, items }: KOLStatsSectionProps) {
  return (
    <section className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 hover:bg-white transition-colors">
            <div className="flex items-center" style={{ columnGap: 8 }}>
              {item.icon ? <span className="text-slate-500">{item.icon}</span> : null}
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</p>
            </div>
            <p className={`mt-2 text-base md:text-lg font-bold leading-relaxed ${statValueTone(item.tone)}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function KOLPrimaryStats({ koc }: { koc: KocCard }) {
  return (
    <KOLStatsSection
      title="Quy mô / Reach"
      items={[
        { label: "Followers", value: koc.followers, tone: "blue", icon: <Users size={13} /> },
        { label: "Tương tác", value: koc.engagementRate, tone: "green", icon: <Heart size={13} /> },
        { label: "Lượt xem TB", value: koc.avgViews, tone: "default", icon: <TrendingUp size={13} /> },
        { label: "Hợp tác", value: String(koc.collaborations), tone: "purple", icon: <Sparkles size={13} /> },
      ]}
    />
  );
}

function KOLPerformanceStats({ koc }: { koc: KocCard }) {
  return (
    <KOLStatsSection
      title="Hiệu suất"
      items={[
        { label: "Rating", value: String(koc.rating), tone: "default", icon: <Star size={13} /> },
        { label: "Tăng trưởng", value: koc.growth, tone: "green", icon: <BarChart3 size={13} /> },
        { label: "Phản hồi", value: koc.responseTime, tone: "blue", icon: <Clock3 size={13} /> },
        { label: "Hoàn thành", value: koc.completionRate, tone: "green", icon: <CheckCircle size={13} /> },
      ]}
    />
  );
}

function KOLActionBar({ canBook, canAdd, isBooking, isBooked, isRebook, isAdded, onBook, onAddToCampaign }: KOLActionBarProps) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 md:px-5 py-4" style={{ marginTop: 10 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onBook}
          disabled={!canBook}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-semibold hover:from-purple-700 hover:to-blue-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isBooked ? "Đã mời" : isBooking ? "Đang xử lý..." : isRebook ? "Mời lại" : "Book KOL"}
        </button>
        <button
          onClick={onAddToCampaign}
          disabled={!canAdd}
          className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAdded ? "Đã thêm vào chiến dịch" : "Thêm vào chiến dịch"}
        </button>
      </div>
    </div>
  );
}

export function CampaignBookingPage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [selectedPreset, setSelectedPreset] = useState<CategoryPresetId>(mapQueryCategoryToPreset(searchParams.get("category")));
  const [showFilters, setShowFilters] = useState(Boolean(searchParams.get("fromBrief")));
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("engagement_desc");
  const [priceOverrides, setPriceOverrides] = useState<Record<number, string>>({});
  const [kocItems, setKocItems] = useState<KocCard[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(searchParams.get("campaignId") ?? "");
  const [bookingByCampaignAndKoc, setBookingByCampaignAndKoc] = useState<Record<string, Booking>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [invitingKocId, setInvitingKocId] = useState<number | null>(null);
  const [selectedKocId, setSelectedKocId] = useState<number | null>(null);
  const [campaignShortlist, setCampaignShortlist] = useState<Record<string, true>>({});
  const [shortlistIds, setShortlistIds] = useState<number[]>([]);

  const pageSize = 9;
  const [filters, setFilters] = useState({
    priceMin: formatMoneyInput(searchParams.get("priceMin") ?? ""),
    priceMax: formatMoneyInput(searchParams.get("priceMax") ?? ""),
    followersMin: searchParams.get("followersMin") ?? "",
    followersMax: searchParams.get("followersMax") ?? "",
    engagementMin: searchParams.get("engagementMin") ?? "",
    platforms: (searchParams.get("platforms") ?? "").split(",").map((s) => s.trim()).filter(Boolean) as string[],
    verified: searchParams.get("verified") === "1",
  });

  useEffect(() => {
    const raw = localStorage.getItem(PRICE_OVERRIDE_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      const normalized: Record<number, string> = {};
      Object.entries(parsed).forEach(([id, price]) => {
        normalized[Number(id)] = price;
      });
      setPriceOverrides(normalized);
    } catch {
      setPriceOverrides({});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [kocResponse, campaignsResponse, bookingsResponse, shortlistResponse] = await Promise.all([
          listKocProfiles({
            search: searchQuery || undefined,
            niche: selectedPreset === "tech" ? "Công nghệ" : undefined,
            platform: filters.platforms[0] || undefined,
            verified: filters.verified || undefined,
            minFollowers: filters.followersMin ? parseK(filters.followersMin) : undefined,
            maxPrice: filters.priceMax ? parseMoney(filters.priceMax) : undefined,
            sort: sortBy,
          }),
          listCampaigns({}),
          listBookings(),
          getMyShortlist().catch((err) => {
            console.error("Lỗi khi tải danh sách yêu thích:", err);
            return { items: [] };
          }),
        ]);

        if (cancelled) return;

        const apiCards = kocResponse.items.map(mapProfileToCard);
        setKocItems(apiCards.length > 0 ? apiCards : REAL_KOLS.map(mapRealKolToFallbackCard));
        setCampaigns(campaignsResponse.items);
        setShortlistIds((shortlistResponse?.items || []).map((i: any) => Number(i.koc_id)));

        const bookingMap: Record<string, Booking> = {};
        bookingsResponse.items.forEach((item) => {
          const key = `${item.campaignId}_${item.kocId}`;
          if (!bookingMap[key]) bookingMap[key] = item;
        });
        setBookingByCampaignAndKoc(bookingMap);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage("Không thể tải danh sách KOC.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedPreset, filters.platforms, filters.verified, filters.followersMin, filters.priceMax, sortBy]);

  const handlePlatformToggle = (platform: string) => {
    setFilters((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform) ? prev.platforms.filter((p) => p !== platform) : [...prev.platforms, platform],
    }));
  };

  const resetFilters = () => {
    setFilters({ priceMin: "", priceMax: "", followersMin: "", followersMax: "", engagementMin: "", platforms: [], verified: false });
    setSelectedPreset("all");
    setSearchQuery("");
  };

  const filteredKocs = useMemo(() => {
    const filtered = kocItems.filter((koc) => {
      const currentPrice = priceOverrides[koc.id] ?? koc.price;
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const haystack = `${koc.name} ${koc.bio} ${koc.categories.join(" ")}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (selectedPreset === "favorites") {
        if (!shortlistIds.includes(Number(koc.id))) return false;
      } else if (selectedPreset === "invited") {
        if (selectedCampaignId) {
          const key = `${selectedCampaignId}_${koc.id}`;
          if (!bookingByCampaignAndKoc[key]) return false;
        } else {
          const hasAnyBooking = Object.keys(bookingByCampaignAndKoc).some((key) => key.endsWith(`_${koc.id}`));
          if (!hasAnyBooking) return false;
        }
      } else {
        if (!matchesPreset(koc.categories, koc.platforms, selectedPreset)) return false;
      }

      if (filters.platforms.length > 0) {
        const hasAny = filters.platforms.some((p) => koc.platforms.includes(p));
        if (!hasAny) return false;
      }

      if (filters.verified && !koc.verified) return false;

      const followers = koc.followersNum;
      if (filters.followersMin && followers < parseK(filters.followersMin)) return false;
      if (filters.followersMax && followers > parseK(filters.followersMax)) return false;

      const engagement = parseFloat(koc.engagementRate.replace("%", "")) || 0;
      if (filters.engagementMin && engagement < parseFloat(filters.engagementMin)) return false;

      const { min, max } = parsePriceRange(currentPrice);
      if (filters.priceMin && max < parseMoney(filters.priceMin)) return false;
      if (filters.priceMax && min > parseMoney(filters.priceMax)) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "followers_desc") return b.followersNum - a.followersNum;
      if (sortBy === "price_asc") {
        const aPrice = parsePriceRange(priceOverrides[a.id] ?? a.price).min;
        const bPrice = parsePriceRange(priceOverrides[b.id] ?? b.price).min;
        return aPrice - bPrice;
      }
      return parseFloat(b.engagementRate) - parseFloat(a.engagementRate);
    });
  }, [kocItems, searchQuery, selectedPreset, filters, sortBy, priceOverrides]);

  const totalPages = Math.max(1, Math.ceil(filteredKocs.length / pageSize));
  const presetCounts = useMemo(
    () =>
      categoryPresets.map((preset) => ({
        ...preset,
        count:
          preset.id === "all"
            ? kocItems.length
            : preset.id === "favorites"
            ? kocItems.filter((koc) => shortlistIds.includes(Number(koc.id))).length
            : preset.id === "invited"
            ? kocItems.filter((koc) => {
                if (selectedCampaignId) {
                  const key = `${selectedCampaignId}_${koc.id}`;
                  return Boolean(bookingByCampaignAndKoc[key]);
                } else {
                  return Object.keys(bookingByCampaignAndKoc).some((key) => key.endsWith(`_${koc.id}`));
                }
              }).length
            : kocItems.filter((koc) => matchesPreset(koc.categories, koc.platforms, preset.id)).length,
      })),
    [kocItems, shortlistIds, selectedCampaignId, bookingByCampaignAndKoc]
  );
  const pagedKocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredKocs.slice(start, start + pageSize);
  }, [filteredKocs, currentPage]);
  const selectedKoc = useMemo(() => (selectedKocId ? kocItems.find((item) => item.id === selectedKocId) ?? null : null), [kocItems, selectedKocId]);
  const selectedKocBooking = useMemo(() => {
    if (!selectedKoc) return null;
    const key = `${selectedCampaignId || "0"}_${selectedKoc.userId}`;
    return bookingByCampaignAndKoc[key] ?? null;
  }, [bookingByCampaignAndKoc, selectedCampaignId, selectedKoc]);
  const selectedKocShortlisted = useMemo(() => {
    if (!selectedKoc) return false;
    const key = `${selectedCampaignId || "0"}_${selectedKoc.userId}`;
    return Boolean(campaignShortlist[key]);
  }, [campaignShortlist, selectedCampaignId, selectedKoc]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPreset, filters]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Lock background scroll while profile modal is open.
  useEffect(() => {
    if (selectedKoc) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedKoc]);

  const handleInvite = async (koc: KocCard) => {
    setActionMessage("");
    const campaignId = Number(selectedCampaignId);
    if (!campaignId || campaignId <= 0) {
      alert("Vui lòng chọn chiến dịch ở ô phía trên trước khi mời KOC.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActionMessage("Vui lòng chọn chiến dịch trước khi mời KOC.");
      return;
    }

    setInvitingKocId(koc.userId);
    try {
      const currentPrice = priceOverrides[koc.id] ?? koc.price;
      const offeredPrice = parsePriceRange(currentPrice).min;
      const response = await createBooking({
        campaignId,
        kocId: koc.userId,
        direction: "marketer_invited",
        offeredPrice,
      });

      const key = `${response.booking.campaignId}_${response.booking.kocId}`;
      setBookingByCampaignAndKoc((prev) => ({ ...prev, [key]: response.booking }));
      setActionMessage(`Đã gửi lời mời đến ${koc.name}.`);
    } catch (error) {
      console.error("Lỗi API createBooking:", error);
      setActionMessage("Lỗi khi gửi lời mời hợp tác.");
    } finally {
      setInvitingKocId(null);
    }
  };

  const handleAddToCampaign = (koc: KocCard) => {
    setActionMessage("");
    const campaignId = Number(selectedCampaignId);
    if (!campaignId || campaignId <= 0) {
      alert("Vui lòng chọn chiến dịch ở ô phía trên trước khi thêm KOC.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActionMessage("Vui lòng chọn chiến dịch trước khi thêm KOC.");
      return;
    }

    const key = `${campaignId}_${koc.userId}`;
    setCampaignShortlist((prev) => ({ ...prev, [key]: true }));
    setActionMessage(`Đã thêm ${koc.name} vào danh sách chiến dịch.`);
  };

  const handleToggleShortlist = async (e: React.MouseEvent, kocId: number) => {
    e.stopPropagation();
    const targetId = Number(kocId);
    try {
      const res = await toggleShortlist(targetId);
      if (res.status === "added") {
        setShortlistIds((prev) => Array.from(new Set([...prev, targetId])));
        setActionMessage("Đã thêm KOC vào danh sách yêu thích.");
      } else {
        setShortlistIds((prev) => prev.filter((id) => Number(id) !== targetId));
        setActionMessage("Đã xóa KOC khỏi danh sách yêu thích.");
      }
    } catch (error) {
      console.error("Lỗi cập nhật danh sách yêu thích:", error);
      alert("Lỗi khi cập nhật danh sách yêu thích.");
    }
  };

  return (
    <DashboardLayout role="marketer">
      <div className="booking-discovery-page space-y-8">
        <div className="relative isolate overflow-hidden rounded-[32px] border border-white/10 bg-[#050505] px-6 py-8 shadow-2xl shadow-black/30 sm:px-8 lg:px-10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_20%,rgba(255,90,31,0.22),transparent_28rem),radial-gradient(circle_at_88%_4%,rgba(20,184,166,0.16),transparent_30rem),linear-gradient(135deg,#050505_0%,#0b0b0b_54%,#032f2c_130%)]" />
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-200 shadow-lg shadow-orange-500/10">
            <Sparkles size={16} className="text-[#ff6a2a]" />
            Creator Discovery
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-5xl">Khám phá KOCs</h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-slate-300">Tìm influencers phù hợp cho chiến dịch của bạn</p>
        </div>

        {errorMessage && <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">{errorMessage}</div>}
        {actionMessage && <div className="rounded-2xl border border-teal-300/25 bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-100">{actionMessage}</div>}

        <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b]/95 p-5 shadow-2xl shadow-black/25 ring-1 ring-white/[0.03] sm:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-13 w-full rounded-full border border-white/12 bg-[#121212] pl-13 pr-5 text-sm font-medium text-white placeholder:text-slate-500 shadow-inner shadow-black/30 outline-none transition-all hover:border-orange-400/40 focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-500/15"
                placeholder="Tìm kiếm theo tên, danh mục hoặc từ khóa..."
              />
            </div>

            <button onClick={() => setShowFilters(!showFilters)} className="flex h-13 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-6 text-sm font-bold text-slate-100 shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:border-orange-400/45 hover:bg-white/[0.1] hover:text-white focus-visible:ring-4 focus-visible:ring-orange-500/20">
              <SlidersHorizontal size={20} />
              Bộ lọc nâng cao
            </button>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-13 rounded-full border border-white/12 bg-[#121212] px-5 text-sm font-bold text-slate-100 shadow-lg shadow-black/20 outline-none transition-all hover:border-teal-300/45 focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-500/15">
              <option value="engagement_desc">Sắp xếp: Tương tác cao</option>
              <option value="followers_desc">Sắp xếp: Followers cao</option>
              <option value="price_asc">Sắp xếp: Giá thấp trước</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Chọn chiến dịch để mời KOC</label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="h-13 w-full rounded-2xl border border-white/12 bg-[#121212] px-4 text-sm font-semibold text-white outline-none transition-all hover:border-orange-400/40 focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-500/15"
            >
              <option value="">Chưa chọn chiến dịch</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </div>

          {showFilters && (
            <div className="space-y-6 rounded-[24px] border border-white/10 bg-white/[0.035] p-5 shadow-inner shadow-black/20">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-lg">Bộ lọc nâng cao</h3>
                <button onClick={resetFilters} className="text-sm font-bold text-orange-300 hover:text-orange-200">
                  Đặt lại tất cả
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Khoảng giá (VNĐ)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="VD: 3.000.000"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({ ...filters, priceMin: formatMoneyInput(e.target.value) })}
                    className="rounded-2xl border border-white/12 bg-[#101010] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-500/15"
                  />
                  <input
                    type="text"
                    placeholder="VD: 10.000.000"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({ ...filters, priceMax: formatMoneyInput(e.target.value) })}
                    className="rounded-2xl border border-white/12 bg-[#101010] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-500/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số lượng followers</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="VD: 10K"
                    value={filters.followersMin}
                    onChange={(e) => setFilters({ ...filters, followersMin: e.target.value })}
                    className="rounded-2xl border border-white/12 bg-[#101010] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-500/15"
                  />
                  <input
                    type="text"
                    placeholder="VD: 100K"
                    value={filters.followersMax}
                    onChange={(e) => setFilters({ ...filters, followersMax: e.target.value })}
                    className="rounded-2xl border border-white/12 bg-[#101010] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-500/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tỷ lệ tương tác tối thiểu (%)</label>
                <input
                  type="number"
                  placeholder="VD: 5"
                  value={filters.engagementMin}
                  onChange={(e) => setFilters({ ...filters, engagementMin: e.target.value })}
                  className="w-full rounded-2xl border border-white/12 bg-[#101010] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#ff5a1f] focus:ring-4 focus:ring-orange-500/15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nền tảng</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => handlePlatformToggle(platform)}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                        filters.platforms.includes(platform) ? "border-orange-400 bg-orange-500/20 text-orange-100 shadow-lg shadow-orange-500/10" : "border-white/12 bg-white/[0.04] text-slate-300 hover:border-teal-300/40 hover:text-white"
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mb-2 mt-5 flex flex-wrap gap-3">
            {presetCounts.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={`rounded-full border px-5 py-2.5 text-sm font-black transition-all ${
                  selectedPreset === preset.id
                    ? "border-orange-300/70 bg-gradient-to-r from-[#ff4b1f] to-[#ff6a1a] text-white shadow-lg shadow-orange-500/25"
                    : "border-white/12 bg-[#121212] text-slate-300 hover:-translate-y-0.5 hover:border-orange-400/45 hover:text-white"
                }`}
              >
                {preset.name} ({preset.count})
              </button>
            ))}
          </div>
        </div>

        <div className="relative isolate overflow-hidden rounded-[28px] border border-orange-300/20 bg-[#0b0b0b] p-6 text-white shadow-2xl shadow-black/30">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_20%,rgba(255,90,31,0.2),transparent_22rem),radial-gradient(circle_at_88%_30%,rgba(20,184,166,0.13),transparent_24rem),linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))]" />
          <div className="flex items-start gap-4">
            <div className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-full border border-orange-300/30 bg-orange-500/15 text-orange-200 shadow-lg shadow-orange-500/15">
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-black text-white">Đề xuất từ AI</h3>
              <p className="mb-4 max-w-4xl text-sm font-medium leading-relaxed text-slate-300">
                {searchParams.get("fromBrief")
                  ? `Đã áp dụng bộ lọc từ AI Brief. Hiện có ${filteredKocs.length} KOC phù hợp để bạn mời hợp tác.`
                  : 'Dựa trên chiến dịch "Bộ sưu tập thời trang mùa hè", chúng tôi gợi ý các KOC có tương tác cao.'}
              </p>
              <p className="text-xs font-semibold text-teal-200/90">Giá có thể thay đổi vì KOL được phép tự cập nhật trong trang tài khoản.</p>
            </div>
          </div>
        </div>

        {loading && <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-8 text-sm font-medium text-slate-300 shadow-xl shadow-black/25">Đang tải dữ liệu KOC...</div>}

        {!loading && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pagedKocs.map((koc) => {
                const currentPrice = priceOverrides[koc.id] ?? koc.price;
                const bookingKey = `${selectedCampaignId || "0"}_${koc.userId}`;
                const existingBooking = bookingByCampaignAndKoc[bookingKey];
                const isRejectedOrCancelled = existingBooking && (existingBooking.status === "rejected" || existingBooking.status === "cancelled");
                const isDisabled = (!!existingBooking && !isRejectedOrCancelled) || invitingKocId === koc.userId;
                const buttonLabel = (existingBooking && !isRejectedOrCancelled)
                  ? `Đã mời (${
                      existingBooking.status === "pending"
                        ? "Chờ phản hồi"
                        : existingBooking.status === "accepted"
                        ? "Đã chấp nhận"
                        : existingBooking.status === "completed"
                        ? "Hoàn thành"
                        : existingBooking.status
                    })`
                  : invitingKocId === koc.id
                  ? "Đang gửi..."
                  : isRejectedOrCancelled
                  ? "Mời lại"
                  : "Mời hợp tác";

                return (
                  <div key={koc.id} className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0b] shadow-2xl shadow-black/25 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/45 hover:shadow-[0_28px_90px_rgba(0,0,0,0.48),0_0_42px_rgba(255,90,31,0.16)]">
                    <div className="relative h-32 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.24),transparent_12rem),linear-gradient(135deg,#032f2c_0%,#42170b_60%,#ff5a1f_120%)]">
                      <div className="absolute inset-0 bg-black/10" />
                      
                      {existingBooking && (
                        <div className="absolute top-4 left-4 z-10">
                          {existingBooking.status === "pending" && (
                            <span className="rounded-full bg-yellow-500/20 border border-yellow-500/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-yellow-300 backdrop-blur-md">
                              Chờ phản hồi
                            </span>
                          )}
                          {existingBooking.status === "accepted" && (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-300 backdrop-blur-md">
                              Đã chấp nhận
                            </span>
                          )}
                          {existingBooking.status === "rejected" && (
                            <span className="rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-300 backdrop-blur-md">
                              Từ chối
                            </span>
                          )}
                          {existingBooking.status === "cancelled" && (
                            <span className="rounded-full bg-slate-500/20 border border-slate-500/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300 backdrop-blur-md">
                              Đã hủy
                            </span>
                          )}
                          {existingBooking.status === "completed" && (
                            <span className="rounded-full bg-teal-500/20 border border-teal-500/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-teal-300 backdrop-blur-md">
                              Hoàn thành
                            </span>
                          )}
                          {!["pending", "accepted", "rejected", "cancelled", "completed"].includes(existingBooking.status) && (
                            <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-blue-300 backdrop-blur-md">
                              {existingBooking.status}
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={(e) => handleToggleShortlist(e, koc.id)}
                        className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-all border border-white/10 ${
                          shortlistIds.includes(koc.id)
                            ? "bg-rose-500 text-white border-rose-400/30 shadow-lg shadow-rose-500/25"
                            : "bg-black/40 text-slate-300 hover:text-white hover:bg-black/60"
                        }`}
                        title={shortlistIds.includes(koc.id) ? "Bỏ yêu thích" : "Yêu thích KOC"}
                      >
                        <Heart size={14} fill={shortlistIds.includes(koc.id) ? "currentColor" : "none"} />
                      </button>

                      <div className="absolute -bottom-12 left-6">
                        <div className="relative">
                          <ImageWithFallback
                            src={koc.avatar}
                            alt={koc.name}
                            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-2xl shadow-black/40 ring-4 ring-orange-400/20 transition-transform duration-300 group-hover:scale-105"
                            style={{ objectPosition: getAvatarObjectPosition(koc.userId) }}
                          />
                          {koc.verified && (
                            <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0b0b0b] bg-[#14b8a6] shadow-lg shadow-teal-500/25">
                              <CheckCircle className="text-white" size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6 pt-16">
                      <h3 className="mb-2 text-xl font-black leading-tight text-white">{koc.name}</h3>
                      <div className="mb-5 flex flex-wrap gap-2">
                        {koc.categories.map((cat) => (
                          <span key={cat} className="rounded-full border border-orange-300/20 bg-orange-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-200">
                            {cat}
                          </span>
                        ))}
                      </div>

                      <div className="mb-5 grid grid-cols-2 gap-3">
                        <div className="rounded-[18px] border border-white/10 bg-white/[0.045] p-4">
                          <div className="flex items-center gap-1 mb-1">
                            <Users size={14} className="text-slate-400" />
                            <p className="text-xs text-slate-600">Người theo dõi</p>
                          </div>
                          <p className="text-lg font-black text-white">{koc.followers}</p>
                        </div>
                        <div className="rounded-[18px] border border-white/10 bg-white/[0.045] p-4">
                          <div className="flex items-center gap-1 mb-1">
                            <Heart size={14} className="text-slate-400" />
                            <p className="text-xs text-slate-600">Tương tác</p>
                          </div>
                          <p className="text-lg font-black text-[#14b8a6]">{koc.engagementRate}</p>
                        </div>
                        <div className="rounded-[18px] border border-white/10 bg-white/[0.045] p-4">
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp size={14} className="text-slate-400" />
                            <p className="text-xs text-slate-600">Lượt xem TB</p>
                          </div>
                          <p className="text-lg font-black text-white">{koc.avgViews}</p>
                        </div>
                        <div className="rounded-[18px] border border-orange-300/15 bg-orange-500/[0.07] p-4">
                          <p className="text-xs text-slate-600 mb-1">Giá</p>
                          <p className="text-base font-black text-orange-200">{currentPrice}</p>
                        </div>
                      </div>

                      <div className="mt-auto flex gap-2">
                        <button
                          onClick={() => handleInvite(koc)}
                          disabled={isDisabled}
                          className="booking-card-primary-action min-h-11 flex-1 px-4 py-2 text-sm font-black disabled:opacity-60"
                        >
                          {buttonLabel}
                        </button>
                        <Link to={`/marketer/koc-profile/${koc.id}`} className="booking-card-secondary-action flex min-h-11 items-center px-4 py-2 text-sm font-black">
                          Xem hồ sơ
                        </Link>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={13} className="text-orange-300" />
                          {koc.responseTime}
                        </span>
                        <span className="font-black text-[#14b8a6]">{koc.completionRate} hoàn thành</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredKocs.length > 0 && (
              <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#0b0b0b] p-4 shadow-xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-400">
                  Hiển thị {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredKocs.length)} / {filteredKocs.length} KOL
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-200 hover:border-orange-400/45 hover:text-white disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="text-sm font-black text-white">
                    Trang {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-200 hover:border-orange-400/45 hover:text-white disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}

            {filteredKocs.length === 0 && (
              <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-10 text-center shadow-xl shadow-black/25">
                <p className="font-bold text-slate-200">Không có KOC phù hợp với bộ lọc hiện tại.</p>
                <button onClick={resetFilters} className="mt-3 font-bold text-orange-300 hover:text-orange-200">
                  Xóa bộ lọc để xem lại toàn bộ
                </button>
              </div>
            )}
          </>
        )}

        {selectedKoc && createPortal(
          <div className="kolab-app-shell">
            <div className="booking-discovery-page">
              <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="Đóng chi tiết"
              onClick={() => setSelectedKocId(null)}
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-[1px]"
            />
            <div className="absolute inset-0 overflow-y-auto">
              <div className="min-h-full flex items-start sm:items-center justify-center p-2 sm:p-4">
              {/* Refactor: split popup into premium SaaS sections for clearer hierarchy */}
                <div className="w-full max-w-5xl max-h-[94vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col">
                <button
                  type="button"
                  onClick={() => setSelectedKocId(null)}
                  className="absolute right-6 top-4 z-20 p-2 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                  aria-label="Đóng chi tiết"
                >
                  <X size={16} />
                </button>
                <KOLProfileHeader
                  koc={selectedKoc}
                  isShortlisted={shortlistIds.includes(Number(selectedKoc.id))}
                  onToggleShortlist={(e) => handleToggleShortlist(e, selectedKoc.id)}
                />

                <div className="overflow-y-auto px-4 md:px-6 pb-5 md:pb-6">
                  <div className="grid xl:grid-cols-[1.35fr,1fr]" style={{ gap: 24 }}>
                    <div style={{ display: "grid", rowGap: 18 }}>
                      <KOLPerformanceStats koc={selectedKoc} />
                      <KOLPrimaryStats koc={selectedKoc} />
                    </div>

                    <div style={{ display: "grid", rowGap: 18 }}>
                      <BookingInfoCard title="Mô tả">
                        <div className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-4 py-4">
                          <p className="text-sm font-medium leading-relaxed text-slate-700">{selectedKoc.bio}</p>
                        </div>
                      </BookingInfoCard>

                      <div className="grid lg:grid-cols-2" style={{ gap: 18 }}>
                        <BookingInfoCard title="Audience">
                          <div className="grid grid-cols-1 gap-2">
                            <div className="rounded-lg border border-slate-200 px-3 py-3">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">Tệp khán giả</p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">{selectedKoc.audience}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 px-3 py-3">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">Khu vực</p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">{selectedKoc.location}</p>
                            </div>
                          </div>
                        </BookingInfoCard>

                        <BookingInfoCard title="Ngôn ngữ & Dịch vụ">
                          <div className="flex flex-wrap mb-3" style={{ columnGap: 8, rowGap: 8 }}>
                            {selectedKoc.languages.map((language) => (
                              <BookingCapabilityChip key={language} palette="emerald">
                                {language}
                              </BookingCapabilityChip>
                            ))}
                          </div>
                          <div className="flex flex-wrap" style={{ columnGap: 8, rowGap: 8 }}>
                            {selectedKoc.services.map((service) => (
                              <BookingCapabilityChip key={service} icon={getServiceIcon(service)}>
                                {service}
                              </BookingCapabilityChip>
                            ))}
                          </div>
                        </BookingInfoCard>
                      </div>

                      <BookingInfoCard title="Thương hiệu gần đây">
                        <p className="text-sm text-slate-700">{selectedKoc.recentBrands.join(" • ")}</p>
                      </BookingInfoCard>
                    </div>
                  </div>
                </div>

                <KOLActionBar
                  canBook={Boolean(selectedCampaignId) && (!selectedKocBooking || selectedKocBooking.status === "rejected" || selectedKocBooking.status === "cancelled") && invitingKocId !== selectedKoc.userId}
                  canAdd={Boolean(selectedCampaignId) && !selectedKocShortlisted}
                  isBooking={invitingKocId === selectedKoc.userId}
                  isBooked={Boolean(selectedKocBooking) && selectedKocBooking?.status !== "rejected" && selectedKocBooking?.status !== "cancelled"}
                  isRebook={Boolean(selectedKocBooking) && (selectedKocBooking?.status === "rejected" || selectedKocBooking?.status === "cancelled")}
                  isAdded={selectedKocShortlisted}
                  onBook={() => handleInvite(selectedKoc)}
                  onAddToCampaign={() => handleAddToCampaign(selectedKoc)}
                />
                </div>
              </div>
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
