import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileDown,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Receipt,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Category, Expense } from "../backend.d";
import AppleCalendarPicker from "../components/AppleCalendarPicker";
import MonthSelector from "../components/MonthSelector";
import {
  useAddCategory,
  useAddExpense,
  useCategories,
  useDeleteExpense,
  useExpensesByMonth,
  useMonthlyTotal,
  useRecurringExpenses,
  useUpdateExpense,
} from "../hooks/useQueries";

const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(nanos: bigint) {
  const ms = Number(nanos / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

interface ExpenseFormData {
  title: string;
  amount: string;
  categoryId: string;
  notes: string;
  isRecurring: boolean;
  date: Date;
}

function getEmptyForm(): ExpenseFormData {
  return {
    title: "",
    amount: "",
    categoryId: "",
    notes: "",
    isRecurring: false,
    date: new Date(),
  };
}

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  editExpense?: Expense;
  expenses: Expense[];
  selectedMonth: number;
  selectedYear: number;
}

function ExpenseModal({
  open,
  onClose,
  categories,
  editExpense,
  expenses,
  selectedMonth,
  selectedYear,
}: ExpenseModalProps) {
  const defaultDate = new Date(selectedYear, selectedMonth - 1, 1);
  const [form, setForm] = useState<ExpenseFormData>(
    editExpense
      ? {
          title: editExpense.title,
          amount: String(editExpense.amount),
          categoryId: editExpense.categoryId.toString(),
          notes: editExpense.notes,
          isRecurring: editExpense.isRecurring,
          date:
            editExpense.createdAt > BigInt(0)
              ? new Date(Number(editExpense.createdAt / BigInt(1_000_000)))
              : defaultDate,
        }
      : { ...getEmptyForm(), date: defaultDate },
  );

  // Reset form with the correct month's date whenever the modal opens
  useEffect(() => {
    if (open) {
      const d = new Date(selectedYear, selectedMonth - 1, 1);
      if (!editExpense) {
        setForm({ ...getEmptyForm(), date: d });
      }
    }
  }, [open, selectedMonth, selectedYear, editExpense]);

  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();
  const isPending = addExpense.isPending || updateExpense.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || !form.categoryId) {
      toast.error("Please fill all required fields");
      return;
    }
    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const month = form.date.getMonth() + 1;
    const year = form.date.getFullYear();

    if (editExpense) {
      updateExpense.mutate(
        {
          id: editExpense.id,
          title: form.title.trim(),
          amount,
          categoryId: BigInt(form.categoryId),
          month,
          year,
          notes: form.notes,
          isRecurring: form.isRecurring,
        },
        {
          onSuccess: () => {
            toast.success("Expense updated");
            onClose();
          },
          onError: () => toast.error("Failed to update expense"),
        },
      );
    } else {
      addExpense.mutate(
        {
          title: form.title.trim(),
          amount,
          categoryId: BigInt(form.categoryId),
          month,
          year,
          notes: form.notes,
          isRecurring: form.isRecurring,
        },
        {
          onSuccess: () => {
            toast.success("Expense added");
            onClose();
            setForm(getEmptyForm());
          },
          onError: () => toast.error("Failed to add expense"),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gradient-cyan font-display">
            {editExpense ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Title *
            </Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="e.g. Electricity Bill"
              className="mt-1 bg-input border-border focus:ring-primary"
              autoFocus
            />
          </div>

          {/* ── Apple Calendar Date Picker ── */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Date
            </Label>
            <AppleCalendarPicker
              value={form.date}
              onChange={(date) => setForm((p) => ({ ...p, date }))}
              expenses={expenses}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Amount (₹) *
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="0.00"
                className="mt-1 bg-input border-border focus:ring-primary"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Category *
              </Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
              >
                <SelectTrigger className="mt-1 bg-input border-border focus:ring-primary">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="glass border-border/50">
                  {categories.map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Notes
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Optional notes..."
              className="mt-1 bg-input border-border focus:ring-primary resize-none"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-foreground">
                Recurring Expense
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-suggest this next month
              </p>
            </div>
            <Switch
              checked={form.isRecurring}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, isRecurring: v }))
              }
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border hover:bg-secondary/40"
              data-ocid="expense.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 hover:shadow-glow-cyan transition-all"
              data-ocid="expense.submit_button"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editExpense ? "Update" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── AI Sense: SMS Parser ───────────────────────────────────────────────────

interface ParsedSMS {
  amount: number;
  title: string;
  /** null means no known category matched — caller should create one */
  categoryId: bigint | null;
  /** cleaned merchant name extracted from the SMS */
  merchantName: string;
  notes: string;
}

function parseBankSMS(sms: string, categories: Category[]): ParsedSMS | null {
  if (!sms || !sms.trim()) return null;

  const text = sms.trim();

  // 1. Extract amount — comprehensive patterns for Indian bank SMS
  let amount = Number.NaN;
  const amountPatterns = [
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/i,
    /(?:debit(?:ed)?(?:\s+(?:of|by|for))?|paid|sent|transfer(?:red)?)\s+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /amount\s+(?:of\s+)?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = (match[match.length - 1] ?? match[1] ?? "").replace(
        /,/g,
        "",
      );
      const parsed = Number.parseFloat(numStr);
      if (!Number.isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }
  if (Number.isNaN(amount) || amount <= 0) return null;

  // 2. Extract merchant using ordered strategies
  const blocklist = new Set([
    "your",
    "our",
    "the",
    "his",
    "her",
    "their",
    "this",
    "that",
    "upi",
    "neft",
    "imps",
    "rtgs",
    "bank",
    "account",
    "ac",
    "acno",
    "ref",
    "id",
    "no",
    "number",
    "linked",
    "mobile",
    "card",
    "atm",
    "not",
    "you",
    "please",
    "call",
    "helpline",
    "report",
    "fraud",
    "visit",
    "click",
    "http",
    "https",
    "www",
  ]);

  let merchantRaw = "";

  // Strategy A: UPI VPA — "to <vpa>@<bank>"
  const upiToMatch = text.match(
    /\bto\s+([A-Za-z][A-Za-z0-9._-]{0,40}@[A-Za-z0-9._-]+)/i,
  );
  if (upiToMatch) {
    let raw = upiToMatch[1].split("@")[0];
    raw = raw.replace(
      /\.(stores?|rzp|paytm|upi|ybl|okaxis|okhdfcbank|okicici|oksbi|ibl|axis|sbi|hdfcbank|axb|axisb?|hdfc|icici|kotak|idfcbank|airtel|jio|fbl|pingpay|abfspay|waicici|wahdfc|perf|collect|razorpay|gpay)$/i,
      "",
    );
    raw = raw.replace(/\d+$/, "");
    raw = raw.replace(/^[._-]+|[._-]+$/g, "");
    const brandMatch = raw.match(/^([A-Za-z]+)/);
    const candidate = (brandMatch ? brandMatch[1] : raw).toLowerCase();
    if (candidate && !blocklist.has(candidate) && candidate.length > 1) {
      merchantRaw = candidate;
    }
  }

  // Strategy B: "to <Name>" not a VPA
  if (!merchantRaw) {
    const toNameMatch = text.match(
      /\bto\s+([A-Z][A-Za-z0-9\s&'/-]{1,40}?)(?:\s+on\s|\s+dated|\s+for\s|\s+via\s|\s*[.,]|$)/i,
    );
    if (toNameMatch) {
      const candidate = toNameMatch[1].trim();
      const firstWord = candidate.split(/\s+/)[0].toLowerCase();
      if (
        !blocklist.has(firstWord) &&
        !/^\d/.test(candidate) &&
        candidate.length > 1 &&
        !candidate.toLowerCase().includes("@")
      ) {
        merchantRaw = candidate.toLowerCase();
      }
    }
  }

  // Strategy C: Card POS — "at <Merchant>"
  if (!merchantRaw) {
    const cardMatch = text.match(
      /\bat\s+([A-Z][A-Za-z0-9\s&'/-]{2,40}?)(?:\s+on\s|\s+dated|\s+Ref|\s*[.,]|$)/i,
    );
    if (cardMatch) {
      const candidate = cardMatch[1].trim();
      const firstWord = candidate.split(/\s+/)[0].toLowerCase();
      if (!blocklist.has(firstWord) && candidate.length > 1) {
        merchantRaw = candidate.toLowerCase();
      }
    }
  }

  // Strategy D: "for <description>"
  if (!merchantRaw) {
    const forMatch = text.match(
      /\bfor\s+([A-Za-z][A-Za-z0-9\s&'-]{2,40}?)(?:\s+on\s|\s*[.,]|$)/i,
    );
    if (forMatch) {
      const candidate = forMatch[1].trim();
      const firstWord = candidate.split(/\s+/)[0].toLowerCase();
      if (
        !blocklist.has(firstWord) &&
        candidate.length > 1 &&
        !candidate.toLowerCase().includes("@")
      ) {
        merchantRaw = candidate.toLowerCase();
      }
    }
  }

  // 3. Match merchant to category
  const lowerMerchant = merchantRaw.toLowerCase();
  const lowerSMS = text.toLowerCase();

  let matchedCategory: Category | undefined;

  const findCat = (keywords: string[]): Category | undefined =>
    categories.find((c) =>
      keywords.some(
        (kw) =>
          c.name.toLowerCase().includes(kw) ||
          c.icon.toLowerCase().includes(kw),
      ),
    );

  const merchantCategories: {
    merchants: string[];
    categoryKeywords: string[];
  }[] = [
    {
      merchants: [
        "swiggy",
        "zomato",
        "dominos",
        "mcdonald",
        "kfc",
        "pizza hut",
        "subway",
        "burger king",
      ],
      categoryKeywords: ["food", "grocer", "dining"],
    },
    {
      merchants: [
        "blinkit",
        "zepto",
        "bigbasket",
        "dunzo",
        "jiomart",
        "dmart",
        "grofer",
        "instamart",
        "nature basket",
      ],
      categoryKeywords: ["grocer", "food"],
    },
    {
      merchants: [
        "amazon",
        "flipkart",
        "myntra",
        "meesho",
        "snapdeal",
        "nykaa",
        "ajio",
        "tatacliq",
      ],
      categoryKeywords: ["shop", "general"],
    },
    {
      merchants: [
        "uber",
        "ola",
        "rapido",
        "redbus",
        "irctc",
        "makemytrip",
        "goibibo",
        "yatra",
        "cleartrip",
      ],
      categoryKeywords: ["transport", "travel"],
    },
    {
      merchants: [
        "bescom",
        "msedcl",
        "bses",
        "tpddl",
        "torrent",
        "tneb",
        "electricity",
        "power",
        "wbsedcl",
        "adani",
        "tata power",
        "cesc",
        "apepdcl",
        "discom",
      ],
      categoryKeywords: ["electric"],
    },
    {
      merchants: ["water", "bwssb", "jal", "nmmc water"],
      categoryKeywords: ["water"],
    },
    {
      merchants: ["maintenance", "society", "rwa", "housing"],
      categoryKeywords: ["maintenance"],
    },
    {
      merchants: [
        "netflix",
        "hotstar",
        "spotify",
        "prime",
        "youtube premium",
        "disney",
        "zee5",
        "sonyliv",
      ],
      categoryKeywords: ["subscript", "entertain", "general"],
    },
    {
      merchants: [
        "doctor",
        "hospital",
        "pharmacy",
        "medplus",
        "apollo",
        "1mg",
        "netmeds",
        "practo",
      ],
      categoryKeywords: ["health", "medical"],
    },
    {
      merchants: ["servant", "maid", "cook", "driver", "nanny", "helper"],
      categoryKeywords: ["servant", "salary", "staff"],
    },
    {
      merchants: [
        "reliance",
        "airtel",
        "jio",
        "vodafone",
        "vi ",
        "bsnl",
        "tata sky",
        "tataplay",
      ],
      categoryKeywords: [
        "mobile",
        "recharge",
        "broadband",
        "internet",
        "telecom",
      ],
    },
  ];

  for (const { merchants, categoryKeywords } of merchantCategories) {
    const matched = merchants.some(
      (m) => lowerMerchant.includes(m) || lowerSMS.includes(m),
    );
    if (matched) {
      matchedCategory = findCat(categoryKeywords);
      if (matchedCategory) break;
    }
  }

  // 4. Build title
  const cleanMerchant = merchantRaw
    ? merchantRaw.charAt(0).toUpperCase() + merchantRaw.slice(1)
    : "";
  const title = cleanMerchant || "UPI Payment";

  // 5. Notes = first 120 chars of SMS
  const notes = text.slice(0, 120);

  return {
    amount,
    title,
    categoryId: matchedCategory ? matchedCategory.id : null,
    merchantName: cleanMerchant,
    notes,
  };
}

// ── AI Sense Panel Component ───────────────────────────────────────────────

interface AISensePanelProps {
  categories: Category[];
  categoriesLoading: boolean;
  month: number;
  year: number;
}

function AISensePanel({
  categories,
  categoriesLoading,
  month,
  year,
}: AISensePanelProps) {
  const [smsText, setSmsText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const addExpense = useAddExpense();
  const addCategory = useAddCategory();

  const handleParse = async () => {
    const trimmed = smsText.trim();
    if (!trimmed) {
      toast.error("Please paste an SMS first");
      return;
    }

    const parsed = parseBankSMS(trimmed, categories);
    if (!parsed) {
      toast.error(
        "Could not read this SMS. Make sure it contains an amount (Rs./INR/₹) and is a standard bank debit/UPI message.",
        { duration: 5000 },
      );
      return;
    }

    setIsParsing(true);

    try {
      let categoryId = parsed.categoryId;
      let categoryName: string;

      if (categoryId !== null) {
        // Known category matched
        categoryName =
          categories.find((c) => c.id === categoryId)?.name ?? "Unknown";
      } else if (parsed.merchantName) {
        // No known category — create a new one for this merchant
        const newCatId = await addCategory.mutateAsync({
          name: parsed.merchantName,
          icon: "🏷️",
          budgetLimit: null,
        });
        categoryId = newCatId;
        categoryName = parsed.merchantName;
      } else {
        // No merchant name either — fall back to first category
        if (categories.length === 0) {
          toast.error("Could not parse SMS. Check format and try again.");
          setIsParsing(false);
          return;
        }
        categoryId = categories[0].id;
        categoryName = categories[0].name;
      }

      await addExpense.mutateAsync({
        title: parsed.title,
        amount: parsed.amount,
        categoryId,
        month,
        year,
        notes: parsed.notes,
        isRecurring: false,
      });

      const amountStr = parsed.amount.toLocaleString("en-IN");
      if (parsed.categoryId === null && parsed.merchantName) {
        toast.success(
          `New category '${categoryName}' created and ₹${amountStr} added`,
        );
      } else {
        toast.success(
          `Added ₹${amountStr} — ${parsed.title} under ${categoryName}`,
        );
      }
      setSmsText("");
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "border border-primary/30 bg-primary/5",
        "shadow-[0_0_24px_rgba(0,255,255,0.06)]",
      )}
    >
      {/* Animated glow border effect */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          background:
            "linear-gradient(135deg, oklch(var(--primary) / 0.12) 0%, transparent 60%, oklch(var(--accent) / 0.08) 100%)",
        }}
      />

      <div className="relative p-4 sm:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_12px_rgba(0,255,255,0.2)]">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary tracking-wide font-display">
              AI Sense
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste a bank SMS to instantly add an expense
            </p>
          </div>
        </div>

        {/* Input + Button row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Textarea
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            placeholder="Paste bank SMS here... e.g. Sent Rs.312.00 from Kotak Bank to swiggy..."
            className="flex-1 resize-none bg-input border-primary/20 focus:border-primary/50 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/50 min-h-[70px] sm:min-h-[unset] sm:h-10 sm:py-2"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleParse();
            }}
          />
          <Button
            onClick={() => void handleParse()}
            disabled={categoriesLoading || isParsing || !smsText.trim()}
            className="sm:self-start bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:shadow-[0_0_16px_rgba(0,255,255,0.25)] transition-all whitespace-nowrap"
          >
            {isParsing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {categoriesLoading
              ? "Loading..."
              : isParsing
                ? "Parsing..."
                : "Parse & Add"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/50">
          Tip: Works with Kotak, HDFC, SBI, ICICI &amp; most UPI SMS formats ·
          Press{" "}
          <kbd className="px-1 py-0.5 rounded text-[10px] bg-muted/40 border border-border/40 font-mono">
            Ctrl+Enter
          </kbd>{" "}
          to parse
        </p>
      </div>
    </motion.div>
  );
}

export default function ExpensesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<bigint | null>(null);

  const { data: expenses = [], isLoading } = useExpensesByMonth(month, year);
  const { data: total = 0 } = useMonthlyTotal(month, year);
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: recurringExpenses = [] } = useRecurringExpenses();
  const deleteExpense = useDeleteExpense();
  const addExpense = useAddExpense();
  const qc = useQueryClient();

  // Auto-add recurring expenses when a month has zero expenses
  const autoAddedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const key = `${month}-${year}`;
    if (
      !isLoading &&
      expenses.length === 0 &&
      recurringExpenses.length > 0 &&
      !autoAddedRef.current.has(key)
    ) {
      autoAddedRef.current.add(key);
      let addedCount = 0;
      const promises = recurringExpenses.map((rec) => {
        return addExpense
          .mutateAsync({
            title: rec.title,
            amount: rec.amount,
            categoryId: rec.categoryId,
            month,
            year,
            notes: rec.notes,
            isRecurring: true,
          })
          .then(() => {
            addedCount++;
          })
          .catch(() => {
            /* skip individual failures */
          });
      });
      void Promise.all(promises).then(() => {
        if (addedCount > 0) {
          const monthName = MONTHS_FULL[month - 1];
          toast.success(
            `${addedCount} recurring expense${addedCount > 1 ? "s" : ""} added for ${monthName}`,
          );
          void qc.invalidateQueries({ queryKey: ["expenses", month, year] });
        }
      });
    }
  }, [
    isLoading,
    expenses.length,
    recurringExpenses,
    month,
    year,
    addExpense,
    qc,
  ]);

  const getCategoryName = (id: bigint) =>
    categories.find((c) => c.id === id)?.name ?? "Unknown";
  const getCategoryIcon = (id: bigint) =>
    categories.find((c) => c.id === id)?.icon ?? "💰";

  const openAdd = () => {
    setEditingExpense(undefined);
    setModalOpen(true);
  };
  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleDelete = (id: bigint) => {
    deleteExpense.mutate(
      { id, month, year },
      {
        onSuccess: () => {
          toast.success("Expense deleted");
          setDeleteConfirm(null);
        },
        onError: () => toast.error("Failed to delete"),
      },
    );
  };

  const handleAddRecurring = async () => {
    if (recurringExpenses.length === 0) {
      toast.info("No recurring expenses found");
      return;
    }

    // Dedup: skip expenses already in current month with same title + categoryId
    const existing = new Set(
      expenses.map((e) => `${e.title.toLowerCase()}|${e.categoryId}`),
    );
    const toAdd = recurringExpenses.filter(
      (rec) => !existing.has(`${rec.title.toLowerCase()}|${rec.categoryId}`),
    );

    if (toAdd.length === 0) {
      toast.info("All recurring expenses already added this month");
      return;
    }

    let addedCount = 0;
    await Promise.all(
      toAdd.map((rec) =>
        addExpense
          .mutateAsync({
            title: rec.title,
            amount: rec.amount,
            categoryId: rec.categoryId,
            month,
            year,
            notes: rec.notes,
            isRecurring: true,
          })
          .then(() => {
            addedCount++;
          })
          .catch(() => {
            /* skip individual failures */
          }),
      ),
    );

    if (addedCount > 0) {
      toast.success(
        `${addedCount} recurring expense${addedCount > 1 ? "s" : ""} added`,
      );
      void qc.invalidateQueries({ queryKey: ["expenses", month, year] });
    }
  };

  const handleExportPDF = () => {
    const monthName = MONTHS_FULL[month - 1];

    // Build category breakdown
    const catMap = new Map<string, number>();
    for (const exp of expenses) {
      const name = getCategoryName(exp.categoryId);
      catMap.set(name, (catMap.get(name) ?? 0) + exp.amount);
    }
    const catRows = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>HomeBase — ${monthName} ${year} Expenses</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e1e3a; padding: 32px; font-size: 13px; }
    h1 { font-size: 22px; color: #1e1e3a; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #5050a0; margin-bottom: 20px; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .summary-card { background: #f0f0ff; border-radius: 8px; padding: 12px 20px; }
    .summary-card .label { font-size: 11px; color: #7070a0; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card .value { font-size: 18px; font-weight: 700; color: #1e1e3a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th { background: #1e1e3c; color: #b4c8ff; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    td { padding: 7px 10px; border-bottom: 1px solid #e8e8f4; }
    tr:nth-child(even) td { background: #f5f5ff; }
    .amount { text-align: right; font-weight: 600; }
    h2 { font-size: 15px; color: #1e1e3a; margin-bottom: 10px; }
    .footer { margin-top: 32px; font-size: 11px; color: #9090b0; border-top: 1px solid #e0e0f0; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>HomeBase — Expense Report</h1>
  <div class="subtitle">${monthName} ${year}</div>
  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Entries</div>
      <div class="value">${expenses.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Amount</div>
      <div class="value">₹${total.toLocaleString("en-IN")}</div>
    </div>
  </div>

  <h2>Expense Details</h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Recurring</th>
      </tr>
    </thead>
    <tbody>
      ${expenses
        .map(
          (exp, i) => `<tr>
        <td>${i + 1}</td>
        <td>${formatDate(exp.createdAt)}</td>
        <td>${exp.title}</td>
        <td>${getCategoryIcon(exp.categoryId)} ${getCategoryName(exp.categoryId)}</td>
        <td class="amount">₹${exp.amount.toLocaleString("en-IN")}</td>
        <td>${exp.isRecurring ? "Yes" : "No"}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <h2>Category Breakdown</h2>
  <table>
    <thead>
      <tr><th>Category</th><th>Amount</th><th>% of Total</th></tr>
    </thead>
    <tbody>
      ${catRows
        .map(
          ([name, amt]) => `<tr>
        <td>${name}</td>
        <td class="amount">₹${amt.toLocaleString("en-IN")}</td>
        <td class="amount">${total > 0 ? ((amt / total) * 100).toFixed(1) : "0"}%</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">Generated by HomeBase · ${monthName} ${year}</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onafterprint = () => {
        URL.revokeObjectURL(url);
        win.close();
      };
      toast.success("PDF ready — use your browser's Save as PDF option");
    } else {
      // Fallback: direct download
      const a = document.createElement("a");
      a.href = url;
      a.download = `homebase-expenses-${monthName.toLowerCase()}-${year}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Report downloaded");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-cyan">
            Expenses
          </h1>
          <p className="text-sm text-muted-foreground">
            {MONTHS_FULL[month - 1]} {year} · {expenses.length} entries ·{" "}
            {formatCurrency(total)}
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
      </div>

      {/* AI Sense Panel */}
      <AISensePanel
        categories={categories}
        categoriesLoading={categoriesLoading}
        month={month}
        year={year}
      />

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={openAdd}
          className="bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 hover:shadow-glow-cyan transition-all"
          data-ocid="expense.primary_button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
        <Button
          onClick={() => void handleAddRecurring()}
          variant="outline"
          className="border-accent/40 text-accent hover:bg-accent/10 hover:border-accent/60"
          data-ocid="expense.secondary_button"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Add Recurring
        </Button>
        <Button
          onClick={handleExportPDF}
          variant="outline"
          disabled={expenses.length === 0}
          className="border-border hover:bg-secondary/40 ml-auto"
          data-ocid="expense.export_button"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2" data-ocid="expense.loading_state">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 bg-muted/20" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-20 text-center" data-ocid="expense.empty_state">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              No expenses this month
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Click &quot;Add Expense&quot; to get started
            </p>
          </div>
        ) : (
          <Table data-ocid="expense.table">
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
                  Date
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
                  Title
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono hidden sm:table-cell">
                  Category
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono hidden md:table-cell">
                  Notes
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono text-right">
                  Amount
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono hidden sm:table-cell">
                  Type
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {expenses.map((exp, i) => (
                  <motion.tr
                    key={exp.id.toString()}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-border/30 hover:bg-secondary/20 transition-colors"
                    data-ocid={`expense.item.${i + 1}`}
                  >
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {formatDate(exp.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-sm max-w-[140px]">
                      <span className="truncate block">{exp.title}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-secondary/60 text-foreground/80 border-0"
                      >
                        {getCategoryIcon(exp.categoryId)}{" "}
                        {getCategoryName(exp.categoryId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[120px]">
                      <span className="truncate block">{exp.notes || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-primary font-semibold text-sm">
                      {formatCurrency(exp.amount)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {exp.isRecurring && (
                        <Badge className="text-xs bg-accent/20 text-accent border-accent/30 gap-1">
                          <RefreshCcw className="h-2.5 w-2.5" />
                          Recurring
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {deleteConfirm === exp.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleDelete(exp.id)}
                            disabled={deleteExpense.isPending}
                            data-ocid={`expense.delete_button.${i + 1}`}
                          >
                            {deleteExpense.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDeleteConfirm(null)}
                            data-ocid={`expense.cancel_button.${i + 1}`}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="glass border-border/50"
                          >
                            <DropdownMenuItem
                              onClick={() => openEdit(exp)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(exp.id)}
                              className="text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </div>

      {/* Total footer */}
      {expenses.length > 0 && (
        <div className="glass rounded-xl px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
            Total for {MONTHS_FULL[month - 1]}
          </span>
          <span className="text-xl font-display font-bold text-primary glow-text-cyan">
            {formatCurrency(total)}
          </span>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(undefined);
        }}
        categories={categories}
        editExpense={editingExpense}
        expenses={expenses}
        selectedMonth={month}
        selectedYear={year}
      />
    </motion.div>
  );
}
