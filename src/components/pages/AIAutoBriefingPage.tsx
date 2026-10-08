import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ChevronDown, ChevronUp, Copy, History, Loader2, Pencil, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { formatThousands, parseThousands } from "../../utils/numberFormat";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ApiError } from "../../services/api";
import {
  generateAutoBrief,
  listMyAiBriefs,
  type AiBriefRecord,
  type AutoBriefResult,
} from "../../services/aiService";
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

const AI_CAMPAIGN_DRAFT_KEY = "kolab_ai_campaign_draft";

const MARKETER_PROMPTS = [
  "Ra mắt serum chống nắng cho nữ 18-30 tuổi trên TikTok, ngân sách 150 triệu.",
  "Quảng bá trà sữa mới dành cho sinh viên tại Hà Nội, mục tiêu tăng nhận diện thương hiệu.",
  "Local brand streetwear muốn tăng doanh số qua KOC TikTok trong 1 tháng.",
  "App học tiếng Anh muốn tạo chiến dịch viral với meme TikTok cho học sinh cấp 3.",
  "Thương hiệu snack cay muốn tạo thử thách ăn cay trên TikTok cho Gen Z.",
];

const initialForm = {
  inputText: "",
  brand: "",
  product: "",
  shape: "",
  properties: "",
  platform: "",
  targetAudience: "",
  budget: "",
};

type ProductSuggestionField = "brand" | "product" | "shape" | "properties" | "platform" | "targetAudience" | "budget";
type BriefListField = keyof Pick<
  AutoBriefResult,
  "objectives" | "contentDirection" | "keyMessages" | "suggestedKocProfile" | "hashtags" | "deliverables"
>;
type BriefTextField = keyof Pick<AutoBriefResult, "campaignTitle" | "targetAudience" | "cta" | "timeline" | "budgetSuggestion">;
type BriefEditState = Omit<AutoBriefResult, BriefListField> & Record<BriefListField, string>;

const listFields: Array<{ key: BriefListField; label: string }> = [
  { key: "objectives", label: "Mục tiêu" },
  { key: "contentDirection", label: "Định hướng nội dung" },
  { key: "keyMessages", label: "Thông điệp chính" },
  { key: "suggestedKocProfile", label: "Hồ sơ KOC đề xuất" },
  { key: "hashtags", label: "Hashtags" },
  { key: "deliverables", label: "Đầu việc cần bàn giao" },
];

const textFields: Array<{ key: BriefTextField; label: string; rows?: number }> = [
  { key: "campaignTitle", label: "Tiêu đề" },
  { key: "targetAudience", label: "Khách hàng mục tiêu", rows: 3 },
  { key: "cta", label: "CTA", rows: 2 },
  { key: "timeline", label: "Timeline", rows: 2 },
  { key: "budgetSuggestion", label: "Gợi ý ngân sách", rows: 2 },
];

const brandSuggestions = [
  "SunGlow",
  "Cocoon",
  "L’Oréal",
  "Maybelline",
  "La Roche-Posay",
  "Vinamilk",
  "TH true MILK",
  "Highlands Coffee",
  "Coolmate",
  "Canifa",
];

const productSuggestions = [
  "Serum chống nắng",
  "Kem dưỡng ẩm",
  "Sữa rửa mặt",
  "Son tint",
  "Nước hoa",
  "Áo thun",
  "Áo khoác",
  "Giày thể thao",
  "Sữa hạt",
  "Cà phê đóng chai",
  "Khóa học online",
  "Ứng dụng di động",
];

const productShapeSuggestions = [
  "Dạng kem",
  "Dạng gel",
  "Dạng xịt",
  "Dạng serum",
  "Dạng thanh",
  "Dạng bột",
  "Dạng viên",
  "Dạng nước",
  "Dạng sữa",
  "Dạng dầu",
  "Dạng túi",
  "Dạng hộp",
  "Dạng chai",
  "Dạng tuýp",
];

const productPropertySuggestions = [
  "Dịu nhẹ",
  "Thấm nhanh",
  "Không bết dính",
  "Không gây kích ứng",
  "Chống nước",
  "Lâu trôi",
  "Dưỡng ẩm",
  "Kiềm dầu",
  "Làm dịu",
  "Làm sáng",
  "Mỏng nhẹ",
  "Không hương liệu",
  "Thuần chay",
  "Phù hợp da nhạy cảm",
  "An toàn cho trẻ em",
];

