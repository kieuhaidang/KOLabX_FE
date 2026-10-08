import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { Navigate } from "react-router";
import { ApiError } from "../../services/api";
import { generateGuestAutoBrief, getGuestAiQuota } from "../../services/guestAiService";
import {
  GUEST_AI_TRIAL_LIMIT,
  saveGuestAiBriefDraft,
  readGuestAiBriefDraft,
  savePostLoginIntent,
  type GuestAiBriefForm,
  type GuestTrialQuota,
} from "../../services/guestTrial";
import type { AutoBriefResult } from "../../services/aiService";
import { useAuth } from "../auth/AuthProvider";
import { GuestAuthDialog } from "../ai/GuestAuthDialog";
import { PublicAiTrialShell } from "../ai/PublicAiTrialShell";
import {
  AiListSection,
  AiNotice,
  AiPageHeader,
  AiPromptChips,
  AiSectionCard,
  AiSubmitButton,
  AiTextSection,
  inputClassName,
} from "../ai/aiPrimitives";

const initialForm: GuestAiBriefForm = {
  inputText: "",
  brand: "",
  product: "",
  platform: "",
  targetAudience: "",
  budget: "",
};

const prompts = [
  "Ra mắt serum chống nắng cho nữ 18-30 tuổi trên TikTok, ngân sách 150 triệu.",
  "Quảng bá trà sữa mới cho sinh viên, mục tiêu tăng nhận diện thương hiệu.",
  "Local brand streetwear muốn tăng doanh số qua KOC TikTok trong một tháng.",
];

function isExhausted(error: unknown) {
  return error instanceof ApiError && typeof error.payload === "object" && error.payload !== null &&
    (error.payload as { code?: string }).code === "GUEST_TRIAL_EXHAUSTED";
}

function formatBrief(brief: AutoBriefResult) {
  const section = (title: string, value: string | string[]) => {
    const content = Array.isArray(value) ? value.map((item) => `- ${item}`).join("\n") : value;
    return `${title}\n${content}`;
  };
  return [
    section("TIÊU ĐỀ", brief.campaignTitle), section("MỤC TIÊU", brief.objectives),
    section("KHÁCH HÀNG MỤC TIÊU", brief.targetAudience), section("ĐỊNH HƯỚNG NỘI DUNG", brief.contentDirection),
    section("THÔNG ĐIỆP CHÍNH", brief.keyMessages), section("HỒ SƠ KOC ĐỀ XUẤT", brief.suggestedKocProfile),
    section("CTA", brief.cta), section("HASHTAGS", brief.hashtags), section("ĐẦU VIỆC", brief.deliverables),
    section("TIMELINE", brief.timeline), section("NGÂN SÁCH", brief.budgetSuggestion),
  ].join("\n\n");
}

