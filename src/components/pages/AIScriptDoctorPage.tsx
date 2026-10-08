import { useEffect, useState, type FormEvent } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Crown, FileText, History, Loader2, Pencil } from "lucide-react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ApiError } from "../../services/api";
import {
  generateScriptDoctor,
  getAiQuota,
  listMyScriptReviews,
  reviseScriptReview,
  updateScriptReview,
  upgradeAiPlus,
  type AiQuota,
  type ScriptDoctorResult,
  type ScriptReviewRecord,
} from "../../services/aiService";
import { clearGuestScriptDoctorDraft, consumePostLoginHandoff, readGuestScriptDoctorDraft } from "../../services/guestTrial";
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

const KOC_PROMPTS = [
  "Hôm nay mình review kem chống nắng này nha. Dùng cũng khá ổn, mọi người mua thử nhé.",
  "Chiếc tai nghe gaming này có đèn RGB đẹp, pin lâu và giá rẻ. Link mình để bên dưới.",
  "Mình mới thử quán trà sữa này thấy ngon nên review cho mọi người.",
  "Serum này giúp da sáng hơn, mình dùng được 2 tuần rồi và thấy khá thích.",
  "Áo hoodie này form đẹp, mặc thoải mái, phù hợp đi học và đi chơi.",
];

const initialForm = {
  inputScript: "",
  platform: "",
  tone: "",
  product: "",
  targetAudience: "",
};

const AI_UNAVAILABLE_CODE = "AI_SERVICE_UNAVAILABLE";
const AI_UNAVAILABLE_MESSAGE = "Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.";

type ScriptListField = keyof Pick<ScriptDoctorResult, "contentTips" | "platformOptimization" | "hashtagSuggestions">;
type ScriptTextField = keyof Pick<ScriptDoctorResult, "improvedHook" | "improvedScript" | "strongerCTA">;
type ScriptEditDraft = Omit<ScriptDoctorResult, ScriptListField> & Record<ScriptListField, string>;

const textFields: Array<{ key: ScriptTextField; label: string; rows: number }> = [
  { key: "improvedHook", label: "Hook đã cải thiện", rows: 3 },
  { key: "improvedScript", label: "Script đã tối ưu", rows: 8 },
  { key: "strongerCTA", label: "CTA mạnh hơn", rows: 3 },
];

const listFields: Array<{ key: ScriptListField; label: string }> = [
  { key: "contentTips", label: "Gợi ý nội dung" },
  { key: "platformOptimization", label: "Tối ưu theo nền tảng" },
  { key: "hashtagSuggestions", label: "Hashtag đề xuất" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function normalizeScriptDoctorResult(value: unknown): ScriptDoctorResult | null {
  if (!isRecord(value)) return null;

  const improvedHook = typeof value.improvedHook === "string" ? value.improvedHook.trim() : "";
  const improvedScript = typeof value.improvedScript === "string" ? value.improvedScript.trim() : "";
  const strongerCTA = typeof value.strongerCTA === "string" ? value.strongerCTA.trim() : "";

  if (!improvedHook || !improvedScript || !strongerCTA) return null;

  return {
    improvedHook,
    improvedScript,
    strongerCTA,
    contentTips: toStringArray(value.contentTips),
    platformOptimization: toStringArray(value.platformOptimization),
    hashtagSuggestions: toStringArray(value.hashtagSuggestions),
  };
}

function hasValidScriptDoctorResult(item: unknown): item is ScriptReviewRecord {
  return isRecord(item) && Boolean(normalizeScriptDoctorResult(item.result));
}

function mergeScriptReviewHistory(current: ScriptReviewRecord[], incoming: ScriptReviewRecord[]) {
  const seenIds = new Set<number>();

  return [...incoming, ...current]
    .filter(hasValidScriptDoctorResult)
    .filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    })
    .slice(0, 5);
}

