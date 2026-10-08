// ĐÂY LÀ NƠI DUY NHẤT ĐỊNH NGHĨA MÀU CỦA TOÀN BỘ WEB.
// - Đổi màu một theme: sửa giá trị hex bên dưới.
// - Thêm theme mới: thêm một object vào THEMES (id chỉ gồm a-z, 0-9, "-").
// Mọi theme đều dùng nền tối; các biến CSS được sinh ra trong applyTheme.ts.

export type ThemeKind = "solid" | "gradient";

export type ThemeColors = {
  /** Màu nhấn chính: nút CTA, link, viền focus. Chữ trên nền này là `onPrimary`. */
  primary: string;
  /** Màu nhấn phụ, sáng: hiệu ứng glow, hover, điểm nhấn thứ hai. */
  accent: string;
  /** Màu phụ đậm: khối nền màu, header bảng, section nổi bật. */
  secondary: string;
  /** Biến thể rất tối của secondary, dùng cho các dải gradient nền. */
  deep: string;
  /** Nền tối nhất của trang. */
  base: string;
  /** Nền của card / panel / modal. */
  surface: string;
  /** 3 điểm màu của gradient nền vùng dashboard & trang đăng nhập. */
  shell: [string, string, string];
  /** Màu chữ đặt trên nền primary. */
  onPrimary: string;
};

export type Theme = {
  id: string;
  name: string;
  description: string;
  kind: ThemeKind;
  colors: ThemeColors;
  /** Gradient cho nút / tab đang chọn. Bỏ trống với theme đơn sắc (tự sinh từ primary). */
  gradient?: string;
  /** Gradient mạnh cho hero / banner. Bỏ trống để tự sinh từ deep → secondary → primary. */
  gradientStrong?: string;
};

export const THEMES: Theme[] = [
  {
    id: "cam-hoang-hon",
    name: "Cam Hoàng Hôn",
    description: "Cam đỏ & xanh teal — giao diện gốc của KOLab",
    kind: "solid",
    colors: {
      primary: "#ff4b1f",
      accent: "#0fb7ad",
      secondary: "#0d4f4b",
      deep: "#032f2c",
      base: "#050505",
      surface: "#111111",
      shell: ["#20262c", "#282f36", "#223634"],
      onPrimary: "#ffffff",
    },
    gradientStrong: "linear-gradient(110deg, #032f2c 0%, #06453f 30%, #3a140b 68%, #ff4b1f 100%)",
  },
  {
    id: "tim-dem",
    name: "Tím Đêm",
    description: "Tím huyền ảo trên nền đen sâu",
    kind: "gradient",
    colors: {
      primary: "#582c96",
      accent: "#a08ccc",
      secondary: "#3d2075",
      deep: "#140a26",
      base: "#040114",
      surface: "#0d071d",
      shell: ["#050115", "#0a022a", "#150626"],
      onPrimary: "#ffffff",
    },
    gradient: "linear-gradient(135deg, #7a55c4 0%, #582c96 50%, #361a66 100%)",
    gradientStrong: "linear-gradient(110deg, #040114 0%, #140a26 35%, #48267f 72%, #8a76b8 100%)",
  },
  {
    id: "dai-duong",
    name: "Đại Dương",
    description: "Xanh dương & navy, chuyên nghiệp",
    kind: "solid",
    colors: {
      primary: "#3b82f6",
      accent: "#38bdf8",
      secondary: "#1e3a8a",
      deep: "#0b1a3a",
      base: "#03060c",
      surface: "#0d1220",
      shell: ["#111827", "#172033", "#0f2a3d"],
      onPrimary: "#ffffff",
    },
  },
  {
    id: "luc-bao",
    name: "Lục Bảo",
    description: "Xanh lục bảo tươi mát",
    kind: "solid",
    colors: {
      primary: "#059669",
      accent: "#2dd4bf",
      secondary: "#065f46",
      deep: "#022c22",
      base: "#030705",
      surface: "#0c1411",
      shell: ["#0f1a17", "#13221d", "#0f2a24"],
      onPrimary: "#ffffff",
    },
  },
  {
    id: "binh-minh",
    name: "Bình Minh",
    description: "Hồng chuyển cam rực rỡ",
    kind: "gradient",
    colors: {
      primary: "#ec4899",
      accent: "#fb923c",
      secondary: "#831843",
      deep: "#3b0a1f",
      base: "#070305",
      surface: "#160c11",
      shell: ["#1a1016", "#22121b", "#2a1512"],
      onPrimary: "#ffffff",
    },
    gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #f97316 100%)",
    gradientStrong: "linear-gradient(110deg, #3b0a1f 0%, #831843 40%, #e11d48 72%, #f97316 100%)",
  },
  {
    id: "than-chi",
    name: "Than Chì",
    description: "Xám than tối giản, đơn sắc",
    kind: "solid",
    colors: {
      primary: "#71717a",
      accent: "#d4d4d8",
      secondary: "#3f3f46",
      deep: "#18181b",
      base: "#050505",
      surface: "#121214",
      shell: ["#1c1c1f", "#232327", "#1a1a1d"],
      onPrimary: "#ffffff",
    },
  },
];

export const DEFAULT_THEME_ID = "cam-hoang-hon";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES.find((theme) => theme.id === DEFAULT_THEME_ID)!;
}

export function isKnownThemeId(id: string | null | undefined): id is string {
  return THEMES.some((theme) => theme.id === id);
}
