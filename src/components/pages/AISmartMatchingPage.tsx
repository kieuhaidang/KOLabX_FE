import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { BadgeCheck, Crown, Eye, Send, Star, TrendingUp, Users } from "lucide-react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ApiError } from "../../services/api";
import { runSmartMatching, type SmartMatchingItem } from "../../services/aiService";
import type { Campaign } from "../../services/campaignService";
import { formatThousands, parseThousands } from "../../utils/numberFormat";
import {
  AiNotice,
  AiPageHeader,
  AiSectionCard,
  AiSubmitButton,
  inputClassName,
} from "../ai/aiPrimitives";

const initialForm = {
  campaignId: "",
  category: "",
  platform: "",
  budget: "",
  followersMin: "",
  followersMax: "",
  engagementMin: "",
  description: "",
};

const SMART_MATCHING_CAMPAIGN_DRAFT_KEY = "kolab_smart_matching_campaign_draft";

type CampaignCreatedState = {
  source: "campaign-created" | "campaign-payment-success";
  campaign: Campaign;
};

type SuggestionField = "niche" | "platform" | "budget" | "followersMin" | "followersMax" | "engagement";
type ResultTab = "all" | "video" | "live";

function isCampaignCreatedState(value: unknown): value is CampaignCreatedState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CampaignCreatedState>;
  return (candidate.source === "campaign-created" || candidate.source === "campaign-payment-success")
    && Boolean(candidate.campaign && typeof candidate.campaign === "object")
    && Number.isFinite(Number(candidate.campaign?.id));
}

