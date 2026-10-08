import { type ReactNode, useEffect, useState, useMemo, useRef } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { formatThousands, parseThousands } from "../../utils/numberFormat";
import { useLocation, useNavigate } from "react-router";
import {
  Rocket,
  Search,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Filter,
  TrendingUp,
  AlertCircle,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Layers3,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Target,
  User,
  Wallet,
  X,
  Send,
  Globe
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../auth/AuthProvider";
import * as campaignService from "../../services/campaignService";
import type { Campaign, CampaignStatus } from "../../services/campaignService";
import type { AutoBriefResult } from "../../services/aiService";
import { listBookings, createBooking, type Booking } from "../../services/bookingService";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Dropdown } from "../ui/dropdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { uploadFile } from "../../services/api";
import { clearGuestAiBriefDraft, consumePostLoginHandoff, readGuestAiBriefDraft } from "../../services/guestTrial";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value || 0))} VND`;
}

function formatCurrencyShort(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value || 0));
}

function parseCurrency(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function monthLabel(dateString: string, fallbackIndex: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return `T${fallbackIndex + 1}`;
  return `T${date.getMonth() + 1}`;
}

function toProgress(status: CampaignStatus) {
  if (status === "draft") return 10;
  if (status === "open") return 25;
  if (status === "in_progress") return 65;
  if (status === "completed") return 100;
  return 0;
}

function toStatusLabel(status: CampaignStatus) {
  if (status === "draft") return "Bản nháp";
  if (status === "scheduled") return "Đã lên lịch";
  if (status === "open") return "Đang mở";
  if (status === "in_progress") return "Đang chạy";
  if (status === "completed") return "Hoàn thành";
  if (status === "pending_payment") return "Chờ thanh toán";
  return "Đã hủy";
}

function toStatusStyle(status: CampaignStatus) {
  if (status === "in_progress") return "bg-emerald-100 text-emerald-700";
  if (status === "open") return "bg-green-100 text-green-700";
  if (status === "scheduled") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-slate-200 text-slate-700";
  if (status === "draft") return "bg-amber-100 text-amber-700";
  if (status === "pending_payment") return "bg-yellow-100 text-yellow-700";
  return "bg-rose-100 text-rose-700";
}

function ProductImagesUpload({
  images,
  onChange
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (images.length + files.length > 5) {
      alert("Bạn chỉ được tải lên tối đa 5 hình ảnh sản phẩm.");
      return;
    }

    setUploading(true);
    try {
      const newImages = [...images];
      for (let i = 0; i < files.length; i++) {
        const res = await uploadFile(files[i]);
        newImages.push(res.url);
      }
      onChange(newImages);
    } catch (err: any) {
      alert("Lỗi tải ảnh: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 block">Hình ảnh sản phẩm (Tối đa 5 ảnh)</label>
      <div className="flex flex-wrap gap-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 group">
            <img src={url} alt="Product" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50">
            {uploading ? (
              <span className="text-[10px] text-slate-500 font-semibold animate-pulse">Tải...</span>
            ) : (
              <>
                <Plus size={20} className="text-slate-400" />
                <span className="text-[9px] text-slate-400 font-bold mt-1">Thêm ảnh</span>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}

type KocCampaignItem = {
  bookingId: number;
  campaignId: number;
  name: string;
  brand: string;
  platform: string;
  payout: string;
  deadline: string;
  status: "Đang tham gia" | "Chờ duyệt" | "Hoàn thành" | "Đã hủy" | "Bị từ chối";
};

function mapBookingStatus(status: Booking["status"]): KocCampaignItem["status"] {
  if (status === "accepted") return "Đang tham gia";
  if (status === "pending") return "Chờ duyệt";
  if (status === "completed") return "Hoàn thành";
  if (status === "rejected") return "Bị từ chối";
  return "Đã hủy";
}

const CATEGORIES = ["Beauty", "Fashion", "Tech", "Food", "Travel", "Lifestyle", "Education", "Healthcare", "Gaming"];
const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Facebook"];
const AI_CAMPAIGN_DRAFT_KEY = "kolab_ai_campaign_draft";
const CAMPAIGN_PAYMENT_CHECKOUT_KEY = "kolab_campaign_payment_checkout";

type CampaignFormData = {
  title: string;
  description: string;
  category: string;
  platform: string;
  budget: string;
  start_date: string;
  end_date: string;
  product_name: string;
  product_description: string;
  product_images: string[];
};

type AiCampaignDraftState = {
  source?: string;
  aiBrief?: AutoBriefResult;
  optionalFields?: {
    brand?: string | null;
    product?: string | null;
    platform?: string | null;
    targetAudience?: string | null;
    budget?: string | null;
  };
};

const analyticsPalette = ["#FF3300", "#008080", "#38BDF8", "#10B981", "#8B5CF6", "#F59E0B"];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchOption(options: string[], value?: string | null) {
  if (!value) return "";
  const normalized = normalizeText(value);
  return options.find((option) => normalized.includes(normalizeText(option)) || normalizeText(option).includes(normalized)) || "";
}

function compactLines(lines: Array<string | null | undefined>) {
  return lines
    .map((line) => (line || "").trim())
    .filter(Boolean)
    .join("\n");
}

function listBlock(title: string, items: string[]) {
  if (!items.length) return "";
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function parseBudgetValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const amount = parseCurrency(value || "");
    if (amount > 0) return String(amount);
  }
  return "";
}

function mapAiBriefToCampaignForm(brief: AutoBriefResult, optionalFields: AiCampaignDraftState["optionalFields"] = {}): CampaignFormData {
  const platform = matchOption(PLATFORMS, optionalFields?.platform) || matchOption(PLATFORMS, `${brief.contentDirection.join(" ")} ${brief.deliverables.join(" ")}`);
  const category = matchOption(CATEGORIES, `${optionalFields?.product || ""} ${brief.campaignTitle} ${brief.keyMessages.join(" ")} ${brief.suggestedKocProfile.join(" ")}`) || CATEGORIES[0];

  return {
    title: brief.campaignTitle || "",
    description: compactLines([
      optionalFields?.brand ? `Thương hiệu: ${optionalFields.brand}` : "",
      optionalFields?.product ? `Sản phẩm: ${optionalFields.product}` : "",
      brief.targetAudience ? `Khách hàng mục tiêu: ${brief.targetAudience}` : "",
      listBlock("Mục tiêu", brief.objectives),
      listBlock("Định hướng nội dung", brief.contentDirection),
      listBlock("Thông điệp chính", brief.keyMessages),
      listBlock("Hồ sơ KOC đề xuất", brief.suggestedKocProfile),
      listBlock("Đầu việc cần bàn giao", brief.deliverables),
      brief.cta ? `CTA: ${brief.cta}` : "",
      brief.hashtags.length ? `Hashtags: ${brief.hashtags.join(" ")}` : "",
      brief.timeline ? `Timeline: ${brief.timeline}` : "",
    ]),
    category,
    platform: platform || PLATFORMS[0],
    budget: parseBudgetValue(optionalFields?.budget, brief.budgetSuggestion),
    start_date: "",
    end_date: "",
    product_name: optionalFields?.product || "",
    product_description: "",
    product_images: [],
  };
}

function isAiCampaignDraft(value: unknown): value is AiCampaignDraftState {
  return Boolean(
    value &&
    typeof value === "object" &&
    (value as AiCampaignDraftState).source === "auto-brief" &&
    (value as AiCampaignDraftState).aiBrief
  );
}

function readAiCampaignDraftFromSession() {
  try {
    const raw = sessionStorage.getItem(AI_CAMPAIGN_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isAiCampaignDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clearAiCampaignDraft() {
  sessionStorage.removeItem(AI_CAMPAIGN_DRAFT_KEY);
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// --- ANALYTICS BUILDERS ---
function buildMarketerStatusData(campaigns: Campaign[]) {
  const statusOrder: CampaignStatus[] = ["draft", "open", "in_progress", "completed", "cancelled"];
  const labels: Record<CampaignStatus, string> = {
    draft: "Bản nháp",
    scheduled: "Đã lên lịch",
    open: "Đang mở",
    paused: "Tạm dừng",
    in_progress: "Đang chạy",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    pending_payment: "Chờ thanh toán",
  };

  return statusOrder
    .map((status, index) => ({
      name: labels[status],
      value: campaigns.filter((campaign) => campaign.status === status).length,
      fill: analyticsPalette[index % analyticsPalette.length],
    }))
    .filter((item) => item.value > 0);
}

function buildBudgetByPlatform(campaigns: Campaign[]) {
  const grouped = new Map<string, number>();
  campaigns.forEach((campaign) => {
    const key = campaign.platform || "Khác";
    grouped.set(key, (grouped.get(key) || 0) + Number(campaign.budget || 0));
  });

  return Array.from(grouped.entries()).map(([platform, budget], index) => ({
    platform,
    budget,
    fill: analyticsPalette[index % analyticsPalette.length],
  }));
}

function buildCampaignTrend(campaigns: Campaign[]) {
  const grouped = new Map<string, { budget: number; campaigns: number }>();
  campaigns.forEach((campaign, index) => {
    const month = monthLabel(campaign.createdAt, index);
    const current = grouped.get(month) || { budget: 0, campaigns: 0 };
    current.budget += Number(campaign.budget || 0);
    current.campaigns += 1;
    grouped.set(month, current);
  });

  const rows = Array.from(grouped.entries()).map(([month, value]) => ({
    month,
    budget: value.budget,
    campaigns: value.campaigns,
  }));

  if (rows.length >= 2) return rows;
  return [{ month: "T1", budget: 0, campaigns: 0 }];
}

function buildProgressAnalysis(campaigns: Campaign[]) {
  return campaigns
    .slice()
    .sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0))
    .slice(0, 5)
    .map((campaign) => ({
      name: campaign.title.length > 18 ? `${campaign.title.slice(0, 18)}...` : campaign.title,
      progress: toProgress(campaign.status),
    }));
}

function buildKocStatusData(items: KocCampaignItem[]) {
  const grouped = new Map<string, number>();
  items.forEach((item) => {
    grouped.set(item.status || "Khác", (grouped.get(item.status || "Khác") || 0) + 1);
  });

  return Array.from(grouped.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: analyticsPalette[index % analyticsPalette.length],
  }));
}

function buildIncomeBreakdown(items: KocCampaignItem[]) {
  const grouped = new Map<string, number>();
  items.forEach((item) => {
    grouped.set(item.status, (grouped.get(item.status) || 0) + parseCurrency(item.payout));
  });

  return Array.from(grouped.entries()).map(([status, income], index) => ({
    status,
    income,
    fill: analyticsPalette[index % analyticsPalette.length],
  }));
}

function buildParticipationTrend(items: KocCampaignItem[]) {
  if (items.length === 0) return [{ month: "T1", income: 0, participations: 0 }];
  return items.slice(0, 6).map((item, index) => ({
    month: `M${index + 1}`,
    income: parseCurrency(item.payout),
    participations: index + 1,
  }));
}

function buildCategoryParticipation(items: KocCampaignItem[]) {
  const grouped = new Map<string, number>();
  items.forEach((item) => {
    grouped.set(item.brand || "Campaign", (grouped.get(item.brand || "Campaign") || 0) + 1);
  });

  return Array.from(grouped.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// --- SHARED UI COMPONENTS ---
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, aside, footer, className = "", isEmpty = false }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode; footer?: ReactNode; className?: string; isEmpty?: boolean }) {
  return (
    <section className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md ${className}`.trim()}>
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle ? <p className="max-w-xl text-xs text-slate-500">{subtitle}</p> : null}
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
      </div>
      <div className="px-5 py-4 relative min-h-[240px]">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <BarChart3 size={32} strokeWidth={1.5} />
            <p className="text-xs font-medium">Chưa có dữ liệu thống kê</p>
          </div>
        ) : children}
      </div>
      {footer ? <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-3">{footer}</div> : null}
    </section>
  );
}