function optionalFieldValue(savedValue: string | null | undefined, fallbackValue: string) {
  return savedValue?.trim() || fallbackValue.trim() || null;
}

function buildSavedScriptReviewItem(
  item: ScriptReviewRecord | null | undefined,
  result: ScriptDoctorResult,
  formSnapshot: typeof initialForm
): ScriptReviewRecord | null {
  if (!item?.id) return null;

  return {
    ...item,
    inputScript: item.inputScript || formSnapshot.inputScript.trim(),
    optionalFields: {
      platform: optionalFieldValue(item.optionalFields?.platform, formSnapshot.platform),
      tone: optionalFieldValue(item.optionalFields?.tone, formSnapshot.tone),
      product: optionalFieldValue(item.optionalFields?.product, formSnapshot.product),
      targetAudience: optionalFieldValue(item.optionalFields?.targetAudience, formSnapshot.targetAudience),
    },
    result,
  };
}

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function createScriptEditDraft(result: ScriptDoctorResult): ScriptEditDraft {
  return {
    ...result,
    contentTips: listToText(result.contentTips),
    platformOptimization: listToText(result.platformOptimization),
    hashtagSuggestions: listToText(result.hashtagSuggestions),
  };
}

function scriptEditDraftToResult(draft: ScriptEditDraft): ScriptDoctorResult {
  return {
    ...draft,
    contentTips: textToList(draft.contentTips),
    platformOptimization: textToList(draft.platformOptimization),
    hashtagSuggestions: textToList(draft.hashtagSuggestions),
  };
}

function validateScriptResultDraft(value: ScriptDoctorResult) {
  if (!value.improvedHook.trim()) return "Hook là bắt buộc.";
  if (!value.improvedScript.trim()) return "Script đã tối ưu là bắt buộc.";
  if (!value.strongerCTA.trim()) return "CTA là bắt buộc.";
  if (value.contentTips.length === 0) return "Cần có ít nhất một gợi ý nội dung.";
  if (value.platformOptimization.length === 0) return "Cần có ít nhất một gợi ý tối ưu nền tảng.";
  if (value.hashtagSuggestions.length === 0) return "Cần có ít nhất một hashtag.";
  return "";
}

function formatScriptPlainText(value: ScriptDoctorResult) {
  const section = (title: string, content: string | string[]) => {
    const body = Array.isArray(content)
      ? content.filter(Boolean).map((item) => `- ${item}`).join("\n")
      : content.trim();
    return body ? `${title}\n${body}` : "";
  };

  return [
    section("HOOK", value.improvedHook),
    section("SCRIPT", value.improvedScript),
    section("CTA", value.strongerCTA),
    section("GỢI Ý NỘI DUNG", value.contentTips),
    section("TỐI ƯU NỀN TẢNG", value.platformOptimization),
    section("HASHTAG", value.hashtagSuggestions),
  ].filter(Boolean).join("\n\n");
}

function formatHistoryDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function isAiUnavailableError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 503) return true;
  return isRecord(error.payload) && error.payload.code === AI_UNAVAILABLE_CODE;
}

