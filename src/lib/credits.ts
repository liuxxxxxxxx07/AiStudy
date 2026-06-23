interface CreditData {
  balance: number;
  lastRefill: number;
  tier: "free" | "plus" | "pro" | "pro+";
}

const TIER_LIMITS: Record<string, { dailyLimit: number }> = {
  free: { dailyLimit: 50 },
  plus: { dailyLimit: 200 },
  pro: { dailyLimit: 500 },
  "pro+": { dailyLimit: 9999 },
};

function getStorageKey(userId: string): string {
  return `ai-study-credits-${userId}`;
}

function getCreditData(userId: string): CreditData {
  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) {
    return { balance: 50, lastRefill: Date.now(), tier: "free" };
  }
  return JSON.parse(raw) as CreditData;
}

function saveCreditData(userId: string, data: CreditData): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
}

function setTier(userId: string, tier: "free" | "plus" | "pro" | "pro+"): void {
  const data = getCreditData(userId);
  data.tier = tier;
  const limits = TIER_LIMITS[tier];
  if (limits) {
    data.balance = limits.dailyLimit;
  }
  data.lastRefill = Date.now();
  saveCreditData(userId, data);
}

function clearTier(userId: string): void {
  setTier(userId, "free");
}

function getAvailableCredits(userId: string): number {
  const data = getCreditData(userId);
  const now = Date.now();
  if (now - data.lastRefill > 3 * 60 * 60 * 1000) {
    data.balance = data.tier === "free" ? 50 : data.tier === "plus" ? 200 : data.tier === "pro" ? 500 : 9999;
    data.lastRefill = now;
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

function getTierBonus(tier: string): { refillAmount: number; refillInterval: number } {
  switch (tier) {
    case "plus":
      return { refillAmount: 200, refillInterval: 2 * 60 * 60 * 1000 };
    case "pro":
      return { refillAmount: 500, refillInterval: 60 * 60 * 1000 };
    case "pro+":
      return { refillAmount: 9999, refillInterval: 30 * 60 * 1000 };
    default:
      return { refillAmount: 50, refillInterval: 3 * 60 * 60 * 1000 };
  }
}

export { getCreditData, saveCreditData, getAvailableCredits, deductCredits, hasEnoughCredits, getTierBonus, setTier, clearTier, TIER_LIMITS };
export type { CreditData };