const platformSuggestions = [
  "TikTok",
  "Instagram",
  "YouTube",
  "Facebook",
  "TikTok Shop",
  "Shopee Live",
  "Lazada Live",
];

const targetAudienceSuggestions = [
  "Nữ 18–30 tuổi",
  "Nam 18–35 tuổi",
  "Gen Z",
  "Sinh viên",
  "Nhân viên văn phòng",
  "Mẹ bỉm",
  "Người yêu làm đẹp",
  "Người quan tâm sức khỏe",
  "Người chơi game",
  "Người thường xuyên mua sắm online",
  "Gia đình trẻ",
  "Người có thu nhập trung bình",
];

const budgetSuggestions = [
  { label: "20 triệu", value: "20000000" },
  { label: "50 triệu", value: "50000000" },
  { label: "100 triệu", value: "100000000" },
  { label: "150 triệu", value: "150000000" },
  { label: "200 triệu", value: "200000000" },
  { label: "500 triệu", value: "500000000" },
];

const suggestionChipClassName =
  "rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-primary/45 hover:bg-primary/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/25";

function appendUniqueProductValue(current: string, value: string) {
  const parts = current
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.some((item) => item.toLocaleLowerCase("vi-VN") === value.toLocaleLowerCase("vi-VN"))) {
    return current;
  }

  return [...parts, value].join(", ");
}

function buildAutoBriefInputText(form: typeof initialForm, baseText: string) {
  return [
    baseText,
    form.brand.trim() ? `Thương hiệu: ${form.brand.trim()}` : "",
    form.product.trim() ? `Sản phẩm: ${form.product.trim()}` : "",
    form.shape.trim() ? `Hình dạng: ${form.shape.trim()}` : "",
    form.properties.trim() ? `Tính chất: ${form.properties.trim()}` : "",
    form.platform.trim() ? `Nền tảng: ${form.platform.trim()}` : "",
    form.targetAudience.trim() ? `Khách hàng mục tiêu: ${form.targetAudience.trim()}` : "",
    form.budget.trim() ? `Ngân sách: ${form.budget.trim()}` : "",
  ].filter(Boolean).join("\n");
}