export function AIScriptDoctorPage() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<ScriptDoctorResult | null>(null);
  const [activeReview, setActiveReview] = useState<ScriptReviewRecord | null>(null);
  const [history, setHistory] = useState<ScriptReviewRecord[]>([]);
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [manualDraft, setManualDraft] = useState<ScriptEditDraft | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const loadQuota = async () => {
    try {
      const data = await getAiQuota();
      setQuota(data);
    } catch {
      setQuota(null);
    }
  };

  useEffect(() => {
    loadQuota();
    listMyScriptReviews()
      .then((response) => setHistory((current) => mergeScriptReviewHistory(current, response.items || [])))
      .catch(() => setHistory((current) => current))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    const saved = readGuestScriptDoctorDraft();
    if (!consumePostLoginHandoff("continue-script-doctor")) return;
    if (!saved) return;
    setForm(saved.form);
    const restoredResult = normalizeScriptDoctorResult(saved.result);
    if (restoredResult) {
      setResult(restoredResult);
      setActiveReview(null);
      setSuccessMessage("\u0110\u00e3 kh\u00f4i ph\u1ee5c k\u1ebft qu\u1ea3 Script Doctor d\u00f9ng th\u1eed.");
    }
    setErrorMessage("");
    setAiUnavailable(false);
    setIsManualEditing(false);
    setManualDraft(null);
    clearGuestScriptDoctorDraft();
  }, []);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setErrorMessage("");
    setAiUnavailable(false);
    try {
      const response = await upgradeAiPlus();
      setQuota({
        plan: response.plan,
        aiMonthlyLimit: response.aiMonthlyLimit,
        aiUsedThisMonth: response.aiUsedThisMonth,
        remaining: response.remaining,
        isSearchBoosted: response.isSearchBoosted,
        resetAt: response.resetAt,
      });
      setSuccessMessage("Nâng cấp Plus thành công. Bạn đã có thêm lượt AI và được ưu tiên hiển thị.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể nâng cấp Plus.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.inputScript.trim()) {
      setErrorMessage("Vui lòng nhập kịch bản.");
      setSuccessMessage("");
      setAiUnavailable(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setAiUnavailable(false);
    setResult(null);
    setActiveReview(null);
    setIsManualEditing(false);
    setManualDraft(null);
    setRevisionPrompt("");

    try {
      const response = await generateScriptDoctor({
        inputScript: form.inputScript.trim(),
        platform: form.platform.trim() || null,
        tone: form.tone.trim() || null,
        product: form.product.trim() || null,
        targetAudience: form.targetAudience.trim() || null,
      });

      const normalizedResult = normalizeScriptDoctorResult(response.result);
      if (!normalizedResult) {
        throw new ApiError(AI_UNAVAILABLE_MESSAGE, 503, { code: AI_UNAVAILABLE_CODE });
      }

      setResult(normalizedResult);
      setSuccessMessage("Phân tích Script Doctor thành công.");

      if (response.usage) {
        setQuota({
          plan: response.usage.plan,
          aiMonthlyLimit: response.usage.limit,
          aiUsedThisMonth: response.usage.used,
          remaining: Math.max(0, response.usage.limit - response.usage.used),
          isSearchBoosted: response.usage.isSearchBoosted,
          resetAt: response.usage.resetAt,
        });
      } else {
        await loadQuota();
      }

      const savedItem = buildSavedScriptReviewItem(response.item, normalizedResult, form);
      if (savedItem) {
        setActiveReview(savedItem);
        setHistory((prev) => mergeScriptReviewHistory(prev, [savedItem]));
      } else {
        setSuccessMessage("Phân tích thành công nhưng chưa thể lưu vào lịch sử.");
      }
    } catch (error) {
      setResult(null);
      const unavailable = isAiUnavailableError(error);
      setAiUnavailable(unavailable);
      setErrorMessage(unavailable ? AI_UNAVAILABLE_MESSAGE : error instanceof ApiError ? error.message : "Không thể phân tích script.");
      await loadQuota();
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: ScriptReviewRecord) => {
    const normalizedResult = normalizeScriptDoctorResult(item.result);
    if (!normalizedResult) {
      setResult(null);
      setSuccessMessage("");
      setAiUnavailable(true);
      setErrorMessage(AI_UNAVAILABLE_MESSAGE);
      return;
    }

    setForm({
      inputScript: item.inputScript,
      platform: item.optionalFields.platform || "",
      tone: item.optionalFields.tone || "",
      product: item.optionalFields.product || "",
      targetAudience: item.optionalFields.targetAudience || "",
    });
    setResult(normalizedResult);
    setActiveReview(item);
    setIsManualEditing(false);
    setManualDraft(null);
    setRevisionPrompt("");
    setSuccessMessage("Đã tải kết quả từ lịch sử.");
    setErrorMessage("");
    setAiUnavailable(false);
  };

  const handleAiRevision = async () => {
    if (!result || !activeReview) return;
    if (!revisionPrompt.trim()) {
      setErrorMessage("Vui lòng nhập yêu cầu chỉnh sửa.");
      setSuccessMessage("");
      return;
    }

    setRevisionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await reviseScriptReview(activeReview.id, revisionPrompt.trim());
      const normalizedResult = normalizeScriptDoctorResult(response.result);
      if (!normalizedResult) {
        throw new ApiError(AI_UNAVAILABLE_MESSAGE, 503, { code: AI_UNAVAILABLE_CODE });
      }

      const updatedItem = buildSavedScriptReviewItem(response.item, normalizedResult, form);
      setResult(normalizedResult);
      setRevisionPrompt("");
      setIsManualEditing(false);
      setManualDraft(null);
      if (updatedItem) {
        setActiveReview(updatedItem);
        setHistory((prev) => mergeScriptReviewHistory(prev, [updatedItem]));
      }
      if (response.usage) {
        setQuota({
          plan: response.usage.plan,
          aiMonthlyLimit: response.usage.limit,
          aiUsedThisMonth: response.usage.used,
          remaining: Math.max(0, response.usage.limit - response.usage.used),
          isSearchBoosted: response.usage.isSearchBoosted,
          resetAt: response.usage.resetAt,
        });
      }
      setSuccessMessage("AI đã cập nhật Script Doctor theo yêu cầu.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể chỉnh sửa bằng AI. Kết quả hiện tại vẫn được giữ nguyên.");
      await loadQuota();
    } finally {
      setRevisionLoading(false);
    }
  };

  const startManualEdit = () => {
    if (!result) return;
    setManualDraft(createScriptEditDraft(result));
    setIsManualEditing(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const updateManualText = (field: ScriptTextField, value: string) => {
    setManualDraft((current) => current ? { ...current, [field]: value } : current);
  };

  const updateManualList = (field: ScriptListField, value: string) => {
    setManualDraft((current) => current ? { ...current, [field]: value } : current);
  };

  const saveManualEdit = async () => {
    if (!manualDraft || !activeReview) return;
    const savedResult = scriptEditDraftToResult(manualDraft);
    const validationError = validateScriptResultDraft(savedResult);
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await updateScriptReview(activeReview.id, {
        inputScript: form.inputScript.trim(),
        platform: form.platform.trim() || null,
        tone: form.tone.trim() || null,
        product: form.product.trim() || null,
        targetAudience: form.targetAudience.trim() || null,
        result: savedResult,
      });
      const normalizedResult = normalizeScriptDoctorResult(response.item.result);
      if (!normalizedResult) {
        throw new ApiError(AI_UNAVAILABLE_MESSAGE, 503, { code: AI_UNAVAILABLE_CODE });
      }

      setResult(normalizedResult);
      setIsManualEditing(false);
      setManualDraft(null);
      setActiveReview(response.item);
      setHistory((prev) => mergeScriptReviewHistory(prev, [response.item]));
      setSuccessMessage("Đã lưu chỉnh sửa thủ công.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể lưu chỉnh sửa thủ công.");
    }
  };

  const cancelManualEdit = () => {
    setManualDraft(null);
    setIsManualEditing(false);
    setErrorMessage("");
    setSuccessMessage("Đã hủy chỉnh sửa thủ công.");
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatScriptPlainText(result));
      setCopyState("copied");
      setSuccessMessage("Đã sao chép nội dung");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setErrorMessage("Không thể sao chép nội dung. Vui lòng thử lại.");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const isPlus = quota?.plan === "plus";

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        <AiPageHeader
          eyebrow="AI cho KOC/KOL"
          title="AI Script Doctor"
          description="Tối ưu hook, kịch bản, CTA và hashtag để nội dung viral hơn trên từng nền tảng."
          icon={<FileText size={28} className="text-white" />}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsHistoryOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary/40 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            <History size={16} className="text-primary" />
            {isHistoryOpen ? "\u1ea8n l\u1ecbch s\u1eed" : "M\u1edf l\u1ecbch s\u1eed"}
            {isHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className={`grid gap-6 ${isHistoryOpen ? "xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]" : "xl:grid-cols-[minmax(0,1fr)]"}`}>
          <div className="space-y-6">
            <AiSectionCard title={isPlus ? "Gói Plus" : "Gói Free"}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 text-sm text-slate-700">
                  {isPlus ? (
                    <>
                      <p>AI Script Doctor: 100 lượt/tháng</p>
                      <p>Được ưu tiên hiển thị trong tìm kiếm</p>
                      <p>Gợi ý chuyên sâu hơn</p>
                      <p>Tăng cơ hội nhận job</p>
                    </>
                  ) : (
                    <>
                      <p>AI Script Doctor: 5 lượt/tháng</p>
                      <p>Không được ưu tiên tìm kiếm</p>
                      <p>Gợi ý nội dung cơ bản</p>
                    </>
                  )}
                  {quota ? (
                    <p className="font-medium text-primary">
                      Còn lại: {quota.remaining}/{quota.aiMonthlyLimit} lượt trong tháng
                    </p>
                  ) : null}
                </div>
                {isPlus ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    <Crown size={14} /> Plus
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    {upgrading ? "Đang nâng cấp..." : "Nâng cấp Plus"}
                  </button>
                )}
              </div>
            </AiSectionCard>

            <AiSectionCard title="Phân tích kịch bản">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Kịch bản gốc <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={form.inputScript}
                    onChange={(e) => handleChange("inputScript", e.target.value)}
                    rows={8}
                    className={inputClassName}
                    placeholder="Dán kịch bản video/post của bạn..."
                  />
                </div>

                <AiPromptChips
                  title="Gợi ý prompt cho KOC/KOL"
                  prompts={KOC_PROMPTS}
                  onSelect={(prompt) => handleChange("inputScript", prompt)}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Nền tảng</label>
                    <input
                      value={form.platform}
                      onChange={(e) => handleChange("platform", e.target.value)}
                      className={inputClassName}
                      placeholder="TikTok, Instagram..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Tone</label>
                    <input
                      value={form.tone}
                      onChange={(e) => handleChange("tone", e.target.value)}
                      className={inputClassName}
                      placeholder="Thân thiện, chuyên nghiệp..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Sản phẩm</label>
                    <input value={form.product} onChange={(e) => handleChange("product", e.target.value)} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Khách hàng mục tiêu</label>
                    <input
                      value={form.targetAudience}
                      onChange={(e) => handleChange("targetAudience", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                {errorMessage ? (
                  <AiNotice tone="error">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>{errorMessage}</span>
                      {aiUnavailable ? (
                        <button
                          type="submit"
                          disabled={loading}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          Thử lại
                        </button>
                      ) : null}
                    </div>
                  </AiNotice>
                ) : null}
                {successMessage ? <AiNotice tone="success">{successMessage}</AiNotice> : null}

                <AiSubmitButton loading={loading} label="Phân tích Script" loadingLabel="Đang phân tích..." />
              </form>
            </AiSectionCard>

            {result ? (
              <AiSectionCard
                title="Kết quả phân tích"
                actions={
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startManualEdit}
                      disabled={isManualEditing}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-50"
                    >
                      <Pencil size={14} />
                      Chỉnh sửa thủ công
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                    >
                      {copyState === "copied" ? <Check size={14} /> : <Copy size={14} />}
                      {copyState === "copied" ? "Đã sao chép" : "Sao chép"}
                    </button>
                  </div>
                }
              >
                {isManualEditing && manualDraft ? (
                  <div className="space-y-4">
                    {textFields.map((field) => (
                      <div key={field.key}>
                        <label className="mb-1 block text-sm font-semibold text-slate-200">{field.label}</label>
                        <textarea
                          value={manualDraft[field.key]}
                          onChange={(event) => updateManualText(field.key, event.target.value)}
                          rows={field.rows}
                          className={inputClassName}
                        />
                      </div>
                    ))}
                    <div className="grid gap-4 md:grid-cols-2">
                      {listFields.map((field) => (
                        <div key={field.key}>
                          <label className="mb-1 block text-sm font-semibold text-slate-200">{field.label}</label>
                          <textarea
                            value={manualDraft[field.key]}
                            onChange={(event) => updateManualList(field.key, event.target.value)}
                            rows={5}
                            className={inputClassName}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={saveManualEdit} className="rounded-full bg-primary px-5 py-2 text-sm font-black text-white hover:bg-primary-hover">
                        Lưu chỉnh sửa
                      </button>
                      <button type="button" onClick={cancelManualEdit} className="rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <AiTextSection label="Hook đã cải thiện" value={result.improvedHook} />
                    <AiTextSection label="Script đã tối ưu" value={result.improvedScript} />
                    <AiTextSection label="CTA mạnh hơn" value={result.strongerCTA} />
                    <AiListSection label="Gợi ý nội dung" items={result.contentTips} />
                    <AiListSection label="Tối ưu theo nền tảng" items={result.platformOptimization} />
                    <AiListSection label="Hashtag đề xuất" items={result.hashtagSuggestions} />
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="mb-3 text-sm font-black text-white">Chỉnh sửa bằng AI</h3>
                  <div className="space-y-3">
                    <textarea
                      value={revisionPrompt}
                      onChange={(event) => setRevisionPrompt(event.target.value)}
                      disabled={isManualEditing}
                      rows={3}
                      className={inputClassName}
                      placeholder="Ví dụ: Viết hook mạnh hơn, rút ngắn còn 30 giây, đổi tone gần gũi hơn, bổ sung CTA rõ ràng..."
                    />
                    <button
                      type="button"
                      onClick={handleAiRevision}
                      disabled={revisionLoading || isManualEditing || !revisionPrompt.trim() || !activeReview}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-5 py-2 text-sm font-black text-orange-100 hover:bg-primary/25 disabled:opacity-50"
                    >
                      {revisionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                      {revisionLoading ? "Đang chỉnh sửa..." : "Yêu cầu AI chỉnh sửa"}
                    </button>
                  </div>
                </div>
              </AiSectionCard>
            ) : (
              <AiSectionCard>
                <p className="text-sm text-slate-500">
                  {aiUnavailable
                    ? AI_UNAVAILABLE_MESSAGE
                    : "Nhập kịch bản và nhấn \"Phân tích Script\" để nhận gợi ý tối ưu từ AI."}
                </p>
              </AiSectionCard>
            )}
          </div>

          {isHistoryOpen ? (
            <div className="transition-all duration-300 ease-out">
              <AiSectionCard title="Lịch sử gần đây">
            {historyLoading ? <p className="text-sm text-slate-500">Đang tải lịch sử...</p> : null}
            {!historyLoading && history.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có phân tích nào được lưu.</p>
            ) : null}
            <div className="space-y-2">
              {history.filter(hasValidScriptDoctorResult).map((item) => {
                const itemResult = normalizeScriptDoctorResult(item.result);
                if (!itemResult) return null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => loadHistoryItem(item)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-primary/30 hover:bg-blue-50"
                  >
                    <p className="line-clamp-2 text-sm font-medium text-slate-800">{itemResult.improvedHook || "Script review"}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.inputScript}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
                      {item.optionalFields.platform ? <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.optionalFields.platform}</span> : null}
                      {item.optionalFields.tone ? <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.optionalFields.tone}</span> : null}
                      {formatHistoryDate(item.updatedAt || item.createdAt) ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{formatHistoryDate(item.updatedAt || item.createdAt)}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
              </AiSectionCard>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
