import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { AUTH_USER_KEY } from "../services/api";
import { updateThemePreference } from "../services/authService";
import { applyTheme, readStoredThemeId, storeThemeId } from "./applyTheme";
import { getTheme, isKnownThemeId, THEMES, type Theme } from "./themes";

type ThemeContextValue = {
  theme: Theme;
  themes: Theme[];
  /** Chọn theme: áp dụng ngay, lưu trên trình duyệt và (nếu đã đăng nhập) lưu vào tài khoản. */
  setTheme: (id: string) => void;
  /** Xem trước tạm thời khi rê chuột; truyền null để quay về theme đang chọn. */
  previewTheme: (id: string | null) => void;
  /** Lỗi khi lưu theme vào tài khoản (theme vẫn được áp dụng trên trình duyệt). */
  syncError: string | null;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const [themeId, setThemeId] = useState(() => getTheme(readStoredThemeId()).id);
  const [syncError, setSyncError] = useState<string | null>(null);
  const theme = getTheme(themeId);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Đăng nhập (hoặc tải lại trang khi đã đăng nhập): theme lưu trong tài khoản được ưu tiên.
  const accountThemeId = user?.themePreference;
  useEffect(() => {
    if (isKnownThemeId(accountThemeId)) {
      setThemeId(accountThemeId);
      storeThemeId(accountThemeId);
    }
  }, [accountThemeId]);

  const setTheme = useCallback(
    (id: string) => {
      if (!isKnownThemeId(id)) return;
      setThemeId(id);
      storeThemeId(id);
      setSyncError(null);

      if (!user || user.themePreference === id) return;
      const nextUser = { ...user, themePreference: id };
      setUser(nextUser);
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      } catch {
        // bỏ qua: đây chỉ là bản cache của user
      }

      updateThemePreference(id).catch(() => {
        setSyncError("Chưa lưu được vào tài khoản — theme chỉ áp dụng trên trình duyệt này.");
      });
    },
    [setUser, user]
  );

  const previewTheme = useCallback(
    (id: string | null) => {
      applyTheme(id ? getTheme(id) : theme);
    },
    [theme]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themes: THEMES, setTheme, previewTheme, syncError }),
    [previewTheme, setTheme, syncError, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
