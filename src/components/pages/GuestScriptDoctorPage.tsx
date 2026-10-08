import { useEffect, useState, type FormEvent } from "react";
import { Copy, FileText, Pencil } from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { ApiError } from "../../services/api";
import { generateGuestScriptDoctor, getGuestAiQuota } from "../../services/guestAiService";
import {
  GUEST_AI_TRIAL_LIMIT,
  readGuestScriptDoctorDraft,
  saveGuestScriptDoctorDraft,
  savePostLoginIntent,
  type GuestScriptDoctorForm,
  type GuestTrialQuota,
} from "../../services/guestTrial";
import type { ScriptDoctorResult } from "../../services/aiService";
import { useAuth } from "../auth/AuthProvider";
import { GuestAuthDialog } from "../ai/GuestAuthDialog";
import { PublicAiTrialShell } from "../ai/PublicAiTrialShell";
import { AiListSection, AiNotice, AiPageHeader, AiPromptChips, AiSectionCard, AiSubmitButton, AiTextSection, inputClassName } from "../ai/aiPrimitives";

const initialForm: GuestScriptDoctorForm = { inputScript: "", platform: "", tone: "", product: "", targetAudience: "" };
const prompts = [
  "Hôm nay mình review kem chống nắng này nha. Dùng cũng khá ổn, mọi người mua thử nhé.",
  "Chiếc tai nghe gaming này có pin lâu và giá rẻ. Link mình để bên dưới.",
  "Mình mới thử quán trà sữa này thấy ngon nên review cho mọi người.",
];

function isExhausted(error: unknown) {
  return error instanceof ApiError && typeof error.payload === "object" && error.payload !== null &&
    (error.payload as { code?: string }).code === "GUEST_TRIAL_EXHAUSTED";
}

function formatResult(value: ScriptDoctorResult) {
  const list = (items: string[]) => items.map((item) => `- ${item}`).join("\n");
  return `HOOK\n${value.improvedHook}\n\nSCRIPT\n${value.improvedScript}\n\nCTA\n${value.strongerCTA}\n\nGỢI Ý\n${list(value.contentTips)}\n\nTỐI ƯU NỀN TẢNG\n${list(value.platformOptimization)}\n\nHASHTAGS\n${list(value.hashtagSuggestions)}`;
}

