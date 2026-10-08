export type RealKolCategory =
  | "technology"
  | "fashion_beauty"
  | "travel"
  | "lifestyle_food"
  | "tiktok";

export type RealKol = {
  id: number;
  name: string;
  category: RealKolCategory;
};

export const REAL_KOLS: RealKol[] = [
  { id: 1, name: "Duy Thắm", category: "technology" },
  { id: 2, name: "Hải Triều", category: "technology" },
  { id: 3, name: "Dương Dê", category: "technology" },
  { id: 4, name: "Châu Bùi", category: "fashion_beauty" },
  { id: 5, name: "Khánh Linh (Cô Em Trendy)", category: "fashion_beauty" },
  { id: 6, name: "Trinh Pham", category: "fashion_beauty" },
  { id: 7, name: "Khoai Lang Thang", category: "travel" },
  { id: 8, name: "Ninh Tito", category: "travel" },
  { id: 9, name: "Giang Ơi", category: "lifestyle_food" },
  { id: 10, name: "CiiN", category: "tiktok" },
  { id: 11, name: "Hana Giang Anh", category: "lifestyle_food" },
  { id: 12, name: "Long Chun", category: "tiktok" },
  { id: 13, name: "Salim (Pam Yêu Ơi)", category: "lifestyle_food" },
  { id: 14, name: "Quang Vinh", category: "travel" },
  { id: 15, name: "Dino Vũ", category: "lifestyle_food" }
];

export const REAL_KOL_CATEGORY_LABEL: Record<RealKolCategory, string> = {
  technology: "Công nghệ",
  fashion_beauty: "Thời trang & Làm đẹp",
  travel: "Du lịch",
  lifestyle_food: "Lifestyle & Food",
  tiktok: "TikTok Creators",
};
