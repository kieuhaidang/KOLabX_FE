export type KocOverride = {
  name?: string;
  avatar?: string;
};

// Update real creator data by userId here.
// Example:
// 5: { name: "Nguyen Van A", avatar: "/koc/5.jpg" }
export const kocOverrides: Record<number, KocOverride> = {};
