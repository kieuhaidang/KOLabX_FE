import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { cn } from "../components/ui/utils";
import { getButtonGradient, getStrongGradient } from "./applyTheme";
import { useTheme } from "./ThemeProvider";
import type { Theme } from "./themes";

function ThemePreview({ theme }: { theme: Theme }) {
  const { colors } = theme;
  return (
    <div
      className="relative h-16 overflow-hidden rounded-xl border border-white/10"
      style={{ background: `linear-gradient(135deg, ${colors.shell[0]}, ${colors.shell[2]})` }}
      aria-hidden="true"
    >
      <div className="absolute inset-x-2 top-2 h-5 rounded-md" style={{ background: getStrongGradient(theme) }} />
      <div className="absolute bottom-2 left-2 h-4 w-14 rounded-full" style={{ background: getButtonGradient(theme) }} />
      <div className="absolute bottom-2 right-2 flex gap-1">
        {[colors.primary, colors.accent, colors.secondary].map((color, index) => (
          <span key={index} className="h-3.5 w-3.5 rounded-full border border-white/30" style={{ background: color }} />
        ))}
      </div>
    </div>
  );
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme: activeTheme, themes, setTheme, previewTheme, syncError } = useTheme();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) previewTheme(null);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Đổi giao diện màu"
          title="Đổi giao diện màu"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/15",
            className
          )}
        >
          <Palette size={18} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(25rem,calc(100vw-2rem))] rounded-2xl border-white/12 p-4 text-white shadow-2xl"
        style={{ background: "rgb(var(--kl-surface-rgb) / 0.97)" }}
        onMouseLeave={() => previewTheme(null)}
      >
        <div className="mb-3">
          <p className="text-sm font-black">Giao diện màu</p>
          <p className="text-xs text-white/60">Rê chuột để xem trước, bấm để áp dụng.</p>
        </div>

        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Chọn theme">
          {themes.map((theme) => {
            const isActive = theme.id === activeTheme.id;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onMouseEnter={() => previewTheme(theme.id)}
                onFocus={() => previewTheme(theme.id)}
                onClick={() => {
                  setTheme(theme.id);
                  setOpen(false);
                }}
                className={cn(
                  "group rounded-2xl border p-2 text-left transition hover:-translate-y-0.5",
                  isActive ? "border-white/70 bg-white/10" : "border-white/10 bg-white/[0.03] hover:border-white/30"
                )}
              >
                <ThemePreview theme={theme} />
                <div className="mt-2 flex items-start justify-between gap-1 px-0.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{theme.name}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                      {theme.kind === "gradient" ? "Gradient" : "Đơn sắc"}
                    </p>
                  </div>
                  {isActive && (
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-black">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {syncError && <p className="mt-3 text-xs font-semibold text-amber-300">{syncError}</p>}
      </PopoverContent>
    </Popover>
  );
}