function readCampaignDraft() {
  try {
    const raw = sessionStorage.getItem(SMART_MATCHING_CAMPAIGN_DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCampaignCreatedState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cleanCampaignText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildCampaignMatchingDescription(campaign: Campaign) {
  const sections = [
    ["Tên chiến dịch", cleanCampaignText(campaign.title)],
    ["Mô tả chiến dịch", cleanCampaignText(campaign.description)],
    ["Ngành hàng", cleanCampaignText(campaign.category)],
    ["Nền tảng", cleanCampaignText(campaign.platform)],
  ];

  return sections
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}:\n${value}`)
    .join("\n\n");
}

function campaignToMatchingForm(campaign: Campaign) {
  const positiveNumber = (value: unknown) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? String(number) : "";
  };

  return {
    campaignId: String(campaign.id),
    category: cleanCampaignText(campaign.category),
    platform: cleanCampaignText(campaign.platform),
    budget: positiveNumber(campaign.budget),
    followersMin: positiveNumber(campaign.targetFollowersMin),
    followersMax: positiveNumber(campaign.targetFollowersMax),
    engagementMin: positiveNumber(campaign.targetEngagementMin),
    description: buildCampaignMatchingDescription(campaign),
  };
}

const chipClassName =
  "rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-primary/40 hover:bg-primary/10 hover:text-white";

const suggestionPanelClassName = "animate-in fade-in slide-in-from-top-1 duration-150";

const nicheSuggestions = ["Làm đẹp", "Thời trang", "Công nghệ", "Ẩm thực", "Du lịch", "Lifestyle", "Giáo dục", "Mẹ và bé", "Gaming", "Fitness"];
const platformSuggestions = ["TikTok", "Instagram", "YouTube", "Facebook"];
const budgetSuggestions = [
  { label: "20 triệu", value: "20000000" },
  { label: "50 triệu", value: "50000000" },
  { label: "100 triệu", value: "100000000" },
  { label: "200 triệu", value: "200000000" },
];
const followerMinSuggestions = [
  { label: "1K", value: "1000" },
  { label: "10K", value: "10000" },
  { label: "50K", value: "50000" },
  { label: "100K", value: "100000" },
];
const followerMaxSuggestions = [
  { label: "50K", value: "50000" },
  { label: "100K", value: "100000" },
  { label: "500K", value: "500000" },
  { label: "1M", value: "1000000" },
];
const engagementSuggestions = [
  { label: "2%", value: "2" },
  { label: "4%", value: "4" },
  { label: "6%", value: "6" },
  { label: "8%", value: "8" },
  { label: "10%", value: "10" },
];
const descriptionSuggestions = [
  "Tìm KOC nữ 18–30 tuổi chuyên nội dung làm đẹp",
  "Ưu tiên creator có phong cách review chân thực",
  "Tập trung TikTok, follower từ 10K–100K",
  "Ưu tiên engagement cao và phản hồi nhanh",
  "Phù hợp chiến dịch ra mắt sản phẩm mới",
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value || 0));
}

function formatCompactNumber(value: number) {
  const safeValue = Number(value || 0);
  if (safeValue >= 1_000_000) return `${Number((safeValue / 1_000_000).toFixed(1))}M`;
  if (safeValue >= 1_000) return `${Number((safeValue / 1_000).toFixed(safeValue >= 10_000 ? 0 : 1))}K`;
  return formatNumber(safeValue);
}

function appendUniqueValue(current: string, value: string) {
  const items = current.split(",").map((item) => item.trim()).filter(Boolean);
  const exists = items.some((item) => item.toLowerCase() === value.toLowerCase());
  return exists ? current : [...items, value].join(", ");
}

function appendSentence(current: string, value: string) {
  const trimmed = current.trim();
  if (!trimmed) return value;
  if (trimmed.toLowerCase().includes(value.toLowerCase())) return current;
  const separator = /[.!?…]$/.test(trimmed) ? " " : ". ";
  return `${trimmed}${separator}${value}`;
}

function splitTags(value: string | null) {
  return (value || "")
    .split(/[,+/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "K";
}

function getCreatorKind(item: SmartMatchingItem): ResultTab | null {
  const candidate = item as SmartMatchingItem & {
    creatorType?: string | null;
    type?: string | null;
    contentType?: string | null;
  };
  const raw = [candidate.creatorType, candidate.type, candidate.contentType].find(Boolean)?.toLowerCase() || "";
  if (raw.includes("live")) return "live";
  if (raw.includes("video")) return "video";
  return null;
}

function SuggestionChips({
  options,
  onSelect,
}: {
  options: Array<string | { label: string; value: string }>;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => {
        const label = typeof option === "string" ? option : option.label;
        const value = typeof option === "string" ? option : option.value;
        return (
          <button
            key={label}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(value)}
            className={chipClassName}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function MatchingSkeletonRows() {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b]/95 p-5 shadow-2xl shadow-black/25">
      <div className="mb-5 space-y-2">
        <div className="h-6 w-48 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-white/5" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_120px_120px_120px_180px]">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
                  <div className="h-3 w-24 animate-pulse rounded-full bg-white/5" />
                </div>
              </div>
              <div className="h-5 animate-pulse rounded-full bg-white/10" />
              <div className="h-5 animate-pulse rounded-full bg-white/10" />
              <div className="h-5 animate-pulse rounded-full bg-white/10" />
              <div className="h-9 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 lg:hidden">{label}</p>
      <p className={`mt-1 text-sm font-black lg:mt-0 lg:text-base ${accent ? "text-teal-200" : "text-white"}`}>{value}</p>
    </div>
  );
}

function SmartMatchingResults({
  matches,
  activeTab,
  tabs,
  onTabChange,
}: {
  matches: SmartMatchingItem[];
  activeTab: ResultTab;
  tabs: Array<{ id: ResultTab; label: string }>;
  onTabChange: (tab: ResultTab) => void;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b]/95 p-5 shadow-2xl shadow-black/25">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Kết quả Matching</h2>
          <p className="mt-1 text-sm font-medium text-slate-400">Danh sách KOC/Creator phù hợp nhất với tiêu chí chiến dịch.</p>
          <p className="mt-2 text-sm font-bold text-teal-200">Tìm thấy {matches.length} Creator phù hợp</p>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition-all ${activeTab === tab.id
                    ? "border-orange-300/70 bg-[var(--accent-gradient)] text-white shadow-lg shadow-primary/20"
                    : "border-white/12 bg-white/[0.04] text-slate-300 hover:border-orange-400/45 hover:bg-white/[0.08] hover:text-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 lg:grid lg:grid-cols-[minmax(0,1.7fr)_120px_120px_120px_180px] lg:items-center">
        <span>Creator</span>
        <span>Followers</span>
        <span>Engagement</span>
        <span>Điểm AI</span>
        <span className="text-right">Hành động</span>
      </div>

      <div className="space-y-3">
        {matches.map((item, index) => {
          const tags = splitTags(item.niche);
          const platforms = splitTags(item.platform);
          return (
            <div
              key={item.id}
              className="group rounded-[22px] border border-white/10 bg-[#15181b] p-4 shadow-xl shadow-black/15 transition-all hover:-translate-y-0.5 hover:border-orange-400/35 hover:bg-[#1d2227]"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_120px_120px_120px_180px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-300/20 bg-[var(--accent-gradient-strong)] text-lg font-black text-white shadow-lg shadow-black/25">
                      {getInitials(item.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 truncate text-base font-black text-white">{item.name}</h3>
                        {item.isSearchBoosted ? <BadgeCheck size={16} className="text-teal-200" /> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-orange-300/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold text-orange-100">
                            {tag}
                          </span>
                        ))}
                        {platforms.map((platform) => (
                          <span key={platform} className="rounded-full border border-teal-300/20 bg-teal-500/10 px-2.5 py-1 text-[10px] font-bold text-teal-100">
                            {platform}
                          </span>
                        ))}
                      </div>
                      {item.reasons.length > 0 ? (
                        <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-slate-400">{item.reasons[0]}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 lg:contents">
                  <ResultMetric label="Followers" value={item.followers > 0 ? formatCompactNumber(item.followers) : "Chưa có"} />
                  <ResultMetric label="Engagement" value={`${Number(item.engagementRate || 0).toFixed(1)}%`} accent />
                  <ResultMetric label="Điểm AI" value={`${item.score}`} />
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Link
                    to={`/marketer/bookings?kocId=${item.userId}`}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-hover lg:flex-none"
                  >
                    <Send size={15} />
                    Mời hợp tác
                  </Link>
                  <Link
                    to={`/marketer/koc-profile/${item.id}`}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 text-sm font-black text-slate-100 transition hover:-translate-y-0.5 hover:border-teal-300/40 hover:bg-white/[0.1] lg:flex-none"
                  >
                    <Eye size={15} />
                    Xem hồ sơ
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptyMatchingState() {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b]/95 p-8 text-center shadow-xl shadow-black/25">
      <Star className="mx-auto mb-3 text-orange-200" size={28} />
      <h2 className="text-xl font-black text-white">Chưa tìm thấy Creator phù hợp với tiêu chí hiện tại.</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-slate-400">
        Hãy thử nới rộng khoảng followers, giảm engagement tối thiểu hoặc điều chỉnh ngành hàng.
      </p>
    </section>
  );
}

function ErrorMatchingState({ message }: { message: string }) {
  return (
    <section className="rounded-[28px] border border-red-400/25 bg-red-500/10 p-5 text-sm font-semibold text-red-100 shadow-xl shadow-black/25">
      {message || "Không thể tải kết quả Matching. Vui lòng thử lại."}
    </section>
  );
}

export function AISmartMatchingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const suggestionsRootRef = useRef<HTMLFormElement | null>(null);
  const prefillAppliedRef = useRef(false);
  const [form, setForm] = useState(initialForm);
  const [matches, setMatches] = useState<SmartMatchingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeSuggestionField, setActiveSuggestionField] = useState<SuggestionField | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>("all");
  const [campaignPrefillNotice, setCampaignPrefillNotice] = useState(false);

  useEffect(() => {
    if (prefillAppliedRef.current) return;

    const navigationDraft = isCampaignCreatedState(location.state) ? location.state : null;
    const storedDraft = navigationDraft ? null : readCampaignDraft();
    const campaignDraft = navigationDraft ?? storedDraft ?? null;
    prefillAppliedRef.current = true;

    if (!campaignDraft) return;

    setForm(campaignToMatchingForm(campaignDraft.campaign));
    setCampaignPrefillNotice(true);
    sessionStorage.removeItem(SMART_MATCHING_CAMPAIGN_DRAFT_KEY);

    if (storedDraft) {
      navigate(location.pathname, { replace: true, state: storedDraft });
    }
  }, [location.pathname, location.state, navigate]);

  const resultTabs = useMemo(() => {
    const hasVideo = matches.some((item) => getCreatorKind(item) === "video");
    const hasLive = matches.some((item) => getCreatorKind(item) === "live");
    return [
      { id: "all" as const, label: "Tất cả" },
      ...(hasVideo ? [{ id: "video" as const, label: "Video Creator" }] : []),
      ...(hasLive ? [{ id: "live" as const, label: "Live Creator" }] : []),
    ];
  }, [matches]);

  const visibleMatches = useMemo(() => {
    if (activeResultTab === "all") return matches;
    return matches.filter((item) => getCreatorKind(item) === activeResultTab);
  }, [activeResultTab, matches]);

  useEffect(() => {
    if (!resultTabs.some((tab) => tab.id === activeResultTab)) {
      setActiveResultTab("all");
    }
  }, [activeResultTab, resultTabs]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (!suggestionsRootRef.current?.contains(target)) {
        setActiveSuggestionField(null);
        return;
      }

      if (!target.closest("[data-suggestion-scope]")) {
        setActiveSuggestionField(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveSuggestionField(null);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.description.trim() && !form.category.trim() && !form.campaignId.trim()) {
      setErrorMessage("Vui lòng nhập mô tả chiến dịch, ngành hàng hoặc Campaign ID.");
      setSuccessMessage("");
      return;
    }

    setHasSubmitted(true);
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await runSmartMatching({
        campaignId: form.campaignId.trim() || undefined,
        category: form.category.trim() || undefined,
        platform: form.platform.trim() || undefined,
        budget: form.budget.trim() || undefined,
        targetFollowersMin: form.followersMin.trim() || undefined,
        targetFollowersMax: form.followersMax.trim() || undefined,
        targetEngagementMin: form.engagementMin.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setMatches(response.items.filter((item) => item.score > 0).slice(0, 20));
      setSuccessMessage(`Tìm thấy ${response.items.filter((item) => item.score > 0).length} KOC phù hợp.`);
      setActiveResultTab("all");
      setCampaignPrefillNotice(false);
      sessionStorage.removeItem(SMART_MATCHING_CAMPAIGN_DRAFT_KEY);
      if (isCampaignCreatedState(location.state)) {
        navigate(location.pathname, { replace: true, state: null });
      }
    } catch (error) {
      setMatches([]);
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể chạy AI Smart Matching.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="marketer">
      <div className="space-y-6">
        <AiPageHeader
          eyebrow="AI cho Marketer"
          title="AI Smart Matching"
          description="Tìm KOC phù hợp nhất dựa trên ngành hàng, nền tảng, followers, engagement và gói Plus."
          icon={<Users size={28} className="text-white" />}
        />

        <AiSectionCard title="Tiêu chí chiến dịch">
          <form ref={suggestionsRootRef} onSubmit={handleSubmit} className="space-y-4">
            {campaignPrefillNotice ? (
              <AiNotice tone="success">Đã điền tiêu chí từ chiến dịch vừa tạo. Hãy kiểm tra trước khi Matching.</AiNotice>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Campaign ID (tuỳ chọn)</label>
                <input
                  value={form.campaignId}
                  onFocus={() => setActiveSuggestionField(null)}
                  onChange={(e) => handleChange("campaignId", e.target.value)}
                  className={inputClassName}
                  placeholder="VD: 12"
                />
                <p className="mt-1 text-xs text-slate-400">Không bắt buộc. Nhập ID nếu muốn matching theo một chiến dịch đã có.</p>
              </div>

              <div data-suggestion-scope>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ngành hàng / Niche</label>
                <input
                  value={form.category}
                  onFocus={() => setActiveSuggestionField("niche")}
                  onClick={() => setActiveSuggestionField("niche")}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className={inputClassName}
                  placeholder="Ví dụ: Làm đẹp, Thời trang, Công nghệ, Food, Du lịch..."
                />
                {activeSuggestionField === "niche" ? (
                  <div className={suggestionPanelClassName}>
                    <p className="mt-2 text-xs font-semibold text-slate-400">Gợi ý nhanh</p>
                    <SuggestionChips options={nicheSuggestions} onSelect={(value) => handleChange("category", appendUniqueValue(form.category, value))} />
                  </div>
                ) : null}
              </div>

              <div data-suggestion-scope>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nền tảng</label>
                <input
                  value={form.platform}
                  onFocus={() => setActiveSuggestionField("platform")}
                  onClick={() => setActiveSuggestionField("platform")}
                  onChange={(e) => handleChange("platform", e.target.value)}
                  className={inputClassName}
                  placeholder="Ví dụ: TikTok, Instagram, YouTube, Facebook..."
                />
                {activeSuggestionField === "platform" ? (
                  <div className={suggestionPanelClassName}>
                    <p className="mt-2 text-xs font-semibold text-slate-400">Chọn gợi ý</p>
                    <SuggestionChips options={platformSuggestions} onSelect={(value) => handleChange("platform", appendUniqueValue(form.platform, value))} />
                  </div>
                ) : null}
              </div>

              <div data-suggestion-scope>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ngân sách (VND)</label>
                <input
                  value={formatThousands(form.budget)}
                  onFocus={() => setActiveSuggestionField("budget")}
                  onClick={() => setActiveSuggestionField("budget")}
                  onChange={(e) => {
                    const parsed = parseThousands(e.target.value);
                    handleChange("budget", parsed ? String(parsed) : "");
                  }}
                  className={inputClassName}
                  placeholder="Ví dụ: 50.000.000"
                />
                <p className="mt-1 text-xs text-slate-400">Nhập ngân sách dự kiến bằng VNĐ.</p>
                {activeSuggestionField === "budget" ? (
                  <div className={suggestionPanelClassName}>
                    <SuggestionChips options={budgetSuggestions} onSelect={(value) => handleChange("budget", value)} />
                  </div>
                ) : null}
              </div>

              <div data-suggestion-scope>
                <label className="mb-1 block text-sm font-medium text-slate-700">Followers tối thiểu</label>
                <input
                  value={formatThousands(form.followersMin)}
                  onFocus={() => setActiveSuggestionField("followersMin")}
                  onClick={() => setActiveSuggestionField("followersMin")}
                  onChange={(e) => {
                    const parsed = parseThousands(e.target.value);
                    handleChange("followersMin", parsed ? String(parsed) : "");
                  }}
                  className={inputClassName}
                  placeholder="Ví dụ: 10.000"
                />
                {activeSuggestionField === "followersMin" ? (
                  <div className={suggestionPanelClassName}>
                    <SuggestionChips options={followerMinSuggestions} onSelect={(value) => handleChange("followersMin", value)} />
                  </div>
                ) : null}
              </div>

              <div data-suggestion-scope>
                <label className="mb-1 block text-sm font-medium text-slate-700">Followers tối đa</label>
                <input
                  value={formatThousands(form.followersMax)}
                  onFocus={() => setActiveSuggestionField("followersMax")}
                  onClick={() => setActiveSuggestionField("followersMax")}
                  onChange={(e) => {
                    const parsed = parseThousands(e.target.value);
                    handleChange("followersMax", parsed ? String(parsed) : "");
                  }}
                  className={inputClassName}
                  placeholder="Ví dụ: 500.000"
                />
                {activeSuggestionField === "followersMax" ? (
                  <div className={suggestionPanelClassName}>
                    <SuggestionChips options={followerMaxSuggestions} onSelect={(value) => handleChange("followersMax", value)} />
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2" data-suggestion-scope>
                <label className="mb-1 block text-sm font-medium text-slate-700">Engagement tối thiểu (%)</label>
                <input
                  value={form.engagementMin}
                  onFocus={() => setActiveSuggestionField("engagement")}
                  onClick={() => setActiveSuggestionField("engagement")}
                  onChange={(e) => handleChange("engagementMin", e.target.value)}
                  className={inputClassName}
                  placeholder="Ví dụ: 4"
                />
                <p className="mt-1 text-xs text-slate-400">Tỷ lệ tương tác tối thiểu theo phần trăm.</p>
                {activeSuggestionField === "engagement" ? (
                  <div className={suggestionPanelClassName}>
                    <SuggestionChips options={engagementSuggestions} onSelect={(value) => handleChange("engagementMin", value)} />
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả chiến dịch</label>
                <textarea
                  value={form.description}
                  onFocus={() => setActiveSuggestionField(null)}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  className={inputClassName}
                  placeholder="Ví dụ: Tìm KOC nữ 18–30 tuổi, chuyên nội dung skincare trên TikTok, phong cách gần gũi, ưu tiên creator có video review chân thực..."
                />
                <p className="mt-2 text-xs font-semibold text-slate-400">Gợi ý nhanh</p>
                <SuggestionChips options={descriptionSuggestions} onSelect={(value) => handleChange("description", appendSentence(form.description, value))} />
              </div>
            </div>

            {errorMessage ? <AiNotice tone="error">{errorMessage}</AiNotice> : null}
            {successMessage ? <AiNotice tone="success">{successMessage}</AiNotice> : null}

            <AiSubmitButton loading={loading} label="Matching" loadingLabel="Đang matching..." />
          </form>
        </AiSectionCard>

        {loading ? <MatchingSkeletonRows /> : null}
        {!loading && hasSubmitted && errorMessage ? <ErrorMatchingState message={errorMessage} /> : null}
        {!loading && hasSubmitted && !errorMessage && matches.length === 0 ? <EmptyMatchingState /> : null}
        {!loading && matches.length > 0 ? (
          <SmartMatchingResults matches={visibleMatches} activeTab={activeResultTab} tabs={resultTabs} onTabChange={setActiveResultTab} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
