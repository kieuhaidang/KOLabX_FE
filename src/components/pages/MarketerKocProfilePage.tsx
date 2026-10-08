import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock3,
  Facebook,
  Globe,
  Heart,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Music2,
  PackageSearch,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  Users,
  Video,
  Youtube,
} from "lucide-react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ApiError } from "../../services/api";
import { getKocProfileById, type KocProfile } from "../../services/profileService";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const tabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "content", label: "Nội dung" },
  { id: "audience", label: "Chỉ số khán giả" },
  { id: "campaigns", label: "Sản phẩm / Chiến dịch" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function formatNumber(value?: number | null) {
  if (!value || value <= 0) return "Chưa có";
  return numberFormatter.format(value);
}

function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "Chưa có";
  return `${Number(value).toFixed(1)}%`;
}

function formatCurrency(value?: number | null) {
  if (!value || value <= 0) return "Liên hệ";
  return currencyFormatter.format(value);
}

function splitList(value?: string | null) {
  return (value || "")
    .split(/[,+/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "K"
  );
}

function platformIcon(platform: string) {
  const normalized = platform.toLowerCase();
  if (normalized.includes("instagram")) return <Instagram size={20} />;
  if (normalized.includes("youtube")) return <Youtube size={20} />;
  if (normalized.includes("facebook")) return <Facebook size={20} />;
  if (normalized.includes("tiktok")) return <Music2 size={20} />;
  return <Globe size={20} />;
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-6 text-sm font-medium text-slate-400">
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent = "orange",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: "orange" | "teal";
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0b0b0b] p-5 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-orange-400/35">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border ${accent === "teal" ? "border-teal-300/25 bg-teal-500/10 text-teal-200" : "border-orange-300/25 bg-orange-500/10 text-orange-200"}`}>
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export function MarketerKocProfilePage() {
  const params = useParams();
  const navigate = useNavigate();
  const kocId = Number(params.kocId);
  const [profile, setProfile] = useState<KocProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    if (!Number.isInteger(kocId) || kocId <= 0) {
      setErrorMessage("ID hồ sơ KOC không hợp lệ.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMessage("");

    getKocProfileById(kocId)
      .then((response) => {
        if (!cancelled) {
          setProfile(response.profile);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 404) {
            setProfile(null);
            setErrorMessage("");
            return;
          }
          setErrorMessage(error instanceof ApiError ? error.message : "Không thể tải hồ sơ KOC.");
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kocId]);

  const name = profile?.displayName?.trim() || profile?.fullName || "Creator";
  const niches = useMemo(() => splitList(profile?.niche), [profile?.niche]);
  const platforms = useMemo(() => splitList(profile?.platform), [profile?.platform]);
  const responseTime = profile?.responseTime || "Chưa có dữ liệu";
  const completionRate = profile?.completionRate ?? null;
  const responseRate = profile?.responseRate ?? null;

  return (
    <DashboardLayout role="marketer">
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-orange-400/40 hover:bg-white/[0.1] hover:text-white"
        >
          <ArrowLeft size={17} />
          Quay lại danh sách Creator
        </button>

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-8 text-sm font-medium text-slate-300 shadow-xl shadow-black/25">
            Đang tải hồ sơ Creator...
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="rounded-[28px] border border-red-400/25 bg-red-500/10 p-8 text-sm font-semibold text-red-100 shadow-xl shadow-black/25">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && !profile ? (
          <EmptyState>Không tìm thấy hồ sơ Creator.</EmptyState>
        ) : null}

        {!loading && profile ? (
          <>
            <section className="relative isolate overflow-hidden rounded-[34px] border border-white/10 bg-[#050505] p-5 shadow-2xl shadow-black/35 sm:p-7 lg:p-8">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_18%,rgba(255,90,31,0.24),transparent_28rem),radial-gradient(circle_at_88%_4%,rgba(20,184,166,0.18),transparent_30rem),linear-gradient(135deg,#050505_0%,#0b0b0b_56%,#032f2c_130%)]" />
              <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.06] shadow-2xl shadow-black/30">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[var(--accent-gradient-strong)] text-4xl font-black text-white">
                        {initials(name)}
                      </div>
                    )}
                    {profile.verified ? (
                      <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#050505] bg-teal-500 text-white shadow-lg shadow-teal-500/25">
                        <BadgeCheck size={17} />
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-orange-300/25 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-200">
                        Creator Profile
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">
                        {profile.plan === "plus" ? "Plus" : "Free"}
                      </span>
                    </div>
                    <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">{name}</h1>
                    <p className="mt-2 text-sm font-semibold text-slate-400">@{profile.fullName || `koc-${profile.userId}`}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {niches.length > 0 ? niches.map((item) => (
                        <span key={item} className="rounded-full border border-teal-300/20 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-100">
                          {item}
                        </span>
                      )) : <span className="text-sm font-medium text-slate-500">Chưa có niche</span>}
                      {platforms.map((item) => (
                        <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-bold text-slate-200">
                          {platformIcon(item)}
                          {item}
                        </span>
                      ))}
                    </div>

                    <p className="mt-5 max-w-3xl text-sm font-medium leading-relaxed text-slate-300">
                      {profile.bio || "Creator chưa cập nhật phần giới thiệu."}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-slate-300">
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={17} className="text-orange-300" />
                        {profile.location || "Chưa có địa điểm"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={17} className="text-teal-200" />
                        {responseTime}
                      </span>
                      {profile.email ? (
                        <span className="inline-flex items-center gap-2">
                          <Mail size={17} className="text-slate-400" />
                          {profile.email}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/30 p-5 shadow-xl shadow-black/25 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Thông tin hợp tác</p>
                  <p className="mt-3 text-3xl font-black text-white">{formatCurrency(profile.servicePrice)}</p>
                  <p className="mt-1 text-sm font-medium text-slate-400">Giá tham khảo theo hồ sơ Creator</p>
                  <div className="mt-5 grid gap-3">
                    <Link
                      to={`/marketer/bookings?kocId=${profile.userId}`}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
                    >
                      <Sparkles size={18} />
                      Mời hợp tác
                    </Link>
                    <Link
                      to="/marketer/messages"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 text-sm font-black text-slate-100 transition-all hover:-translate-y-0.5 hover:border-teal-300/45 hover:bg-white/[0.1]"
                    >
                      <MessageSquare size={18} />
                      Nhắn tin
                    </Link>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Hoàn thành</p>
                      <p className="mt-1 text-lg font-black text-teal-200">{formatPercent(completionRate)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Phản hồi</p>
                      <p className="mt-1 text-lg font-black text-orange-200">{responseRate ? formatPercent(responseRate) : responseTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="overflow-x-auto rounded-full border border-white/10 bg-[#0b0b0b]/95 p-1.5 shadow-xl shadow-black/20">
              <div className="flex min-w-max gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-4 py-2.5 text-sm font-black transition-all ${
                      activeTab === tab.id
                        ? "bg-[var(--accent-gradient)] text-white shadow-lg shadow-primary/20"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                {activeTab === "overview" ? (
                  <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricCard label="Followers" value={formatNumber(profile.followers)} icon={<Users size={21} />} />
                      <MetricCard label="Engagement rate" value={formatPercent(profile.engagementRate)} icon={<Heart size={21} />} accent="teal" />
                      <MetricCard label="Completion rate" value={formatPercent(completionRate)} icon={<CheckCircle2 size={21} />} accent="teal" />
                      <MetricCard label="Creator score" value={profile.kocRank || "Chưa có"} icon={<Star size={21} />} />
                    </section>

                    <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 shadow-xl shadow-black/25">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">Platform statistics</p>
                          <h2 className="mt-2 text-2xl font-black text-white">Nền tảng đã kết nối</h2>
                        </div>
                        <BarChart3 className="text-teal-200" size={24} />
                      </div>
                      {platforms.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {platforms.map((platform) => (
                            <div key={platform} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 transition-all hover:-translate-y-0.5 hover:border-teal-300/35">
                              <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-500/10 text-teal-200">
                                  {platformIcon(platform)}
                                </div>
                                <div>
                                  <p className="font-black text-white">{platform}</p>
                                  <p className="text-xs font-medium text-slate-500">Thông tin từ hồ sơ</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="text-xs text-slate-500">Followers</p>
                                  <p className="mt-1 font-black text-white">{formatNumber(profile.followers)}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="text-xs text-slate-500">Engagement</p>
                                  <p className="mt-1 font-black text-teal-200">{formatPercent(profile.engagementRate)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState>Creator chưa kết nối nền tảng mạng xã hội.</EmptyState>
                      )}
                    </section>
                  </>
                ) : null}

                {activeTab === "content" ? (
                  <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 shadow-xl shadow-black/25">
                    <div className="mb-5 flex items-center gap-3">
                      <Video className="text-orange-200" size={24} />
                      <h2 className="text-2xl font-black text-white">Nội dung gần đây</h2>
                    </div>
                    <EmptyState>Chưa có dữ liệu nội dung hoặc media công khai cho Creator này.</EmptyState>
                  </section>
                ) : null}

                {activeTab === "audience" ? (
                  <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 shadow-xl shadow-black/25">
                    <div className="mb-5 flex items-center gap-3">
                      <TrendingUp className="text-teal-200" size={24} />
                      <h2 className="text-2xl font-black text-white">Phân tích khán giả</h2>
                    </div>
                    <EmptyState>Chưa có dữ liệu phân tích khán giả.</EmptyState>
                  </section>
                ) : null}

                {activeTab === "campaigns" ? (
                  <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 shadow-xl shadow-black/25">
                    <div className="mb-5 flex items-center gap-3">
                      <PackageSearch className="text-orange-200" size={24} />
                      <h2 className="text-2xl font-black text-white">Sản phẩm / Chiến dịch</h2>
                    </div>
                    <EmptyState>Chưa có dữ liệu chiến dịch hoặc sản phẩm công khai cho Creator này.</EmptyState>
                  </section>
                ) : null}
              </div>

              <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-[28px] border border-orange-300/20 bg-[#0b0b0b] p-6 shadow-2xl shadow-black/25">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">Collaboration</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Mời Creator</h2>
                  <div className="mt-5 space-y-3 text-sm font-medium text-slate-300">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <span>Giá tham khảo</span>
                      <span className="font-black text-white">{formatCurrency(profile.servicePrice)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <span>Thời gian phản hồi</span>
                      <span className="font-black text-teal-200">{responseTime}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <span>Tỷ lệ hoàn thành</span>
                      <span className="font-black text-orange-200">{formatPercent(completionRate)}</span>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link to={`/marketer/bookings?kocId=${profile.userId}`} className="booking-card-primary-action flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-black">
                      <Briefcase size={18} />
                      Mời hợp tác
                    </Link>
                    <Link to="/marketer/messages" className="booking-card-secondary-action flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-black">
                      <MessageSquare size={18} />
                      Nhắn tin
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 shadow-xl shadow-black/25">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Hồ sơ</p>
                  <div className="mt-4 space-y-3 text-sm font-medium text-slate-300">
                    <p className="flex items-center gap-2"><UserRound size={16} className="text-slate-500" /> ID hồ sơ: {profile.id}</p>
                    <p className="flex items-center gap-2"><Users size={16} className="text-slate-500" /> User ID: {profile.userId}</p>
                    <p className="flex items-center gap-2"><Globe size={16} className="text-slate-500" /> {platforms.length ? platforms.join(", ") : "Chưa có nền tảng"}</p>
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
