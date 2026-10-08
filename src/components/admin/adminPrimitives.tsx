import type { ReactNode } from "react";

export function AdminPageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="admin-hero-strong p-6 text-white">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-20 h-56 w-56 rounded-full bg-primary/24 blur-3xl" />
      <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-white/80">{eyebrow}</p>}
          <h1 className="text-3xl font-black tracking-tight text-white lg:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/85 lg:text-base">{description}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AdminStatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-teal-400/15 text-teal-100 border-teal-300/35"
      : tone === "warning"
        ? "bg-primary/15 text-orange-100 border-primary/40"
        : tone === "danger"
          ? "bg-red-500/15 text-red-100 border-red-400/35"
          : "bg-white/10 text-white border-white/15";

  return (
    <article className="card-modern p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneClass}`}>{icon}</div>
      </div>
      {subtitle ? <p className="text-sm leading-6 text-slate-400">{subtitle}</p> : null}
    </article>
  );
}

export function AdminSectionCard({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-[28px] border border-white/12 bg-[rgba(17,17,17,0.9)] shadow-[var(--shadow-soft)] ${className}`.trim()}>
      <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.035] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function AdminNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "danger";
}) {
  const toneClass =
    tone === "warning"
      ? "border-primary/40 bg-primary/15 text-orange-100"
      : tone === "danger"
        ? "border-red-400/35 bg-red-500/15 text-red-100"
        : "border-teal-300/35 bg-teal-400/15 text-teal-100";

  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-6 shadow-sm ${toneClass}`}>{children}</div>;
}

export function AdminTableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-white/12 bg-black/30">{children}</div>;
}
