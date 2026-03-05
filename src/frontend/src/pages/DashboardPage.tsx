import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Hash,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MonthSelector from "../components/MonthSelector";
import SmartInsightsPanel from "../components/SmartInsightsPanel";
import {
  useBudgetAlerts,
  useCategoryTotals,
  useExpensesByMonth,
  useMonthlyTotal,
  useMonthlyTrend,
  useRecurringExpenses,
  useTopSpendingCategories,
} from "../hooks/useQueries";

const MONTHS = [
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
const NEON_COLORS = [
  "oklch(0.72 0.22 195)", // cyan
  "oklch(0.62 0.20 290)", // violet
  "oklch(0.75 0.18 155)", // green
  "oklch(0.70 0.20 50)", // amber
  "oklch(0.65 0.22 25)", // coral
  "oklch(0.68 0.18 260)", // indigo
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  isLoading?: boolean;
  accentClass?: string;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendValue,
  isLoading,
  accentClass = "text-primary",
}: KpiCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="glass rounded-xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "p-2 rounded-lg bg-primary/10",
            accentClass.replace("text-", "bg-").concat("/10"),
          )}
        >
          <Icon className={cn("h-5 w-5", accentClass)} />
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              trend === "up"
                ? "bg-red-500/10 text-red-400"
                : trend === "down"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-muted/40 text-muted-foreground",
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-1">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-8 w-32 bg-muted/40" />
        ) : (
          <p className="text-2xl font-display font-bold text-foreground">
            {value}
          </p>
        )}
        {sub && !isLoading && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({
  active,
  payload,
}: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-sm border border-border/50">
        <p className="font-medium text-foreground">{payload[0].name}</p>
        <p className="text-primary font-mono">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({
  active,
  payload,
  label,
}: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-sm border border-border/50">
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <p className="text-primary font-mono font-medium">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const { data: total, isLoading: totalLoading } = useMonthlyTotal(month, year);
  const { data: prevTotal } = useMonthlyTotal(prevMonth, prevYear);
  const { data: categoryTotals = [], isLoading: catLoading } =
    useCategoryTotals(month, year);
  const { data: topCategories = [], isLoading: topLoading } =
    useTopSpendingCategories(month, year);
  const { data: budgetAlerts = [] } = useBudgetAlerts(month, year);
  const { data: recurringExpenses = [] } = useRecurringExpenses();
  const { data: expenses = [] } = useExpensesByMonth(month, year);
  const { data: trendData = [], isLoading: trendLoading } = useMonthlyTrend(
    month,
    year,
  );

  const totalAmount = total ?? 0;
  const prevAmount = prevTotal ?? 0;
  const trendPct =
    prevAmount > 0 ? ((totalAmount - prevAmount) / prevAmount) * 100 : 0;
  const trendDir = trendPct > 0 ? "up" : trendPct < 0 ? "down" : "neutral";

  const topCat = topCategories[0];
  const recurringTotal = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  const donutData = categoryTotals
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.categoryName,
      value: c.total,
    }));

  const barData = trendData.map((t) => ({
    name: t.label.split(" ")[0],
    total: t.total,
  }));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-cyan">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {MONTHS[month - 1]} {year} overview
          </p>
        </div>
        <MonthSelector
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Wallet}
          label="Total Spend"
          value={formatCurrency(totalAmount)}
          trend={trendDir}
          trendValue={
            prevAmount > 0 ? `${Math.abs(trendPct).toFixed(1)}%` : undefined
          }
          isLoading={totalLoading}
          accentClass="text-neon-cyan"
        />
        <KpiCard
          icon={Hash}
          label="Expenses"
          value={String(expenses.length)}
          sub={`${expenses.filter((e) => e.isRecurring).length} recurring`}
          isLoading={false}
          accentClass="text-accent"
        />
        <KpiCard
          icon={Trophy}
          label="Top Category"
          value={topCat?.categoryName ?? "—"}
          sub={topCat ? formatCurrency(topCat.total) : undefined}
          isLoading={topLoading}
          accentClass="text-neon-amber"
        />
        <KpiCard
          icon={RefreshCcw}
          label="Recurring"
          value={formatCurrency(recurringTotal)}
          sub={`${recurringExpenses.length} items`}
          isLoading={false}
          accentClass="text-neon-green"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <motion.div variants={itemVariants} className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              Spending by Category
            </h3>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          {catLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="h-48 w-48 rounded-full bg-muted/30" />
            </div>
          ) : donutData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No expenses this month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={NEON_COLORS[index % NEON_COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "oklch(0.55 0.04 250)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Trend Bar Chart */}
        <motion.div variants={itemVariants} className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              6-Month Trend
            </h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          {trendLoading ? (
            <div className="h-64 space-y-2 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 bg-muted/30" />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={barData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.04 250 / 0.3)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "oklch(0.55 0.04 250)", fontSize: 11 }}
                  axisLine={{ stroke: "oklch(0.28 0.04 250 / 0.5)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.55 0.04 250)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip content={<BarTooltip />} />
                <Bar
                  dataKey="total"
                  fill="oklch(0.72 0.22 195)"
                  radius={[4, 4, 0, 0]}
                  name="Total"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Bottom row: Budget Alerts + Top Categories */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Budget Alerts */}
        <motion.div variants={itemVariants} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-neon-amber" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              Budget Alerts
            </h3>
            {budgetAlerts.length > 0 && (
              <Badge className="ml-auto text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                {budgetAlerts.length} Alert{budgetAlerts.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {budgetAlerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              All categories within budget
            </div>
          ) : (
            <div className="space-y-3">
              {budgetAlerts.map((alert) => {
                const pct = alert.budgetLimit
                  ? (alert.total / alert.budgetLimit) * 100
                  : 100;
                const isOver = pct >= 100;
                return (
                  <div
                    key={alert.categoryId.toString()}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {alert.categoryName}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          isOver ? "text-red-400" : "text-amber-400",
                        )}
                      >
                        {formatCurrency(alert.total)} /{" "}
                        {alert.budgetLimit
                          ? formatCurrency(alert.budgetLimit)
                          : "∞"}
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          isOver ? "bg-red-500" : "bg-amber-500",
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isOver
                        ? `${(pct - 100).toFixed(0)}% over budget`
                        : `${pct.toFixed(0)}% used`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Top Spending Categories */}
        <motion.div variants={itemVariants} className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-neon-amber" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              Top Categories
            </h3>
          </div>
          {topCategories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No expense data for this month
            </div>
          ) : (
            <div className="space-y-3">
              {topCategories.slice(0, 5).map((cat, index) => {
                const pct =
                  totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
                return (
                  <div
                    key={cat.categoryId.toString()}
                    className="flex items-center gap-3"
                  >
                    <span className="font-mono text-xs text-muted-foreground w-5 shrink-0">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {cat.categoryName}
                        </span>
                        <span className="text-xs font-mono text-primary ml-2 shrink-0">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                      <div className="relative h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                          className="h-full rounded-full"
                          style={{
                            background: NEON_COLORS[index % NEON_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right font-mono shrink-0">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Smart Insights Panel */}
      <SmartInsightsPanel month={month} year={year} />
    </motion.div>
  );
}