function ProductSuggestionChips({
  options,
  onSelect,
}: {
  options: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
      <p className="mb-2 text-xs font-semibold text-slate-400">Chọn gợi ý</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(option)}
            className={suggestionChipClassName}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
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

function createBriefEditDraft(result: AutoBriefResult): BriefEditState {
  return {
    ...result,
    objectives: listToText(result.objectives),
    contentDirection: listToText(result.contentDirection),
    keyMessages: listToText(result.keyMessages),
    suggestedKocProfile: listToText(result.suggestedKocProfile),
    hashtags: listToText(result.hashtags),
    deliverables: listToText(result.deliverables),
  };
}

function briefEditDraftToResult(draft: BriefEditState): AutoBriefResult {
  return {
    ...draft,
    objectives: textToList(draft.objectives),
    contentDirection: textToList(draft.contentDirection),
    keyMessages: textToList(draft.keyMessages),
    suggestedKocProfile: textToList(draft.suggestedKocProfile),
    hashtags: textToList(draft.hashtags),
    deliverables: textToList(draft.deliverables),
  };
}

function formatBriefPlainText(brief: AutoBriefResult) {
  const section = (title: string, value: string | string[]) => {
    const content = Array.isArray(value)
      ? value.filter(Boolean).map((item) => `- ${item}`).join("\n")
      : value.trim();
    return content ? `${title}\n${content}` : "";
  };

  return [
    section("TIÊU ĐỀ", brief.campaignTitle),
    section("MỤC TIÊU", brief.objectives),
    section("KHÁCH HÀNG MỤC TIÊU", brief.targetAudience),
    section("ĐỊNH HƯỚNG NỘI DUNG", brief.contentDirection),
    section("THÔNG ĐIỆP CHÍNH", brief.keyMessages),
    section("HỒ SƠ KOC ĐỀ XUẤT", brief.suggestedKocProfile),
    section("CTA", brief.cta),
    section("HASHTAGS", brief.hashtags),
    section("ĐẦU VIỆC CẦN BÀN GIAO", brief.deliverables),
    section("TIMELINE", brief.timeline),
    section("NGÂN SÁCH", brief.budgetSuggestion),
  ].filter(Boolean).join("\n\n");
}

function buildRevisionPrompt(brief: AutoBriefResult, instruction: string) {
  return [
    "Đây là Brief hiện tại:",
    formatBriefPlainText(brief),
    "",
    "Yêu cầu chỉnh sửa:",
    instruction,
    "",
    "Hãy trả lại Brief hoàn chỉnh sau khi chỉnh sửa, giữ đúng cấu trúc dữ liệu hiện tại: campaignTitle, objectives, targetAudience, contentDirection, keyMessages, suggestedKocProfile, cta, hashtags, deliverables, timeline, budgetSuggestion. Không tạo brief không liên quan.",
  ].join("\n");
}

function validateBrief(brief: AutoBriefResult) {
  if (!brief.campaignTitle.trim()) return "Tiêu đề brief là bắt buộc.";
  if (!brief.targetAudience.trim()) return "Khách hàng mục tiêu là bắt buộc.";
  if (brief.objectives.length === 0) return "Brief cần có ít nhất một mục tiêu.";
  return "";
}

function BriefDisplay({ brief }: { brief: AutoBriefResult }) {
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold text-primary">{brief.campaignTitle}</h3>
      <AiListSection label="Mục tiêu" items={brief.objectives} />
      <AiTextSection label="Khách hàng mục tiêu" value={brief.targetAudience} />
      <AiListSection label="Định hướng nội dung" items={brief.contentDirection} />
      <AiListSection label="Thông điệp chính" items={brief.keyMessages} />
      <AiListSection label="Hồ sơ KOC đề xuất" items={brief.suggestedKocProfile} />
      <AiTextSection label="CTA" value={brief.cta} />
      <AiListSection label="Hashtags" items={brief.hashtags} />
      <AiListSection label="Đầu việc cần bàn giao" items={brief.deliverables} />
      <AiTextSection label="Timeline" value={brief.timeline} />
      <AiTextSection label="Gợi ý ngân sách" value={brief.budgetSuggestion} />
    </div>
  );
}

