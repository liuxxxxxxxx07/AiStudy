import { isSupabaseConfigured } from "./supabase";

interface CreditData {
  balance: number;
  lastResetMonth: string;
  tier: "free" | "plus" | "pro" | "pro+";
}

const MONTHLY_LIMITS: Record<string, number> = {
  free: 5,
  plus: 200,
  pro: 2000,
  "pro+": 10000,
};

function getStorageKey(userId: string): string {
  return `ai-study-credits-${userId}`;
}

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCreditData(userId: string): CreditData {
  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) {
    return { balance: 5, lastResetMonth: getMonthKey(), tier: "free" };
  }
  return JSON.parse(raw) as CreditData;
}

function saveCreditData(userId: string, data: CreditData): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
  syncCreditsToSupabase(userId, data);
}

function syncCreditsToSupabase(userId: string, data: CreditData): void {
  if (!isSupabaseConfigured()) return;
  import("./supabase-db").then(({ saveCredits }) => {
    saveCredits(userId, data);
  }).catch(() => {});
}

function setTier(userId: string, tier: "free" | "plus" | "pro" | "pro+"): void {
  const data = getCreditData(userId);
  data.tier = tier;
  const limit = MONTHLY_LIMITS[tier];
  if (limit !== undefined) {
    data.balance = limit;
  }
  data.lastResetMonth = getMonthKey();
  saveCreditData(userId, data);
}

function clearTier(userId: string): void {
  setTier(userId, "free");
}

function getAvailableCredits(userId: string): number {
  const data = getCreditData(userId);
  const currentMonth = getMonthKey();
  if (data.lastResetMonth !== currentMonth) {
    const limit = MONTHLY_LIMITS[data.tier];
    data.balance = limit !== undefined ? limit : 5;
    data.lastResetMonth = currentMonth;
    saveCreditData(userId, data);
  }
  return data.balance;
}

function deductCredits(userId: string, amount: number): boolean {
  const data = getCreditData(userId);
  if (data.balance < amount) {
    return false;
  }
  data.balance -= amount;
  saveCreditData(userId, data);
  return true;
}

function hasEnoughCredits(userId: string, amount: number): boolean {
  return getCreditData(userId).balance >= amount;
}

export { getCreditData, saveCreditData, getAvailableCredits, deductCredits, hasEnoughCredits, setTier, clearTier, MONTHLY_LIMITS };
export type { CreditData };