function EditResult({ value, onSave, onCancel }: { value: ScriptDoctorResult; onSave: (value: ScriptDoctorResult) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState({
    ...value,
    contentTips: value.contentTips.join("\n"),
    platformOptimization: value.platformOptimization.join("\n"),
    hashtagSuggestions: value.hashtagSuggestions.join("\n"),
  });
  const lines = (text: string) => text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  return <div className="space-y-3">
    <textarea aria-label="Hook" rows={3} className={inputClassName} value={draft.improvedHook} onChange={(e) => setDraft({ ...draft, improvedHook: e.target.value })} />
    <textarea aria-label="Script" rows={8} className={inputClassName} value={draft.improvedScript} onChange={(e) => setDraft({ ...draft, improvedScript: e.target.value })} />
    <textarea aria-label="CTA" rows={3} className={inputClassName} value={draft.strongerCTA} onChange={(e) => setDraft({ ...draft, strongerCTA: e.target.value })} />
    <textarea aria-label="Gợi ý nội dung" rows={4} className={inputClassName} value={draft.contentTips} onChange={(e) => setDraft({ ...draft, contentTips: e.target.value })} />
    <textarea aria-label="Tối ưu nền tảng" rows={4} className={inputClassName} value={draft.platformOptimization} onChange={(e) => setDraft({ ...draft, platformOptimization: e.target.value })} />
    <textarea aria-label="Hashtags" rows={3} className={inputClassName} value={draft.hashtagSuggestions} onChange={(e) => setDraft({ ...draft, hashtagSuggestions: e.target.value })} />
    <div className="flex gap-2"><button type="button" onClick={() => onSave({ ...draft, contentTips: lines(draft.contentTips), platformOptimization: lines(draft.platformOptimization), hashtagSuggestions: lines(draft.hashtagSuggestions) })} className="rounded-full bg-primary px-4 py-2 text-sm font-bold">Lưu chỉnh sửa</button><button type="button" onClick={onCancel} className="rounded-full border border-white/15 px-4 py-2 text-sm">Hủy</button></div>
  </div>;
}

export function GuestScriptDoctorPage() {
  const navigate = useNavigate();
  const { user, isBootstrapping } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<ScriptDoctorResult | null>(null);
  const [quota, setQuota] = useState<GuestTrialQuota>({ limit: GUEST_AI_TRIAL_LIMIT, used: 0, remaining: GUEST_AI_TRIAL_LIMIT, requiresAuth: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) return;
    const saved = readGuestScriptDoctorDraft();
    if (saved) { setForm(saved.form); setResult(saved.result); }
    getGuestAiQuota("script_doctor").then(setQuota).catch(() => undefined);
  }, [user]);

  if (isBootstrapping) return <div className="min-h-screen bg-[#080b0b]" />;
  if (user?.role === "koc") return <Navigate to="/koc/script-doctor" replace />;
  if (user) return <PublicAiTrialShell><AiNotice tone="error">Tính năng Script Doctor yêu cầu tài khoản KOC.</AiNotice></PublicAiTrialShell>;

  const update = (field: keyof GuestScriptDoctorForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (quota.remaining <= 0) { setDialogOpen(true); return; }
    if (!form.inputScript.trim()) { setError("Vui lòng nhập kịch bản."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await generateGuestScriptDoctor({
        inputScript: form.inputScript.trim(), platform: form.platform.trim() || null,
        tone: form.tone.trim() || null, product: form.product.trim() || null,
        targetAudience: form.targetAudience.trim() || null,
      });
      setResult(response.result); setQuota(response.quota); setEditing(false);
      saveGuestScriptDoctorDraft(form, response.result);
      setSuccess("Phân tích Script Doctor thành công.");
    } catch (caught) {
      if (isExhausted(caught)) {
        setQuota({ limit: GUEST_AI_TRIAL_LIMIT, used: GUEST_AI_TRIAL_LIMIT, remaining: 0, requiresAuth: true });
        setDialogOpen(true);
      }
      setError(caught instanceof ApiError ? caught.message : "Không thể phân tích script.");
    } finally { setLoading(false); }
  };
  const prepareLogin = () => {
    saveGuestScriptDoctorDraft(form, result);
    savePostLoginIntent("continue-script-doctor");
  };

  const goToLogin = () => {
    prepareLogin();
    navigate("/login?role=koc");
  };
  const copy = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(formatResult(result)); setSuccess("Đã sao chép nội dung."); }
    catch { setError("Không thể sao chép nội dung."); }
  };

  return <PublicAiTrialShell>
    <div className="space-y-6">
      <AiPageHeader eyebrow="Dùng thử miễn phí" title="AI Script Doctor" description="Tối ưu hook, kịch bản, CTA và hashtag trước khi đăng nhập." icon={<FileText size={28} />} />
      <AiNotice tone={quota.remaining > 0 ? "info" : "error"}>
        {quota.remaining > 0 ? `Bạn đang dùng thử Script Doctor: còn ${quota.remaining} lượt.` : "Bạn đã hết lượt dùng thử. Đăng nhập để tiếp tục sử dụng Script Doctor."}
        {quota.remaining === 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setDialogOpen(true)} className="rounded-full bg-primary px-4 py-2 font-bold">Đăng nhập</button>
            <button type="button" onClick={() => setDialogOpen(true)} className="rounded-full border border-white/20 px-4 py-2 font-bold">Đăng ký</button>
          </div>
        ) : (
          <button type="button" onClick={goToLogin} className="mt-3 text-sm font-bold text-secondary hover:underline">
            Đã có tài khoản KOC? Đăng nhập để tiếp tục
          </button>
        )}
      </AiNotice>
      <div className="grid gap-6 lg:grid-cols-2">
        <AiSectionCard title="Phân tích kịch bản">
          <form onSubmit={submit} className="space-y-4">
            <textarea value={form.inputScript} onChange={(e) => update("inputScript", e.target.value)} rows={9} maxLength={12000} className={inputClassName} placeholder="Dán kịch bản gốc của bạn..." />
            <AiPromptChips title="Gợi ý nhanh" prompts={prompts} onSelect={(value) => update("inputScript", value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <input aria-label="Nền tảng" placeholder="Nền tảng" value={form.platform} onChange={(e) => update("platform", e.target.value)} maxLength={500} className={inputClassName} />
              <input aria-label="Tone" placeholder="Tone" value={form.tone} onChange={(e) => update("tone", e.target.value)} maxLength={500} className={inputClassName} />
              <input aria-label="Sản phẩm" placeholder="Sản phẩm" value={form.product} onChange={(e) => update("product", e.target.value)} maxLength={500} className={inputClassName} />
              <input aria-label="Khách hàng mục tiêu" placeholder="Khách hàng mục tiêu" value={form.targetAudience} onChange={(e) => update("targetAudience", e.target.value)} maxLength={500} className={inputClassName} />
            </div>
            {error ? <AiNotice tone="error">{error}</AiNotice> : null}{success ? <AiNotice tone="success">{success}</AiNotice> : null}
            <AiSubmitButton loading={loading} label={quota.remaining > 0 ? "Phân tích Script" : "Đăng nhập để tiếp tục"} loadingLabel="Đang phân tích..." />
          </form>
        </AiSectionCard>
        <AiSectionCard title="Kết quả phân tích" actions={result ? <div className="flex gap-2"><button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs"><Pencil size={13} />Chỉnh sửa</button><button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs"><Copy size={13} />Sao chép</button></div> : undefined}>
          {result ? editing ? <EditResult value={result} onCancel={() => setEditing(false)} onSave={(value) => { setResult(value); setEditing(false); saveGuestScriptDoctorDraft(form, value); }} /> : <div className="space-y-5"><AiTextSection label="Hook đã cải thiện" value={result.improvedHook} /><AiTextSection label="Script đã tối ưu" value={result.improvedScript} /><AiTextSection label="CTA mạnh hơn" value={result.strongerCTA} /><AiListSection label="Gợi ý nội dung" items={result.contentTips} /><AiListSection label="Tối ưu nền tảng" items={result.platformOptimization} /><AiListSection label="Hashtags" items={result.hashtagSuggestions} /></div> : <p className="text-sm text-slate-400">Kết quả sẽ xuất hiện tại đây và không bị xóa khi một yêu cầu thất bại.</p>}
        </AiSectionCard>
      </div>
    </div>
    <GuestAuthDialog open={dialogOpen} onOpenChange={setDialogOpen} kind="exhausted" role="koc" onBeforeNavigate={prepareLogin} />
  </PublicAiTrialShell>;
}
