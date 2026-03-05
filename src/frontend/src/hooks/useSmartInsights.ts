import type { Category, CategoryTotal } from "../backend.d";

export interface PatternAlert {
  categoryName: string;
  icon: string;
  currentAmount: number;
  avgAmount: number;
  percentHigher: number;
  severity: "high" | "medium";
}

export interface SavingSuggestion {
  title: string;
  description: string;
  estimatedSaving: number;
  type: "reduce" | "alternative";
}

export interface EndOfMonthForecast {
  projectedTotal: number;
  totalBudget: number | null;
  projectedBalance: number | null;
  daysRemaining: number;
  isOverBudget: boolean;
  confidence: "low" | "medium" | "high";
}

// Food delivery merchants to flag for saving suggestions
const FOOD_DELIVERY_KEYWORDS = [
  "swiggy",
  "zomato",
  "blinkit",
  "zepto",
  "dunzo",
  "food",
  "dining",
  "grocer",
];
const SUBSCRIPTION_KEYWORDS = [
  "netflix",
  "spotify",
  "amazon prime",
  "hotstar",
  "zee5",
  "subscription",
  "ott",
];

export function detectPatterns(
  currentTotals: CategoryTotal[],
  historicalMonths: Array<{
    month: number;
    year: number;
    totals: CategoryTotal[];
  }>,
  categories: Category[],
): PatternAlert[] {
  if (historicalMonths.length === 0) return [];
  const alerts: PatternAlert[] = [];

  for (const current of currentTotals) {
    if (current.total <= 0) continue;
    const historical = historicalMonths
      .map(
        (hm) =>
          hm.totals.find((t) => t.categoryId === current.categoryId)?.total ??
          0,
      )
      .filter((v) => v > 0);
    if (historical.length === 0) continue;
    const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
    if (avg === 0) continue;
    const pctHigher = ((current.total - avg) / avg) * 100;
    if (pctHigher >= 20) {
      const cat = categories.find((c) => c.id === current.categoryId);
      alerts.push({
        categoryName: current.categoryName,
        icon: cat?.icon ?? "📊",
        currentAmount: current.total,
        avgAmount: avg,
        percentHigher: pctHigher,
        severity: pctHigher >= 40 ? "high" : "medium",
      });
    }
  }

  return alerts.sort((a, b) => b.percentHigher - a.percentHigher).slice(0, 5);
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function generateSavingSuggestions(
  currentTotals: CategoryTotal[],
  historicalMonths: Array<{
    month: number;
    year: number;
    totals: CategoryTotal[];
  }>,
  categories: Category[],
): SavingSuggestion[] {
  const suggestions: SavingSuggestion[] = [];

  for (const current of currentTotals) {
    if (current.total <= 0) continue;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _cat = categories.find((c) => c.id === current.categoryId);
    const nameL = current.categoryName.toLowerCase();
    const isFoodDelivery = FOOD_DELIVERY_KEYWORDS.some((kw) =>
      nameL.includes(kw),
    );
    const isSubscription = SUBSCRIPTION_KEYWORDS.some((kw) =>
      nameL.includes(kw),
    );

    if (isFoodDelivery && current.total > 500) {
      const saving = Math.round(current.total * 0.2);
      suggestions.push({
        title: `Reduce ${current.categoryName} spending by 20%`,
        description: `You spent ${formatAmount(current.total)} this month on ${current.categoryName}. Cutting back by 20% could save you ${formatAmount(saving)} monthly.`,
        estimatedSaving: saving,
        type: "reduce",
      });
    }

    if (isSubscription && current.total > 300) {
      suggestions.push({
        title: `Review ${current.categoryName} subscriptions`,
        description: `You're spending ${formatAmount(current.total)} on subscriptions. Consider consolidating or switching to family plans to save up to 40%.`,
        estimatedSaving: Math.round(current.total * 0.4),
        type: "alternative",
      });
    }
  }

  // Generic tip if total is significantly higher than historical
  if (historicalMonths.length >= 2) {
    const currentTotal = currentTotals.reduce((s, t) => s + t.total, 0);
    const avgHistorical =
      historicalMonths
        .map((hm) => hm.totals.reduce((s, t) => s + t.total, 0))
        .reduce((a, b) => a + b, 0) / historicalMonths.length;
    if (avgHistorical > 0 && currentTotal > avgHistorical * 1.15) {
      const excess = Math.round(currentTotal - avgHistorical);
      if (!suggestions.some((s) => s.type === "reduce")) {
        suggestions.push({
          title: "Track discretionary spending",
          description: `Your total spend is ${formatAmount(excess)} above your monthly average. Review one-time purchases to stay on track.`,
          estimatedSaving: excess,
          type: "reduce",
        });
      }
    }
  }

  return suggestions.slice(0, 4);
}

export function computeEndOfMonthForecast(
  currentTotal: number,
  currentTotals: CategoryTotal[],
  month: number,
  year: number,
): EndOfMonthForecast {
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() + 1 === month && today.getFullYear() === year;
  const dayOfMonth = isCurrentMonth
    ? today.getDate()
    : new Date(year, month, 0).getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysRemaining = isCurrentMonth ? daysInMonth - dayOfMonth : 0;

  // Total budget = sum of all category budget limits
  const budgetCats = currentTotals.filter(
    (t) => t.budgetLimit && t.budgetLimit > 0,
  );
  const totalBudget =
    budgetCats.length > 0
      ? budgetCats.reduce((s, t) => s + (t.budgetLimit ?? 0), 0)
      : null;

  // Project spend for full month
  let projectedTotal = currentTotal;
  if (isCurrentMonth && dayOfMonth > 0) {
    const dailyRate = currentTotal / dayOfMonth;
    projectedTotal = Math.round(dailyRate * daysInMonth);
  }

  const projectedBalance =
    totalBudget !== null ? totalBudget - projectedTotal : null;
  const isOverBudget = projectedBalance !== null ? projectedBalance < 0 : false;
  const confidence: "low" | "medium" | "high" =
    dayOfMonth <= 7 ? "low" : dayOfMonth <= 20 ? "medium" : "high";

  return {
    projectedTotal,
    totalBudget,
    projectedBalance,
    daysRemaining,
    isOverBudget,
    confidence,
  };
}