export function AIAutoBriefingPage() {
  const navigate = useNavigate();
  const productSuggestionRootRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<AutoBriefResult | null>(null);
  const [history, setHistory] = useState<AiBriefRecord[]>([]);
  const [activeBriefId, setActiveBriefId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [manualDraft, setManualDraft] = useState<BriefEditState | null>(null);
  const [activeSuggestionField, setActiveSuggestionField] = useState<ProductSuggestionField | null>(null);

  useEffect(() => {
    listMyAiBriefs()
      .then((response) => setHistory(response.items.slice(0, 5)))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (!productSuggestionRootRef.current?.contains(target)) {
        setActiveSuggestionField(null);
        return;
      }

      if (!target.closest("[data-product-suggestion-scope]")) {
        setActiveSuggestionField(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveSuggestionField(null);
      }
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
    if (!form.inputText.trim()) {
      setErrorMessage("Vui lòng nhập ý tưởng chiến dịch.");
      setSuccessMessage("");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const inputText = buildAutoBriefInputText(form, form.inputText.trim());
      const response = await generateAutoBrief({
        inputText,
        brand: form.brand.trim() || null,
        product: form.product.trim() || null,
        platform: form.platform.trim() || null,
        targetAudience: form.targetAudience.trim() || null,
        budget: form.budget.trim() || null,
      });
      setResult(response.result);
      setActiveBriefId(response.item?.id ?? null);
      setIsManualEditing(false);
      setManualDraft(null);
      setSuccessMessage("Tạo AI Brief thành công.");
      if (response.item) {
        setHistory((prev) => [response.item, ...prev.filter((item) => item.id !== response.item.id)].slice(0, 5));
      }
    } catch (error) {
      setResult(null);
      setActiveBriefId(null);
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể tạo AI Brief.");
    } finally {
      setLoading(false);
    }
  };

  const handleAiRevision = async () => {
    if (!result) return;
    if (!revisionPrompt.trim()) {
      setErrorMessage("Vui lòng nhập yêu cầu chỉnh sửa.");
      setSuccessMessage("");
      return;
    }

    setRevisionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const revisionInputText = buildAutoBriefInputText(form, buildRevisionPrompt(result, revisionPrompt.trim()));
      const response = await generateAutoBrief({
        inputText: revisionInputText,
        brand: form.brand.trim() || null,
        product: form.product.trim() || null,
        platform: form.platform.trim() || null,
        targetAudience: form.targetAudience.trim() || null,
        budget: form.budget.trim() || null,
      });
      setResult(response.result);
      setActiveBriefId(response.item?.id ?? null);
      setRevisionPrompt("");
      setIsManualEditing(false);
      setManualDraft(null);
      setSuccessMessage("AI đã cập nhật brief theo yêu cầu.");
      if (response.item) {
        setHistory((prev) => [response.item, ...prev.filter((item) => item.id !== response.item.id)].slice(0, 5));
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể chỉnh sửa brief bằng AI. Brief hiện tại vẫn được giữ nguyên.");
    } finally {
      setRevisionLoading(false);
    }
  };

  const loadHistoryItem = (item: AiBriefRecord) => {
    setForm({
      inputText: item.inputText,
      brand: item.optionalFields.brand || "",
      product: item.optionalFields.product || "",
      shape: "",
      properties: "",
      platform: item.optionalFields.platform || "",
      targetAudience: item.optionalFields.targetAudience || "",
      budget: item.optionalFields.budget || "",
    });
    setResult(item.result);
    setActiveBriefId(item.id);
    setIsManualEditing(false);
    setManualDraft(null);
    setErrorMessage("");
    setSuccessMessage("Đã tải brief từ lịch sử.");
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatBriefPlainText(result));
      setCopyState("copied");
      setSuccessMessage("Đã sao chép nội dung");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setErrorMessage("Không thể sao chép nội dung. Vui lòng thử lại.");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const startManualEdit = () => {
    if (!result) return;
    setManualDraft(createBriefEditDraft(result));
    setIsManualEditing(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const saveManualEdit = () => {
    if (!manualDraft) return;
    const savedResult = briefEditDraftToResult(manualDraft);
    const validationError = validateBrief(savedResult);
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }
    setResult(savedResult);
    if (activeBriefId !== null) {
      setHistory((current) => current.map((item) => item.id === activeBriefId ? { ...item, result: savedResult } : item));
    }
    setManualDraft(null);
    setIsManualEditing(false);
    setErrorMessage("");
    setSuccessMessage("Đã lưu chỉnh sửa thủ công.");
  };

  const cancelManualEdit = () => {
    setManualDraft(null);
    setIsManualEditing(false);
    setErrorMessage("");
    setSuccessMessage("Đã hủy chỉnh sửa thủ công.");
  };

  const updateManualText = (field: BriefTextField, value: string) => {
    setManualDraft((current) => current ? { ...current, [field]: value } : current);
  };

  const updateManualList = (field: BriefListField, value: string) => {
    setManualDraft((current) => current ? { ...current, [field]: value } : current);
  };

  const createCampaignFromBrief = () => {
    if (!result) return;
    const draft = {
      source: "auto-brief",
      aiBrief: result,
      optionalFields: {
        brand: form.brand || null,
        product: form.product || null,
        platform: form.platform || null,
        targetAudience: form.targetAudience || null,
        budget: form.budget || null,
      },
    };
    sessionStorage.setItem(AI_CAMPAIGN_DRAFT_KEY, JSON.stringify(draft));
    navigate("/marketer/campaigns", { state: draft });
  };

  return (
    <DashboardLayout role="marketer">
      <div className="space-y-6">
        <AiPageHeader
          eyebrow="AI cho Marketer"
          title="AI Tạo Brief"
          description="Biến ý tưởng chiến dịch thành brief chi tiết, sẵn sàng triển khai với KOC phù hợp."
          icon={<Sparkles size={28} className="text-white" />}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsHistoryOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary/40 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            <History size={16} className="text-primary" />
            {isHistoryOpen ? "Ẩn lịch sử" : "Mở lịch sử"}
            {isHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className={`grid gap-6 ${isHistoryOpen ? "xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]" : "xl:grid-cols-[minmax(0,1fr)]"}`}>
          <div className="space-y-6">
            <AiSectionCard title="Tạo brief mới">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ý tưởng chiến dịch <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={form.inputText}
                    onChange={(e) => handleChange("inputText", e.target.value)}
                    rows={5}
                    className={inputClassName}
                    placeholder="Mô tả mục tiêu, insight khách hàng, định hướng nội dung..."
                  />
                </div>

                <AiPromptChips
                  title="Gợi ý prompt cho Marketer"
                  prompts={MARKETER_PROMPTS}
                  onSelect={(prompt) => handleChange("inputText", prompt)}
                />

                <div ref={productSuggestionRootRef} className="grid gap-4 md:grid-cols-2">
                  <div data-product-suggestion-scope>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Thương hiệu</label>
                    <input
                      value={form.brand}
                      onFocus={() => setActiveSuggestionField("brand")}
                      onClick={() => setActiveSuggestionField("brand")}
                      onChange={(e) => handleChange("brand", e.target.value)}
                      className={inputClassName}
                      placeholder="Ví dụ: SunGlow, L’Oréal, Cocoon, Vinamilk..."
                    />
                    {activeSuggestionField === "brand" ? (
                      <ProductSuggestionChips
                        options={brandSuggestions}
                        onSelect={(value) => handleChange("brand", appendUniqueProductValue(form.brand, value))}
                      />
                    ) : null}
                  </div>
                  <div data-product-suggestion-scope>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Sản phẩm</label>
                    <input
                      value={form.product}
                      onFocus={() => setActiveSuggestionField("product")}
                      onClick={() => setActiveSuggestionField("product")}
                      onChange={(e) => handleChange("product", e.target.value)}
                      className={inputClassName}
                      placeholder="Ví dụ: Serum chống nắng, son tint, áo khoác, sữa hạt..."
                    />
                    {activeSuggestionField === "product" ? (
                      <ProductSuggestionChips
                        options={productSuggestions}
                        onSelect={(value) => handleChange("product", appendUniqueProductValue(form.product, value))}
                      />
                    ) : null}
                  </div>
                  <div data-product-suggestion-scope>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Hình dạng</label>
                    <input
                      value={form.shape}
                      onFocus={() => setActiveSuggestionField("shape")}
                      onClick={() => setActiveSuggestionField("shape")}
                      onChange={(e) => handleChange("shape", e.target.value)}
                      className={inputClassName}
                      placeholder="Ví dụ: Dạng kem, gel, xịt, thanh, bột, viên..."
                    />
                    {activeSuggestionField === "shape" ? (
                      <ProductSuggestionChips
                        options={productShapeSuggestions}
                        onSelect={(value) => handleChange("shape", appendUniqueProductValue(form.shape, value))}
                      />
                    ) : null}
                  </div>
                  <div data-product-suggestion-scope>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Tính chất</label>
                    <input
                      value={form.properties}
                      onFocus={() => setActiveSuggestionField("properties")}
                      onClick={() => setActiveSuggestionField("properties")}
                      onChange={(e) => handleChange("properties", e.target.value)}
                      className={inputClassName}
                      placeholder="Ví dụ: Dịu nhẹ, thấm nhanh, không bết dính, chống nước..."
                    />
                    {activeSuggestionField === "properties" ? (
                      <ProductSuggestionChips
                        options={productPropertySuggestions}
                        onSelect={(value) => handleChange("properties", appendUniqueProductValue(form.properties, value))}
                      />
                    ) : null}
                  </div>
                  <div data-product-suggestion-scope>
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
                      <ProductSuggestionChips
                        options={platformSuggestions}
                        onSelect={(value) => handleChange("platform", appendUniqueProductValue(form.platform, value))}
                      />
                    ) : null}
                  </div>
                  <div data-product-suggestion-scope>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Khách hàng mục tiêu</label>
                    <input
                      value={form.targetAudience}
                      onFocus={() => setActiveSuggestionField("targetAudience")}
                      onClick={() => setActiveSuggestionField("targetAudience")}
                      onChange={(e) => handleChange("targetAudience", e.target.value)}
                      className={inputClassName}
                      placeholder="Ví dụ: Nữ 18–30 tuổi, sinh viên, mẹ bỉm, nhân viên văn phòng..."
                    />
                    {activeSuggestionField === "targetAudience" ? (
                      <ProductSuggestionChips
                        options={targetAudienceSuggestions}
                        onSelect={(value) => handleChange("targetAudience", appendUniqueProductValue(form.targetAudience, value))}
                      />
                    ) : null}
                  </div>
                  <div data-product-suggestion-scope className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Ngân sách</label>
                    <input
                      value={formatThousands(form.budget)}
                      onFocus={() => setActiveSuggestionField("budget")}
                      onClick={() => setActiveSuggestionField("budget")}
                      onChange={(e) => handleChange("budget", String(parseThousands(e.target.value)))}
                      className={inputClassName}
                      placeholder="Ví dụ: 150.000.000"
                    />
                    <p className="mt-1 text-xs text-slate-500">Nhập ngân sách dự kiến bằng VNĐ.</p>
                    {activeSuggestionField === "budget" ? (
                      <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <p className="mb-2 text-xs font-semibold text-slate-400">Chọn gợi ý</p>
                        <div className="flex flex-wrap gap-2">
                          {budgetSuggestions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleChange("budget", option.value)}
                              className={suggestionChipClassName}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {errorMessage ? <AiNotice tone="error">{errorMessage}</AiNotice> : null}
                {successMessage ? <AiNotice tone="success">{successMessage}</AiNotice> : null}

                <AiSubmitButton loading={loading} label="Tạo AI Brief" loadingLabel="Đang tạo brief..." />
              </form>
            </AiSectionCard>

            {result ? (
              <AiSectionCard
                title="Kết quả AI Brief"
                actions={
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10">
                      {copyState === "copied" ? <Check size={14} /> : <Copy size={14} />}
                      {copyState === "copied" ? "Đã sao chép" : "Sao chép"}
                    </button>
                    <button type="button" onClick={startManualEdit} disabled={isManualEditing} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-50">
                      <Pencil size={14} />
                      Chỉnh sửa thủ công
                    </button>
                    <button type="button" onClick={createCampaignFromBrief} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-primary/20 hover:bg-primary-hover">
                      Tạo chiến dịch mới
                    </button>
                  </div>
                }
              >
                {isManualEditing && manualDraft ? (
                  <div className="space-y-4">
                    {textFields.map((field) => (
                      <div key={field.key}>
                        <label className="mb-1 block text-sm font-semibold text-slate-200">{field.label}</label>
                        {field.rows ? (
                          <textarea value={manualDraft[field.key]} onChange={(e) => updateManualText(field.key, e.target.value)} rows={field.rows} className={inputClassName} />
                        ) : (
                          <input value={manualDraft[field.key]} onChange={(e) => updateManualText(field.key, e.target.value)} className={inputClassName} />
                        )}
                      </div>
                    ))}
                    <div className="grid gap-4 md:grid-cols-2">
                      {listFields.map((field) => (
                        <div key={field.key}>
                          <label className="mb-1 block text-sm font-semibold text-slate-200">{field.label}</label>
                          <textarea value={manualDraft[field.key]} onChange={(e) => updateManualList(field.key, e.target.value)} rows={5} className={inputClassName} />
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
                  <BriefDisplay brief={result} />
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
                      placeholder="Ví dụ: Rút ngắn nội dung, đổi tone chuyên nghiệp hơn, tăng ngân sách lên 200 triệu..."
                    />
                    <button
                      type="button"
                      onClick={handleAiRevision}
                      disabled={revisionLoading || isManualEditing || !revisionPrompt.trim()}
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
                  Nhập ý tưởng chiến dịch và nhấn &quot;Tạo AI Brief&quot; để nhận brief chi tiết từ AI.
                </p>
              </AiSectionCard>
            )}
          </div>

          {isHistoryOpen ? (
            <div className="transition-all duration-300 ease-out">
              <AiSectionCard title="Lịch sử gần đây">
                {historyLoading ? <p className="text-sm text-slate-500">Đang tải lịch sử...</p> : null}
                {!historyLoading && history.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có brief nào được lưu.</p>
                ) : null}
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => loadHistoryItem(item)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-slate-800">{item.result.campaignTitle}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.inputText}</p>
                    </button>
                  ))}
                </div>
              </AiSectionCard>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
