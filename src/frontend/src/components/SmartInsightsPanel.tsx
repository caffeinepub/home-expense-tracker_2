import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, type Variants, motion } from "motion/react";
import {
  useCategories,
  useCategoryTotals,
  useMonthlyTotal,
  useMultiMonthCategoryTotals,
} from "../hooks/useQueries";
import {
  computeEndOfMonthForecast,
  detectPatterns,
  generateSavingSuggestions,
} from "../hooks/useSmartInsights";

interface SmartInsightsPanelProps {
  month: number;
  year: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function SectionHeader({
  icon: Icon,
  title,
  badge,
  badgeVariant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string | number;
  badgeVariant?: "default" | "amber" | "green" | "cyan";
}) {
  const badgeClasses = {
    default: "bg-muted/40 text-muted-foreground border-border/40",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    green: "bg-green-500/15 text-green-400 border-green-500/30",
    cyan: "bg-primary/15 text-primary border-primary/30",
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest font-mono">
        {title}
      </h4>
      {badge !== undefined && (
        <Badge
          className={cn("ml-auto text-xs border", badgeClasses[badgeVariant])}
        >
          {badge}
        </Badge>
      )}
    </div>
  );
}

function EmptyInsightState({ message }: { message: string }) {
  return (
    <div className="py-5 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export default function SmartInsightsPanel({
  month,
  year,
}: SmartInsightsPanelProps) {
  const { data: categoryTotals = [] } = useCategoryTotals(month, year);
  const { data: categories = [] } = useCategories();
  const { data: monthlyTotal = 0 } = useMonthlyTotal(month, year);
  const { data: historicalMonths = [], isLoading: histLoading } =
    useMultiMonthCategoryTotals(month, year, 3);

  const patterns = detectPatterns(categoryTotals, historicalMonths, categories);
  const suggestions = generateSavingSuggestions(
    categoryTotals,
    historicalMonths,
    categories,
  );
  const forecast = computeEndOfMonthForecast(
    monthlyTotal,
    categoryTotals,
    month,
    year,
  );

  const hasEnoughHistory = historicalMonths.length >= 1;

  return (
    <motion.section
      data-ocid="smart_insights.panel"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Panel Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-3 pt-2"
      >
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Brain className="h-5 w-5 text-primary glow-text-cyan" />
        </div>
        <div>
          <h2 className="text-base font-display font-bold text-gradient-cyan flex items-center gap-2">
            Smart Insights
            <Sparkles className="h-4 w-4 text-primary opacity-70" />
          </h2>
          <p className="text-xs text-muted-foreground">
            AI-powered analysis of your spending patterns
          </p>
        </div>
      </motion.div>

      {/* Three-panel grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Pattern Detection ── */}
        <motion.div
          data-ocid="smart_insights.patterns.section"
          variants={itemVariants}
          className="glass rounded-xl p-5"
        >
          <SectionHeader
            icon={AlertTriangle}
            title="Pattern Alerts"
            badge={
              hasEnoughHistory && patterns.length > 0
                ? patterns.length
                : undefined
            }
            badgeVariant="amber"
          />

          {histLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted/20 animate-pulse"
                />
              ))}
            </div>
          ) : !hasEnoughHistory ? (
            <EmptyInsightState message="Add expenses across 2+ months to detect unusual spending patterns." />
          ) : patterns.length === 0 ? (
            <div className="py-5 flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-7 w-7 text-green-400 opacity-80" />
              <p className="text-xs text-muted-foreground">
                No unusual spending detected this month
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2.5">
                {patterns.map((alert, i) => (
                  <motion.div
                    key={alert.categoryName}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "rounded-lg p-3 border",
                      alert.severity === "high"
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-amber-500/10 border-amber-500/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{alert.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {alert.categoryName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            avg {formatCurrency(alert.avgAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={cn(
                            "flex items-center gap-0.5 font-mono text-sm font-bold",
                            alert.severity === "high"
                              ? "text-red-400"
                              : "text-amber-400",
                          )}
                        >
                          <TrendingUp className="h-3.5 w-3.5" />+
                          {alert.percentHigher.toFixed(0)}%
                        </div>
                        <p className="text-xs font-mono text-foreground">
                          {formatCurrency(alert.currentAmount)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Your {alert.categoryName.toLowerCase()} bill is{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          alert.severity === "high"
                            ? "text-red-400"
                            : "text-amber-400",
                        )}
                      >
                        {alert.percentHigher.toFixed(0)}% higher
                      </span>{" "}
                      than usual.
                    </p>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* ── Smart Saving Suggestions ── */}
        <motion.div
          data-ocid="smart_insights.savings.section"
          variants={itemVariants}
          className="glass rounded-xl p-5"
        >
          <SectionHeader
            icon={Lightbulb}
            title="Saving Suggestions"
            badge={suggestions.length > 0 ? suggestions.length : undefined}
            badgeVariant="green"
          />

          {histLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted/20 animate-pulse"
                />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-5 flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-7 w-7 text-green-400 opacity-80" />
              <p className="text-xs text-muted-foreground">
                Your spending looks optimized. Great job!
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2.5">
                {suggestions.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-lg p-3 bg-green-500/10 border border-green-500/20"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {s.title}
                      </p>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <TrendingDown className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-xs font-mono font-bold text-green-400">
                          Save {formatCurrency(s.estimatedSaving)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* ── End-of-Month Forecast ── */}
        <motion.div
          data-ocid="smart_insights.forecast.section"
          variants={itemVariants}
          className="glass rounded-xl p-5"
        >
          <SectionHeader
            icon={CalendarClock}
            title="End-of-Month Forecast"
            badgeVariant="cyan"
          />

          {categoryTotals.length === 0 ? (
            <EmptyInsightState message="Add expenses this month to generate a spending forecast." />
          ) : (
            <div className="space-y-3">
              {/* Projected total spend */}
              <div className="rounded-lg p-3 bg-primary/8 border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-1">
                  Projected Spend
                </p>
                <p className="text-2xl font-display font-bold text-primary glow-text-cyan">
                  {formatCurrency(forecast.projectedTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {forecast.daysRemaining > 0
                    ? `${forecast.daysRemaining} days remaining`
                    : "Month complete"}
                </p>
              </div>

              {/* Projected balance (only if budgets are set) */}
              {forecast.projectedBalance !== null ? (
                <div
                  className={cn(
                    "rounded-lg p-3 border",
                    forecast.isOverBudget
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-green-500/10 border-green-500/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-1">
                        Projected Balance
                      </p>
                      <p
                        className={cn(
                          "text-xl font-display font-bold",
                          forecast.isOverBudget
                            ? "text-red-400"
                            : "text-green-400",
                        )}
                      >
                        {forecast.isOverBudget ? "−" : "+"}
                        {formatCurrency(Math.abs(forecast.projectedBalance))}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        forecast.isOverBudget
                          ? "bg-red-500/15"
                          : "bg-green-500/15",
                      )}
                    >
                      {forecast.isOverBudget ? (
                        <AlertTriangle className={cn("h-5 w-5 text-red-400")} />
                      ) : (
                        <Target className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {forecast.isOverBudget
                      ? `You may exceed your total budget of ${formatCurrency(forecast.totalBudget ?? 0)}`
                      : `Staying within your total budget of ${formatCurrency(forecast.totalBudget ?? 0)}`}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg p-3 bg-muted/15 border border-border/30">
                  <p className="text-xs text-muted-foreground">
                    Set budget limits on categories to see your projected
                    balance.
                  </p>
                </div>
              )}

              {/* Confidence badge */}
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Forecast confidence:
                </p>
                <Badge
                  className={cn(
                    "text-xs border",
                    forecast.confidence === "high"
                      ? "bg-green-500/15 text-green-400 border-green-500/30"
                      : forecast.confidence === "medium"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-muted/40 text-muted-foreground border-border/40",
                  )}
                >
                  {forecast.confidence}
                </Badge>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
