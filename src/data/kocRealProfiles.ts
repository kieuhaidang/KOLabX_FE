import { REAL_KOLS } from "./realKols";

type RealKocProfile = {
  id: number;
  name: string;
};

const REAL_KOC_POOL: RealKocProfile[] = REAL_KOLS.map((item) => ({
  id: item.id,
  name: item.name,
}));

export function getRealKocFallback(userId: number) {
  const selected = REAL_KOC_POOL[(Math.max(1, userId) - 1) % REAL_KOC_POOL.length];

  return {
    name: selected.name,
    avatar: `/koc/${selected.id}.jpg`,
  };
}