export function GuestAiBriefPage() {
  const { user, isBootstrapping } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<AutoBriefResult | null>(null);
  const [quota, setQuota] = useState<GuestTrialQuota>({ limit: GUEST_AI_TRIAL_LIMIT, used: 0, remaining: GUEST_AI_TRIAL_LIMIT, requiresAuth: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState<"exhausted" | "campaign" | null>(null);

  useEffect(() => {
    if (user) return;
    const saved = readGuestAiBriefDraft();
    if (saved) {
      setForm(saved.form);
      setResult(saved.result);
    }
    getGuestAiQuota("auto_brief").then(setQuota).catch(() => undefined);
  }, [user]);

  if (isBootstrapping) return <div className="min-h-screen bg-[#080b0b]" />;
  if (user?.role === "marketer") return <Navigate to="/marketer/auto-briefing" replace />;

  const update = (field: keyof GuestAiBriefForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (quota.remaining <= 0) {
      setDialog("exhausted");
      return;
    }
    if (!form.inputText.trim()) {
      setError("Vui lòng nhập ý tưởng chiến dịch.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await generateGuestAutoBrief({
        inputText: form.inputText.trim(), brand: form.brand.trim() || null,
        product: form.product.trim() || null, platform: form.platform.trim() || null,
        targetAudience: form.targetAudience.trim() || null, budget: form.budget.trim() || null,
      });
      setResult(response.result);
      setQuota(response.quota);
      saveGuestAiBriefDraft(form, response.result);
      setSuccess("Tạo AI Brief thành công.");
    } catch (caught) {
      if (isExhausted(caught)) {
        setQuota({ limit: GUEST_AI_TRIAL_LIMIT, used: GUEST_AI_TRIAL_LIMIT, remaining: 0, requiresAuth: true });
        setDialog("exhausted");
      }
      setError(caught instanceof ApiError ? caught.message : "Không thể tạo AI Brief.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatBrief(result));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Không thể sao chép nội dung.");
    }
  };

  const prepareCampaignLogin = () => {
    if (!result) return;
    saveGuestAiBriefDraft(form, result);
    savePostLoginIntent("create-campaign-from-ai-brief");
  };

  if (user) {
    return (
      <PublicAiTrialShell>
        <AiNotice tone="error">Tính năng tạo chiến dịch yêu cầu tài khoản Marketer.</AiNotice>
      </PublicAiTrialShell>
    );
  }

  return (
    <PublicAiTrialShell>
      <div className="space-y-6">
        <AiPageHeader eyebrow="Dùng thử miễn phí" title="AI Tạo Brief" description="Biến ý tưởng chiến dịch thành brief chi tiết trước khi đăng nhập." icon={<Sparkles size={28} />} />
        <AiNotice tone={quota.remaining > 0 ? "info" : "error"}>
          {quota.remaining > 0
            ? `Bạn đang dùng thử AI Brief: còn ${quota.remaining} lượt.`
            : "Bạn đã hết lượt dùng thử. Đăng nhập để tiếp tục sử dụng AI Brief."}
          {quota.remaining === 0 ? (
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setDialog("exhausted")} className="rounded-full bg-primary px-4 py-2 font-bold text-white">Đăng nhập</button>
              <button type="button" onClick={() => setDialog("exhausted")} className="rounded-full border border-white/20 px-4 py-2 font-bold text-white">Đăng ký</button>
            </div>
          ) : null}
        </AiNotice>

        <div className="grid gap-6 lg:grid-cols-2">
          <AiSectionCard title="Tạo brief mới">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="mb-1 block text-sm text-slate-300">Ý tưởng chiến dịch *</label><textarea value={form.inputText} onChange={(e) => update("inputText", e.target.value)} rows={6} maxLength={6000} className={inputClassName} /></div>
              <AiPromptChips title="Gợi ý nhanh" prompts={prompts} onSelect={(value) => update("inputText", value)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <input aria-label="Thương hiệu" placeholder="Thương hiệu" value={form.brand} onChange={(e) => update("brand", e.target.value)} maxLength={500} className={inputClassName} />
                <input aria-label="Sản phẩm" placeholder="Sản phẩm" value={form.product} onChange={(e) => update("product", e.target.value)} maxLength={500} className={inputClassName} />
                <input aria-label="Nền tảng" placeholder="TikTok, Instagram..." value={form.platform} onChange={(e) => update("platform", e.target.value)} maxLength={500} className={inputClassName} />
                <input aria-label="Khách hàng mục tiêu" placeholder="Khách hàng mục tiêu" value={form.targetAudience} onChange={(e) => update("targetAudience", e.target.value)} maxLength={500} className={inputClassName} />
                <input aria-label="Ngân sách" placeholder="Ngân sách dự kiến" value={form.budget} onChange={(e) => update("budget", e.target.value)} maxLength={500} className={`${inputClassName} sm:col-span-2`} />
              </div>
              {error ? <AiNotice tone="error">{error}</AiNotice> : null}
              {success ? <AiNotice tone="success">{success}</AiNotice> : null}
              <AiSubmitButton loading={loading} label={quota.remaining > 0 ? "Tạo AI Brief" : "Đăng nhập để tiếp tục"} loadingLabel="Đang tạo brief..." />
            </form>
          </AiSectionCard>

          <AiSectionCard title="Kết quả AI Brief" actions={result ? <div className="flex gap-2"><button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs"><Copy size={14} />{copied ? "Đã sao chép" : "Sao chép"}</button><button type="button" onClick={() => setDialog("campaign")} className="rounded-full bg-primary px-4 py-1.5 text-xs font-black">Tạo chiến dịch</button></div> : undefined}>
            {result ? <div className="space-y-5"><h3 className="text-xl font-bold text-primary">{result.campaignTitle}</h3><AiListSection label="Mục tiêu" items={result.objectives} /><AiTextSection label="Khách hàng mục tiêu" value={result.targetAudience} /><AiListSection label="Định hướng nội dung" items={result.contentDirection} /><AiListSection label="Thông điệp chính" items={result.keyMessages} /><AiListSection label="Hồ sơ KOC đề xuất" items={result.suggestedKocProfile} /><AiTextSection label="CTA" value={result.cta} /><AiListSection label="Hashtags" items={result.hashtags} /><AiListSection label="Đầu việc cần bàn giao" items={result.deliverables} /><AiTextSection label="Timeline" value={result.timeline} /><AiTextSection label="Gợi ý ngân sách" value={result.budgetSuggestion} /></div> : <p className="text-sm text-slate-400">Kết quả sẽ xuất hiện tại đây và vẫn được giữ nguyên nếu lần gọi tiếp theo thất bại.</p>}
          </AiSectionCard>
        </div>
      </div>
      <GuestAuthDialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)} kind={dialog || "exhausted"} role="marketer" onBeforeNavigate={dialog === "campaign" ? prepareCampaignLogin : undefined} />
    </PublicAiTrialShell>
  );
}