function DonutChartCard({ title, subtitle, centerLabel, centerValue, data }: { title: string; subtitle?: string; centerLabel?: string; centerValue?: string; data: any[] }) {
  const isEmpty = data.length === 0;
  const chartConfig = Object.fromEntries(data.map((item) => [item.name, { label: item.name, color: item.fill }]));
  return (
    <ChartCard title={title} subtitle={subtitle} isEmpty={isEmpty}>
      {!isEmpty && (
        <ChartContainer config={chartConfig} className="w-full h-[240px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={5}>
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-2xl font-bold">{centerValue}</tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-slate-500 text-xs">{centerLabel}</tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <Legend />
          </PieChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

function LineChartCard({ title, data, dataKey, xKey, color, variant = "line", yTickFormatter }: { title: string; data: any[]; dataKey: string; xKey: string; color: string; variant?: "line" | "area"; yTickFormatter?: any }) {
  const isEmpty = data.length === 0 || (data.length === 1 && data[0][dataKey] === 0);
  return (
    <ChartCard title={title} isEmpty={isEmpty}>
      {!isEmpty && (
        <ChartContainer config={{ [dataKey]: { label: title, color } }} className="w-full h-[240px]">
          {variant === "area" ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={yTickFormatter} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.1} />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={yTickFormatter} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          )}
        </ChartContainer>
      )}
    </ChartCard>
  );
}

function BarChartCard({ title, data, xKey, dataKey, color = "#FF3300", layout = "horizontal", yTickFormatter, colors }: { title: string; data: any[]; xKey: string; dataKey: string; color?: string; layout?: "horizontal" | "vertical"; yTickFormatter?: any; colors?: string[] }) {
  const isEmpty = data.length === 0;
  return (
    <ChartCard title={title} isEmpty={isEmpty}>
      {!isEmpty && (
        <ChartContainer config={{ [dataKey]: { label: title, color } }} className="w-full h-[240px]">
          <BarChart data={data} layout={layout} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={layout === "horizontal"} horizontal={layout === "vertical"} strokeDasharray="3 3" />
            {layout === "horizontal" ? (
              <><XAxis dataKey={xKey} tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={yTickFormatter} /></>
            ) : (
              <><XAxis type="number" tickLine={false} axisLine={false} tickFormatter={yTickFormatter} /><YAxis type="category" dataKey={xKey} tickLine={false} axisLine={false} width={100} /></>
            )}
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey={dataKey} radius={layout === "horizontal" ? [4, 4, 0, 0] : [0, 4, 4, 0]} fill={color}>
              {colors && data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

// --- ANALYTICS COMPONENTS ---
function MarketerCampaignAnalytics({ campaigns }: { campaigns: Campaign[] }) {
  const statusData = useMemo(() => buildMarketerStatusData(campaigns), [campaigns]);
  const platformData = useMemo(() => buildBudgetByPlatform(campaigns), [campaigns]);
  const trendData = useMemo(() => buildCampaignTrend(campaigns), [campaigns]);
  const progressData = useMemo(() => buildProgressAnalysis(campaigns), [campaigns]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DonutChartCard title="Trạng thái chiến dịch" data={statusData} centerValue={String(campaigns.length)} centerLabel="Tổng cộng" />
      <BarChartCard title="Ngân sách theo nền tảng" data={platformData} xKey="platform" dataKey="budget" yTickFormatter={formatCurrencyShort} />
      <LineChartCard title="Xu hướng ngân sách" data={trendData} xKey="month" dataKey="budget" color="#FF3300" variant="area" yTickFormatter={formatCurrencyShort} />
      <BarChartCard title="Tiến độ dự án lớn" data={progressData} xKey="name" dataKey="progress" layout="vertical" color="#10B981" yTickFormatter={(v: any) => `${v}%`} />
    </div>
  );
}

function KocCampaignAnalytics({ items }: { items: KocCampaignItem[] }) {
  const statusData = useMemo(() => buildKocStatusData(items), [items]);
  const incomeData = useMemo(() => buildIncomeBreakdown(items), [items]);
  const trendData = useMemo(() => buildParticipationTrend(items), [items]);
  const categoryData = useMemo(() => buildCategoryParticipation(items), [items]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DonutChartCard title="Phân bổ trạng thái job" data={statusData} centerValue={String(items.length)} centerLabel="Job đã nhận" />
      <BarChartCard title="Thu nhập theo trạng thái" data={incomeData} xKey="status" dataKey="income" yTickFormatter={formatCurrencyShort} colors={analyticsPalette} />
      <LineChartCard title="Tăng trưởng thu nhập" data={trendData} xKey="month" dataKey="income" color="#8B5CF6" variant="area" yTickFormatter={formatCurrencyShort} />
      <BarChartCard title="Lĩnh vực tham gia nhiều nhất" data={categoryData} xKey="category" dataKey="count" layout="vertical" color="#38BDF8" />
    </div>
  );
}

const kocStatusStyles: Record<string, string> = {
  "Đang tham gia": "bg-emerald-100 text-emerald-700",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Hoàn thành": "bg-blue-100 text-blue-700",
  "Bị từ chối": "bg-rose-100 text-rose-700",
  "Đã hủy": "bg-slate-100 text-slate-700",
};

// --- SUB-COMPONENT: APPLICATION MODAL FOR KOC ---
function ApplicationModal({ campaign, onClose, onSuccess }: { campaign: Campaign; onClose: () => void; onSuccess: () => void; }) {
  const [loading, setLoading] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [data, setData] = useState({
    offeredPrice: String(campaign.budget || 0),
    note: "",
    estimatedDeliveryDays: "7",
    sampleLink: "",
  });

  const formattedPrice = useMemo(() => {
    const val = Number(data.offeredPrice);
    if (isNaN(val) || val === 0) return "0 VND";
    return new Intl.NumberFormat("vi-VN").format(val) + " VND";
  }, [data.offeredPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBooking({
        campaignId: campaign.id,
        direction: "koc_applied",
        offeredPrice: Number(data.offeredPrice),
        note: data.note,
        estimatedDeliveryDays: Number(data.estimatedDeliveryDays),
        sampleLink: data.sampleLink,
      });
      alert("Đã nộp hồ sơ ứng tuyển thành công!");
      onSuccess();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-[40px] p-0 overflow-hidden shadow-2xl border-0 flex flex-col max-h-[90vh]">
        <div className="bg-primary p-8 text-white relative overflow-hidden shrink-0">
          <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-white/10 rotate-12" />
          <div className="relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full mb-4 border border-white/20">
                 <Target size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white">Gửi Đề Xuất</span>
             </div>
            <DialogTitle className="text-3xl font-black mb-2">Ứng tuyển chiến dịch</DialogTitle>
            <DialogDescription className="text-blue-100 font-medium text-lg">{campaign.title}</DialogDescription>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white overflow-y-auto flex-1">
          {/* Sponsor Product Info Section */}
          {(campaign.productName || (campaign.productImages && campaign.productImages.length > 0)) && (
            <div className="border border-slate-100 rounded-3xl p-5 bg-slate-50/50 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary">
                Thông tin sản phẩm tài trợ
              </h4>
              
              {/* Slideshow */}
              {campaign.productImages && campaign.productImages.length > 0 && (
                <div className="space-y-2">
                  <div className="h-48 w-full rounded-2xl overflow-hidden bg-slate-100 relative border border-slate-100 shrink-0">
                    <img 
                      src={campaign.productImages[activeImageIdx]} 
                      alt={campaign.productName} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {campaign.productImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {campaign.productImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIdx(idx)}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                            idx === activeImageIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Product Details */}
              <div className="space-y-1">
                {campaign.productName && (
                  <p className="text-base font-bold text-slate-800">{campaign.productName}</p>
                )}
                {campaign.productDescription && (
                  <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">
                    {campaign.productDescription}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Báo giá của bạn</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={formatThousands(data.offeredPrice)} 
                  onChange={e => setData({ ...data, offeredPrice: String(parseThousands(e.target.value)) })} 
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-lg text-primary"
                  required 
                />
              </div>
              <p className="text-xs font-medium text-emerald-400 ml-1">Thực nhận: {formattedPrice}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Ngày hoàn thành</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  value={data.estimatedDeliveryDays} 
                  onChange={e => setData({ ...data, estimatedDeliveryDays: e.target.value })} 
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-lg text-slate-900"
                  required 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Ngày</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Link video mẫu (TikTok/Drive)</label>
            <div className="relative">
                <input 
                  type="url" 
                  value={data.sampleLink} 
                  onChange={e => setData({ ...data, sampleLink: e.target.value })} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium text-slate-900"
                  placeholder="https://tiktok.com/@your_video"
                />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center justify-between">
              Lời giới thiệu (Pitching)
              <span className="text-slate-400 font-medium normal-case tracking-normal">Giúp bạn tăng 80% cơ hội</span>
            </label>
            <textarea 
              rows={4} 
              value={data.note} 
              onChange={e => setData({ ...data, note: e.target.value })} 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium resize-none text-slate-900"
              placeholder="VD: Chào nhãn hàng, mình là chuyên gia review mảng Beauty. Với job này, mình dự kiến sẽ làm video concept biến hình..."
              required 
            />
          </div>
          <DialogFooter className="pt-4 flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="px-6 py-4 h-auto rounded-2xl font-bold">
              Hủy bỏ
            </Button>
            <button 
              type="submit" 
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2 disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? "Đang gửi..." : "Gửi hồ sơ ngay"}
              {!loading && <Send size={18} />}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN PAGE ---
export function CampaignsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMarketer = location.pathname.includes("/marketer/");

  const [activeTab, setActiveTab] = useState<"my_jobs" | "discover">("my_jobs");
  
  // Marketer state
  const [marketerCampaigns, setMarketerCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({ 
    title: "", 
    description: "", 
    category: CATEGORIES[0], 
    platform: PLATFORMS[0], 
    budget: "",
    start_date: "",
    end_date: "",
    product_name: "",
    product_description: "",
    product_images: []
  });
  const [aiBriefPrefillNotice, setAiBriefPrefillNotice] = useState(false);
  const [guestAiBriefRestored, setGuestAiBriefRestored] = useState(false);
  const [aiDraftLoaded, setAiDraftLoaded] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const createInFlightRef = useRef(false);
  const createIdempotencyKeyRef = useRef<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // KOC state
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [kocCampaigns, setKocCampaigns] = useState<KocCampaignItem[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const fetchMarketerData = async () => {
    setLoading(true);
    try {
      const cleanFilters: any = {};
      if (statusFilter) cleanFilters.status = statusFilter;
      if (platformFilter) cleanFilters.platform = platformFilter;
      if (categoryFilter) cleanFilters.category = categoryFilter;

      const res = await campaignService.listCampaigns(cleanFilters);
      setMarketerCampaigns(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKocData = async () => {
    setLoading(true);
    try {
      const [avail, bookingsRes, campaignsRes] = await Promise.all([
        campaignService.listAvailableCampaigns(),
        listBookings(),
        campaignService.listCampaigns({})
      ]);
      setAvailableCampaigns(avail.items);
      setMyBookings(bookingsRes.items);

      const campaignMap = new Map(campaignsRes.items.map(c => [c.id, c]));
      const mapped = bookingsRes.items.map((b: any) => {
        const c = campaignMap.get(b.campaignId);
        return {
          bookingId: b.id,
          campaignId: b.campaignId,
          name: c?.title || `Campaign #${b.campaignId}`,
          brand: c?.category || "Campaign",
          platform: c?.platform || "N/A",
          payout: formatCurrency(b.offeredPrice || 0),
          deadline: `Cập nhật ${formatDate(b.updatedAt)}`,
          status: mapBookingStatus(b.status),
        };
      });
      setKocCampaigns(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMarketer) fetchMarketerData();
    else fetchKocData();
  }, [isMarketer, statusFilter, platformFilter, categoryFilter]);

  useEffect(() => {
    if (!isMarketer || aiDraftLoaded) return;

    const routeDraft = isAiCampaignDraft(location.state) ? location.state : null;
    const sessionDraft = routeDraft ? null : readAiCampaignDraftFromSession();
    const restoreGuestDraft = consumePostLoginHandoff("create-campaign-from-ai-brief");
    const guestDraft = routeDraft || sessionDraft || !restoreGuestDraft ? null : readGuestAiBriefDraft();
    const draft = routeDraft || sessionDraft || (guestDraft ? {
      source: "auto-brief",
      aiBrief: guestDraft.result,
      optionalFields: {
        brand: guestDraft.form.brand || null,
        product: guestDraft.form.product || null,
        platform: guestDraft.form.platform || null,
        targetAudience: guestDraft.form.targetAudience || null,
        budget: guestDraft.form.budget || null,
      },
    } : null);

    if (!draft?.aiBrief) {
      setAiDraftLoaded(true);
      return;
    }

    setFormData(mapAiBriefToCampaignForm(draft.aiBrief, draft.optionalFields));
    setAiBriefPrefillNotice(true);
    setIsCreateOpen(true);
    setErrorMsg(null);
    setAiDraftLoaded(true);
    if (guestDraft) {
      setGuestAiBriefRestored(true);
      clearGuestAiBriefDraft();
    }


    if (routeDraft) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [aiDraftLoaded, isMarketer, location.pathname, location.state, navigate]);

  const handleCreate = async () => {
    if (createInFlightRef.current) return;
    createInFlightRef.current = true;
    setCreatingPayment(true);
    setErrorMsg(null);
    try {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setErrorMsg("Vui lòng nhập ngày bắt đầu và ngày kết thúc hợp lệ.");
        return;
      }
      const idempotencyKey = createIdempotencyKeyRef.current || createIdempotencyKey();
      createIdempotencyKeyRef.current = idempotencyKey;

      const res = await campaignService.createCampaign({
        ...formData,
        budget: Number(formData.budget),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }, idempotencyKey);

      setCreatedCampaign(res.campaign);
      setIsCreateOpen(false);
      setIsSuccessOpen(true);
      fetchMarketerData();
      clearAiCampaignDraft();
    } catch (err: any) {
      if (err.payload?.errors) {
        const firstError = err.payload.errors[0]?.message;
        setErrorMsg(firstError || err.message);
      } else {
        setErrorMsg(err.message);
      }
    } finally {
      createInFlightRef.current = false;
      setCreatingPayment(false);
    }
  };

  const openCreateDialog = () => {
    setErrorMsg(null);
    createIdempotencyKeyRef.current = null;
    setFormData({
      title: "",
      description: "",
      category: CATEGORIES[0],
      platform: PLATFORMS[0],
      budget: "",
      start_date: "",
      end_date: "",
      product_name: "",
      product_description: "",
      product_images: []
    });
    setIsCreateOpen(true);
  };

  const cancelCreateDialog = () => {
    setIsCreateOpen(false);
    setAiBriefPrefillNotice(false);
    clearAiCampaignDraft();
    createIdempotencyKeyRef.current = null;
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      const payload = {
        title: editingItem.title,
        description: editingItem.description,
        category: editingItem.category,
        platform: editingItem.platform,
        budget: editingItem.budget,
        status: editingItem.status,
        start_date: new Date(editingItem.startDate).toISOString(),
        end_date: new Date(editingItem.endDate).toISOString(),
        product_name: editingItem.productName || null,
        product_description: editingItem.productDescription || null,
        product_images: editingItem.productImages || []
      };
      await campaignService.updateCampaign(editingItem.id, payload);
      setIsEditOpen(false);
      setEditingItem(null);
      fetchMarketerData();
      alert("Cập nhật thành công!");
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    
    if (now >= startDate) {
      alert("Chiến dịch đang trong thời gian chạy hoặc đã chạy, không thể xóa. Bạn chỉ có thể tạm dừng hoặc hủy.");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa chiến dịch này?")) return;
    try {
      await campaignService.deleteCampaign(campaign.id);
      fetchMarketerData();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const toStatusLabelAny = (status: string) => {
     if (status === 'open') return "Đang mở";
     if (status === 'scheduled') return "Đã lên lịch";
     if (status === 'paused') return "Tạm dừng";
     if (status === 'completed') return "Hoàn thành";
     if (status === 'cancelled') return "Đã hủy";
     if (status === 'pending_payment') return "Chờ thanh toán";
     return status;
  };

  const toStatusStyleAny = (status: string) => {
    if (status === "open") return "bg-green-100 text-green-700";
    if (status === "scheduled") return "bg-blue-100 text-blue-700";
    if (status === "paused") return "bg-amber-100 text-amber-700";
    if (status === "completed") return "bg-slate-200 text-slate-700";
    if (status === "cancelled") return "bg-rose-100 text-rose-700";
    if (status === "pending_payment") return "bg-yellow-100 text-yellow-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <DashboardLayout role={isMarketer ? "marketer" : "koc"}>
      <div className="space-y-6 rounded-[28px] border border-slate-200/80 bg-slate-100 p-4 shadow-sm md:p-5">
        {isMarketer ? (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Quản lý Chiến dịch</h1>
                <p className="text-slate-600">Theo dõi tiến độ và ngân sách Brand của bạn.</p>
              </div>
              <Button 
                onClick={openCreateDialog}
                className="bg-primary text-white hover:bg-primary-hover rounded-xl px-6 h-12 font-bold shadow-lg shadow-primary/10"
              >
                <Plus size={20} className="mr-2" /> Tạo chiến dịch mới
              </Button>
            </div>
            <div className="campaign-filter-bar grid gap-3 rounded-2xl border p-4 shadow-sm md:grid-cols-3">
              <Dropdown className="campaign-filter-select" options={[{ label: "Trạng thái", value: "" }, { label: "Bản nháp", value: "draft" }, { label: "Đã lên lịch", value: "scheduled" }, { label: "Đang mở", value: "open" }, { label: "Đang chạy", value: "in_progress" }, { label: "Hoàn thành", value: "completed" }, { label: "Chờ thanh toán", value: "pending_payment" }]} value={statusFilter} onChange={setStatusFilter} placeholder="Trạng thái" />
              <Dropdown className="campaign-filter-select" options={[{ label: "Nền tảng", value: "" }, { label: "TikTok", value: "TikTok" }, { label: "Instagram", value: "Instagram" }]} value={platformFilter} onChange={setPlatformFilter} placeholder="Nền tảng" />
              <Dropdown className="campaign-filter-select" options={[{ label: "Lĩnh vực", value: "" }, { label: "Làm đẹp", value: "Làm đẹp" }, { label: "Công nghệ", value: "Công nghệ" }]} value={categoryFilter} onChange={setCategoryFilter} placeholder="Lĩnh vực" />
            </div>
            <section className="space-y-4">
              <SectionTitle title="Campaign Analytics" subtitle="Phân tích hiệu suất." />
              <MarketerCampaignAnalytics campaigns={marketerCampaigns} />
            </section>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 p-6"><h2 className="text-xl font-bold">Danh sách của bạn</h2></div>
              {loading ? <div className="p-6">Đang tải...</div> : marketerCampaigns.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-slate-400">Bạn chưa có chiến dịch nào.</p>
                  <Button variant="link" onClick={() => setIsCreateOpen(true)}>Bắt đầu tạo ngay</Button>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {marketerCampaigns.map(c => {
                    const isRunning = new Date() >= new Date(c.startDate);
                    return (
                      <div key={c.id} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="cursor-pointer" onClick={() => navigate(`/marketer/campaigns/${c.id}`)}>
                            <h3 className="font-bold group-hover:text-primary transition-colors">{c.title}</h3>
                            <p className="text-sm text-slate-500">{c.platform} • {c.category}</p>
                            <p className="text-xs text-slate-400 mt-1">{formatDate(c.startDate)} - {formatDate(c.endDate)}</p>
                          </div>
                          <span className="font-semibold text-primary">{formatCurrency(c.budget || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${toStatusStyleAny(c.status)}`}>{toStatusLabelAny(c.status)}</span>
                            {c.status === "pending_payment" && (
                              <Button 
                                size="sm" 
                                className="bg-primary hover:bg-primary-hover text-white rounded-xl px-4 py-1.5 text-xs font-bold shadow-sm"
                                onClick={async (e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await campaignService.payCampaign(c.id);
                                    if (res.checkoutUrl) {
                                      window.location.href = res.checkoutUrl;
                                    }
                                  } catch (err: any) {
                                    alert("Lỗi thanh toán: " + err.message);
                                  }
                                }}
                              >
                                Thanh toán ngay
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => { setEditingItem(c); setIsEditOpen(true); }}>
                              <Edit size={16} className="text-slate-400" />
                            </Button>
                            <Button 
                              variant="ghost" size="icon" 
                              className={`h-9 w-9 rounded-lg ${isRunning ? 'opacity-30 cursor-not-allowed' : 'hover:bg-rose-50 hover:text-rose-600'}`} 
                              onClick={() => handleDelete(c)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Chiến dịch & Công việc</h1>
                <p className="text-slate-600">Tìm kiếm cơ hội và quản lý công việc.</p>
              </div>
            </div>
            <div className="flex border-b border-slate-200">
              <button onClick={() => setActiveTab("my_jobs")} className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === "my_jobs" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                <div className="flex items-center gap-2"><Briefcase size={16} /> Đang tham gia ({kocCampaigns.length})</div>
              </button>
              <button onClick={() => setActiveTab("discover")} className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === "discover" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                <div className="flex items-center gap-2"><Search size={16} /> Khám phá Job mới</div>
              </button>
            </div>
            {activeTab === "my_jobs" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-3 flex items-center justify-between"><p className="text-sm text-slate-600">Đang tham gia</p><Activity className="text-primary" size={20} /></div><p className="text-2xl font-bold">{kocCampaigns.filter(i => i.status === "Đang tham gia").length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-3 flex items-center justify-between"><p className="text-sm text-slate-600">Chờ duyệt</p><Clock className="text-amber-600" size={20} /></div><p className="text-2xl font-bold">{kocCampaigns.filter(i => i.status === "Chờ duyệt").length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-3 flex items-center justify-between"><p className="text-sm text-slate-600">Hoàn thành</p><CheckCircle className="text-emerald-600" size={20} /></div><p className="text-2xl font-bold">{kocCampaigns.filter(i => i.status === "Hoàn thành").length}</p></div>
                </div>
                <section className="space-y-4">
                  <SectionTitle title="Phân tích công việc" subtitle="Hiệu suất của bạn." />
                  <KocCampaignAnalytics items={kocCampaigns} />
                </section>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-50 p-6"><h2 className="text-lg font-bold">Lịch sử tham gia</h2></div>
                  {loading ? <div className="p-12 text-center text-slate-500">Đang tải...</div> : (
                    <div className="divide-y divide-slate-100">
                      {kocCampaigns.length > 0 ? kocCampaigns.map(i => (
                        <div key={i.bookingId} className="p-6 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/koc/campaigns/${i.bookingId}`)}>
                              <h3 className="font-bold hover:text-primary transition-colors">{i.name}</h3>
                              <div className="flex items-center gap-3 text-sm text-slate-500"><span className="flex items-center gap-1"><Layers3 size={14} /> {i.brand}</span><span className="flex items-center gap-1"><Calendar size={14} /> {i.deadline}</span></div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600 mb-2">{i.payout}</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${kocStatusStyles[i.status] || "bg-slate-100"}`}>{i.status}</span>
                            </div>
                          </div>
                          {i.status === "Đang tham gia" && (
                            <div className="mt-4 flex gap-2">
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/koc/messages?bookingId=${i.bookingId}`)}>Nhắn tin</Button>
                              <Button size="sm" className="text-xs bg-primary text-white" onClick={() => navigate(`/koc/campaigns/${i.bookingId}`)}>Nộp sản phẩm</Button>
                            </div>
                          )}
                        </div>
                      )) : <div className="p-12 text-center text-slate-500">Chưa có job. <Button variant="link" onClick={() => setActiveTab("discover")}>Khám phá ngay</Button></div>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {loading ? [1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl" />) : (
                    availableCampaigns.length > 0 ? availableCampaigns.map(c => (
                      <div key={c.id} className="group rounded-3xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl transition-all flex flex-col justify-between">
                        <div>
                          <div className="h-44 w-full bg-slate-100 relative overflow-hidden shrink-0">
                            {c.productImages && c.productImages.length > 0 ? (
                              <img src={c.productImages[0]} alt={c.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#1E3B8E]/20 to-[#1E3B8E]/5 flex items-center justify-center text-[#1E3B8E]/40">
                                <Rocket size={40} className="group-hover:rotate-12 transition-transform" />
                              </div>
                            )}
                            <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-emerald-700 shadow-sm">
                              {formatCurrencyShort(c.budget || 0)}
                            </span>
                          </div>
                          <div className="p-6">
                            {c.productName && (
                              <p className="text-xs font-black uppercase tracking-wider text-primary mb-1 line-clamp-1">
                                Sản phẩm: {c.productName}
                              </p>
                            )}
                            <h3 className="mb-2 text-lg font-bold line-clamp-1">{c.title}</h3>
                            <p className="mb-4 text-sm text-slate-500 line-clamp-2">{c.description || "Chưa có mô tả."}</p>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{c.platform}</span>
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-primary">{c.category}</span>
                            </div>
                            <p className="text-xs text-slate-400">Thời gian: {formatDate(c.startDate)} - {formatDate(c.endDate)}</p>
                          </div>
                        </div>
                        <div className="p-6 pt-0">
                          <Button onClick={() => setSelectedCampaign(c)} className="w-full bg-slate-900 text-white hover:bg-primary transition-colors rounded-xl">Ứng tuyển ngay</Button>
                        </div>
                      </div>
                    )) : <div className="col-span-full py-12 text-center text-slate-500">Không có job mới.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* SUCCESS DIALOG */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 text-center shadow-2xl border-0 flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={36} />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 mb-2">Tạo thành công!</DialogTitle>
          <DialogDescription className="text-slate-500 text-sm leading-relaxed mb-6">
            Chiến dịch của bạn đã được khởi tạo thành công. Bạn có muốn sử dụng tính năng AI Smart Matching để tìm kiếm KOC phù hợp ngay bây giờ không?
          </DialogDescription>
          <div className="flex w-full gap-3">
            <button
              onClick={() => setIsSuccessOpen(false)}
              className="flex-1 py-3.5 border-2 border-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-colors text-sm"
            >
              Xem danh sách
            </button>
            <button
              onClick={() => {
                if (createdCampaign) {
                  const state = { source: "campaign-created", campaign: createdCampaign } as const;
                  sessionStorage.setItem("kolab_smart_matching_campaign_draft", JSON.stringify(state));
                  navigate("/marketer/smart-matching", { state });
                }
                setIsSuccessOpen(false);
              }}
              className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm"
            >
              <Sparkles size={16} /> Matching ngay
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE DIALOG */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open: boolean) => {
          if (open) {
            setIsCreateOpen(true);
            return;
          }
          cancelCreateDialog();
        }}
      >
        <DialogContent className="create-campaign-modal rounded-3xl p-0 shadow-2xl">
          <div className="campaign-modal__header bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Tạo chiến dịch mới</DialogTitle>
            <DialogDescription className="text-blue-100 opacity-90">Hoàn thiện thông tin để KOC có thể ứng tuyển.</DialogDescription>
          </div>
          <div className="campaign-modal__body create-campaign-modal-body space-y-4">
             {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3">
                   <AlertCircle size={20} />
                   <p className="text-sm font-medium">{errorMsg}</p>
                </div>
             )}
             {aiBriefPrefillNotice && !guestAiBriefRestored && (
                <div className="p-4 bg-orange-50 border border-orange-100 text-orange-800 rounded-2xl flex items-center gap-3">
                   <Sparkles size={20} />
                   <p className="text-sm font-medium">Đã điền nội dung từ AI Brief. Hãy kiểm tra trước khi tạo chiến dịch.</p>
                </div>
             )}
             {guestAiBriefRestored && (
                <div className="p-4 bg-orange-50 border border-orange-100 text-orange-800 rounded-2xl flex items-center gap-3">
                   <Sparkles size={20} />
                   <p className="text-sm font-medium">{"\u0110\u00e3 kh\u00f4i ph\u1ee5c AI Brief d\u00f9ng th\u1eed. H\u00e3y ki\u1ec3m tra tr\u01b0\u1edbc khi t\u1ea1o chi\u1ebfn d\u1ecbch."}</p>
                </div>
             )}

             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Tiêu đề (Tối thiểu 5 ký tự)</label>
               <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="VD: Chiến dịch hè 2026" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Mô tả chi tiết (Tối thiểu 20 ký tự)</label>
               <Textarea className="campaign-description-textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Yêu cầu cụ thể cho KOC..." rows={4} />
             </div>
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Lĩnh vực</label>
                 <select 
                   className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-slate-50 text-sm focus:ring-[#1E3B8E]" 
                   value={formData.category} 
                   onChange={e => setFormData({...formData, category: e.target.value})}
                 >
                   {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Nền tảng</label>
                 <select 
                   className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-slate-50 text-sm focus:ring-[#1E3B8E]" 
                   value={formData.platform} 
                   onChange={e => setFormData({...formData, platform: e.target.value})}
                 >
                   {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Ngân sách (VND)</label>
                <Input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} placeholder="VD: 10000000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Tên sản phẩm tài trợ (Nếu có)</label>
                <Input value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} placeholder="VD: Sữa rửa mặt Simple" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Mô tả sản phẩm tài trợ</label>
                <Textarea value={formData.product_description} onChange={e => setFormData({...formData, product_description: e.target.value})} placeholder="Thông số, công dụng, yêu cầu review sản phẩm..." rows={3} />
              </div>
              <ProductImagesUpload images={formData.product_images} onChange={imgs => setFormData({...formData, product_images: imgs})} />
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Ngày bắt đầu</label>
                 <Input type="datetime-local" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Ngày kết thúc</label>
                 <Input type="datetime-local" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
               </div>
             </div>
          </div>
          <DialogFooter className="campaign-modal__footer">
             <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
             <Button
               className="create-campaign-submit h-11 w-full px-8 sm:w-auto"
               onClick={handleCreate}
               disabled={creatingPayment}
             >
               {creatingPayment ? "Đang tạo thanh toán..." : "Xác nhận tạo"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="create-campaign-modal max-w-2xl rounded-3xl p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <div className="bg-primary p-8 text-white shrink-0">
            <DialogTitle className="text-2xl font-bold">Sửa chiến dịch</DialogTitle>
          </div>
          <div className="create-campaign-modal-body p-8 space-y-4 overflow-y-auto flex-1">
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Tiêu đề</label>
               <Input value={editingItem?.title || ""} onChange={e => setEditingItem(prev => prev ? {...prev, title: e.target.value} : null)} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Lĩnh vực</label>
                  <select className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-slate-50 focus:ring-primary" value={editingItem?.category || ""} onChange={e => setEditingItem(prev => prev ? {...prev, category: e.target.value} : null)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nền tảng</label>
                  <select className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-slate-50 focus:ring-primary" value={editingItem?.platform || ""} onChange={e => setEditingItem(prev => prev ? {...prev, platform: e.target.value} : null)}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Ngày bắt đầu</label>
                 <Input type="datetime-local" value={editingItem?.startDate ? new Date(editingItem.startDate).toISOString().slice(0, 16) : ""} onChange={e => setEditingItem(prev => prev ? {...prev, startDate: e.target.value} : null)} />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Ngày kết thúc</label>
                 <Input type="datetime-local" value={editingItem?.endDate ? new Date(editingItem.endDate).toISOString().slice(0, 16) : ""} onChange={e => setEditingItem(prev => prev ? {...prev, endDate: e.target.value} : null)} />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Ngân sách</label>
                  <Input type="number" value={editingItem?.budget || 0} onChange={e => setEditingItem(prev => prev ? {...prev, budget: Number(e.target.value)} : null)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Trạng thái</label>
                  <select className="w-full h-10 border rounded-lg px-3 bg-slate-50" value={editingItem?.status || ""} onChange={e => setEditingItem(prev => prev ? {...prev, status: e.target.value as any} : null)}>
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="open">Đang mở</option>
                    <option value="paused">Tạm dừng</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Hủy bỏ</option>
                  </select>
                </div>
             </div>
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Tên sản phẩm tài trợ (Nếu có)</label>
               <Input value={editingItem?.productName || ""} onChange={e => setEditingItem(prev => prev ? {...prev, productName: e.target.value} : null)} placeholder="VD: Sữa rửa mặt Simple" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Mô tả sản phẩm tài trợ</label>
               <Textarea value={editingItem?.productDescription || ""} onChange={e => setEditingItem(prev => prev ? {...prev, productDescription: e.target.value} : null)} placeholder="Thông số, công dụng, yêu cầu review sản phẩm..." rows={3} />
             </div>
             <ProductImagesUpload images={editingItem?.productImages || []} onChange={imgs => setEditingItem(prev => prev ? {...prev, productImages: imgs} : null)} />
             <DialogFooter className="pt-6">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                <Button className="bg-slate-900 text-white font-bold px-8 h-11 rounded-xl" onClick={handleUpdate}>Lưu thay đổi</Button>
             </DialogFooter>
              <DialogFooter className="pt-6">
                 <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                 <Button className="create-campaign-submit px-8 h-11 bg-primary text-white hover:bg-primary/90" onClick={handleUpdate}>Lưu thay đổi</Button>
              </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {selectedCampaign && (
        <ApplicationModal 
          campaign={selectedCampaign} 
          onClose={() => setSelectedCampaign(null)} 
          onSuccess={() => { setSelectedCampaign(null); fetchKocData(); }} 
        />
      )}
    </DashboardLayout>
  );
}
