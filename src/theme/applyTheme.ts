import { getTheme, type Theme } from "./themes";

export const THEME_STORAGE_KEY = "kolab_theme";

function hexToRgbTriplet(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const num = parseInt(full, 16);
  return `${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255}`;
}

/** Gradient của nút; theme đơn sắc dùng dải cùng tông màu primary. */
export function getButtonGradient(theme: Theme) {
  const { primary } = theme.colors;
  return theme.gradient ?? `linear-gradient(90deg, ${primary} 0%, color-mix(in oklab, ${primary} 82%, white) 100%)`;
}

/** Gradient mạnh cho hero/banner, cũng dùng làm ảnh preview trong Theme Switcher. */
export function getStrongGradient(theme: Theme) {
  const { deep, secondary, primary } = theme.colors;
  return (
    theme.gradientStrong ??
    `linear-gradient(110deg, ${deep} 0%, ${secondary} 34%, color-mix(in oklab, ${primary} 45%, black) 68%, ${primary} 100%)`
  );
}

export function buildThemeVariables(theme: Theme): Record<string, string> {
  const c = theme.colors;
  return {
    "--kl-primary": c.primary,
    "--kl-primary-rgb": hexToRgbTriplet(c.primary),
    "--kl-accent": c.accent,
    "--kl-accent-rgb": hexToRgbTriplet(c.accent),
    "--kl-secondary": c.secondary,
    "--kl-secondary-rgb": hexToRgbTriplet(c.secondary),
    "--kl-deep": c.deep,
    "--kl-deep-rgb": hexToRgbTriplet(c.deep),
    "--kl-base": c.base,
    "--kl-surface": c.surface,
    "--kl-surface-rgb": hexToRgbTriplet(c.surface),
    "--kl-shell-1": c.shell[0],
    "--kl-shell-2": c.shell[1],
    "--kl-shell-3": c.shell[2],
    "--kl-on-primary": c.onPrimary,
    "--kl-gradient": getButtonGradient(theme),
    "--kl-gradient-strong": getStrongGradient(theme),
  };
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(buildThemeVariables(theme))) {
    root.style.setProperty(name, value);
  }
  root.dataset.theme = theme.id;
  root.dataset.themeKind = theme.kind;
}

/**
 * Theme đang hiển thị. Chỉ dùng cho chỗ không đọc được biến CSS
 * (ví dụ ảnh SVG dạng data URI); còn lại hãy dùng var(--kl-*).
 */
export function getActiveTheme(): Theme {
  return getTheme(document.documentElement.dataset.theme);
}

export function readStoredThemeId(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeThemeId(id: string) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // localStorage có thể bị chặn (chế độ riêng tư) – theme vẫn áp dụng cho phiên hiện tại.
  }
}

/** Gọi trước khi React render để trang hiển thị đúng theme ngay từ khung hình đầu tiên. */
export function applyInitialTheme() {
  applyTheme(getTheme(readStoredThemeId()));
}
