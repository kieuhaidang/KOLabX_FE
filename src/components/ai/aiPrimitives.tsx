import { useState, type ReactNode } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

export function AiPageHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <section className="admin-hero-strong p-6 text-white md:p-8">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-white/15 bg-white/15 p-3 shadow-inner">{icon}</div>
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-white/85">{eyebrow}</p>
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-white/85 md:text-base">{description}</p>
        </div>
      </div>
    </section>
  );
}

export function AiSectionCard({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/12 bg-surface/90 p-6 shadow-[var(--shadow-soft)]">
      {title ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white">{title}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function AiNotice({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-red-400/35 bg-red-500/15 text-red-100"
      : tone === "success"
        ? "border-teal-300/35 bg-teal-400/15 text-teal-100"
        : "border-primary/40 bg-primary/15 text-orange-100";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>{children}</div>;
}

export function AiPromptChips({
  title,
  prompts,
  onSelect,
}: {
  title: string;
  prompts: string[];
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-left text-xs text-slate-300 transition hover:border-primary/40 hover:bg-primary/10 hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AiListSection({ label, items }: { label: string; items: string[] }) {
  if (!items.length) {
    return (
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-200">{label}</h3>
        <p className="text-sm text-slate-400">Không có dữ liệu.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-200">{label}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
        {items.map((item, index) => (
          <li key={`${label}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function AiTextSection({ label, value }: { label: string; value: string }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-200">{label}</h3>
      <p className="whitespace-pre-wrap text-sm text-slate-300">{value || "-"}</p>
    </section>
  );
}

export function CopyJsonButton({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Đã sao chép" : "Sao chép JSON"}
    </button>
  );
}

export function AiSubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="ai-primary-cta"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {loading ? loadingLabel : label}
    </button>
  );
}

export const inputClassName =
  "w-full rounded-2xl border border-white/12 bg-black/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20";
