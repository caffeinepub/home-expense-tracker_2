import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Category,
  CategoryTotal,
  Expense,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── User Profile ────────────────────────────────────────────────
export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useInitialize() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.initialize();
    },
  });
}

// ─── Categories ──────────────────────────────────────────────────
export function useCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      icon,
      budgetLimit,
    }: { name: string; icon: string; budgetLimit: number | null }) => {
      if (!actor) throw new Error("No actor");
      return actor.addCategory(name, icon, budgetLimit);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      icon,
      budgetLimit,
    }: {
      id: bigint;
      name: string;
      icon: string;
      budgetLimit: number | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCategory(id, name, icon, budgetLimit);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCategory(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// ─── Expenses ────────────────────────────────────────────────────
export function useExpensesByMonth(month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses", month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpensesByMonth(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMonthlyTotal(month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["monthlyTotal", month, year],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getMonthlyTotal(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCategoryTotals(month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<CategoryTotal[]>({
    queryKey: ["categoryTotals", month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategoryTotals(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTopSpendingCategories(month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<CategoryTotal[]>({
    queryKey: ["topCategories", month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopSpendingCategories(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBudgetAlerts(month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<CategoryTotal[]>({
    queryKey: ["budgetAlerts", month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBudgetAlerts(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecurringExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ["recurringExpenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecurringExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      amount,
      categoryId,
      month,
      year,
      notes,
      isRecurring,
    }: {
      title: string;
      amount: number;
      categoryId: bigint;
      month: number;
      year: number;
      notes: string;
      isRecurring: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addExpense(
        title,
        amount,
        categoryId,
        BigInt(month),
        BigInt(year),
        notes,
        isRecurring,
      );
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({
        queryKey: ["expenses", vars.month, vars.year],
      });
      void qc.invalidateQueries({ queryKey: ["monthlyTotal"] });
      void qc.invalidateQueries({ queryKey: ["categoryTotals"] });
      void qc.invalidateQueries({ queryKey: ["topCategories"] });
      void qc.invalidateQueries({ queryKey: ["budgetAlerts"] });
      void qc.invalidateQueries({ queryKey: ["recurringExpenses"] });
    },
  });
}

export function useUpdateExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      amount,
      categoryId,
      month,
      year,
      notes,
      isRecurring,
    }: {
      id: bigint;
      title: string;
      amount: number;
      categoryId: bigint;
      month: number;
      year: number;
      notes: string;
      isRecurring: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateExpense(
        id,
        title,
        amount,
        categoryId,
        BigInt(month),
        BigInt(year),
        notes,
        isRecurring,
      );
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({
        queryKey: ["expenses", vars.month, vars.year],
      });
      void qc.invalidateQueries({ queryKey: ["monthlyTotal"] });
      void qc.invalidateQueries({ queryKey: ["categoryTotals"] });
      void qc.invalidateQueries({ queryKey: ["topCategories"] });
      void qc.invalidateQueries({ queryKey: ["budgetAlerts"] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: bigint; month: number; year: number }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteExpense(id);
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({
        queryKey: ["expenses", vars.month, vars.year],
      });
      void qc.invalidateQueries({ queryKey: ["monthlyTotal"] });
      void qc.invalidateQueries({ queryKey: ["categoryTotals"] });
      void qc.invalidateQueries({ queryKey: ["topCategories"] });
      void qc.invalidateQueries({ queryKey: ["budgetAlerts"] });
    },
  });
}

// ─── Multi-month category totals (for smart insights) ────────────
export function useMultiMonthCategoryTotals(
  currentMonth: number,
  currentYear: number,
  numPriorMonths = 3,
) {
  const { actor, isFetching } = useActor();
  return useQuery<
    Array<{ month: number; year: number; totals: CategoryTotal[] }>
  >({
    queryKey: [
      "multiMonthCategoryTotals",
      currentMonth,
      currentYear,
      numPriorMonths,
    ],
    queryFn: async () => {
      if (!actor) return [];
      const months: { month: number; year: number }[] = [];
      for (let i = numPriorMonths; i >= 1; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        while (m <= 0) {
          m += 12;
          y -= 1;
        }
        months.push({ month: m, year: y });
      }
      const results = await Promise.all(
        months.map(({ month, year }) =>
          actor.getCategoryTotals(BigInt(month), BigInt(year)),
        ),
      );
      return months.map((m, i) => ({ ...m, totals: results[i] }));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Multi-month totals (for trend chart) ────────────────────────
export function useMonthlyTrend(currentMonth: number, currentYear: number) {
  const { actor, isFetching } = useActor();
  return useQuery<
    { month: number; year: number; label: string; total: number }[]
  >({
    queryKey: ["monthlyTrend", currentMonth, currentYear],
    queryFn: async () => {
      if (!actor) return [];
      const months: { month: number; year: number; label: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        while (m <= 0) {
          m += 12;
          y -= 1;
        }
        const labels = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        months.push({ month: m, year: y, label: `${labels[m - 1]} ${y}` });
      }
      const totals = await Promise.all(
        months.map(({ month, year }) =>
          actor.getMonthlyTotal(BigInt(month), BigInt(year)),
        ),
      );
      return months.map((m, i) => ({ ...m, total: totals[i] }));
    },
    enabled: !!actor && !isFetching,
  });
}
