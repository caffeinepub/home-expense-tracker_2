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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Lock,
  MoreVertical,
  Pencil,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Category } from "../backend.d";
import {
  useAddCategory,
  useCategories,
  useDeleteCategory,
  useUpdateCategory,
} from "../hooks/useQueries";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CategoryFormData {
  name: string;
  icon: string;
  budgetLimit: string;
}

const emptyForm: CategoryFormData = { name: "", icon: "💰", budgetLimit: "" };

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  editCategory?: Category;
}

function CategoryModal({ open, onClose, editCategory }: CategoryModalProps) {
  const [form, setForm] = useState<CategoryFormData>(
    editCategory
      ? {
          name: editCategory.name,
          icon: editCategory.icon,
          budgetLimit: editCategory.budgetLimit
            ? String(editCategory.budgetLimit)
            : "",
        }
      : emptyForm,
  );

  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const isPending = addCategory.isPending || updateCategory.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const budgetLimit = form.budgetLimit
      ? Number.parseFloat(form.budgetLimit)
      : null;
    if (form.budgetLimit && (Number.isNaN(budgetLimit!) || budgetLimit! <= 0)) {
      toast.error("Enter a valid budget limit");
      return;
    }

    if (editCategory) {
      updateCategory.mutate(
        {
          id: editCategory.id,
          name: form.name.trim(),
          icon: form.icon,
          budgetLimit,
        },
        {
          onSuccess: () => {
            toast.success("Category updated");
            onClose();
          },
          onError: () => toast.error("Failed to update category"),
        },
      );
    } else {
      addCategory.mutate(
        { name: form.name.trim(), icon: form.icon, budgetLimit },
        {
          onSuccess: () => {
            toast.success("Category added");
            onClose();
            setForm(emptyForm);
          },
          onError: () => toast.error("Failed to add category"),
        },
      );
    }
  };

  const EMOJI_SUGGESTIONS = [
    "💰",
    "🏠",
    "⚡",
    "💧",
    "🔧",
    "👩‍🍳",
    "🛒",
    "🚗",
    "🎓",
    "🏥",
    "📱",
    "🎮",
    "✈️",
    "🎵",
    "💄",
    "🌿",
    "🍕",
    "☕",
    "🐾",
    "🎁",
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gradient-cyan font-display">
            {editCategory ? "Edit Category" : "New Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Name *
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Electricity"
              className="mt-1 bg-input border-border focus:ring-primary"
              autoFocus
              disabled={editCategory?.isDefault && !editCategory}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Icon
            </Label>
            <div className="mt-2">
              <Input
                value={form.icon}
                onChange={(e) =>
                  setForm((p) => ({ ...p, icon: e.target.value }))
                }
                placeholder="Emoji or text"
                className="bg-input border-border focus:ring-primary mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_SUGGESTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, icon: emoji }))}
                    className={`text-xl p-1 rounded-lg hover:bg-secondary/60 transition-colors ${
                      form.icon === emoji
                        ? "bg-primary/20 ring-1 ring-primary/40"
                        : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Monthly Budget Limit (₹){" "}
              <span className="normal-case">(optional)</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="100"
              value={form.budgetLimit}
              onChange={(e) =>
                setForm((p) => ({ ...p, budgetLimit: e.target.value }))
              }
              placeholder="Leave blank for no limit"
              className="mt-1 bg-input border-border focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border hover:bg-secondary/40"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 hover:shadow-glow-cyan transition-all"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editCategory ? "Update" : "Add Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();
  const [deleteConfirm, setDeleteConfirm] = useState<bigint | null>(null);

  const openAdd = () => {
    setEditingCategory(undefined);
    setModalOpen(true);
  };
  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleDelete = (id: bigint) => {
    deleteCategory.mutate(id, {
      onSuccess: () => {
        toast.success("Category deleted");
        setDeleteConfirm(null);
      },
      onError: () => toast.error("Cannot delete this category"),
    });
  };

  const defaultCategories = categories.filter((c) => c.isDefault);
  const customCategories = categories.filter((c) => !c.isDefault);

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
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} total · {customCategories.length} custom
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 hover:shadow-glow-cyan transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 bg-muted/20 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Default Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Default Categories
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {defaultCategories.map((cat, i) => (
                  <motion.div
                    key={cat.id.toString()}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl p-4 flex items-start justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-secondary/50">
                        {cat.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-sm">
                            {cat.name}
                          </p>
                          <Lock className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                        {cat.budgetLimit ? (
                          <p className="text-xs text-muted-foreground font-mono">
                            Budget: {formatCurrency(cat.budgetLimit)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/50">
                            No budget limit
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Custom Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tags className="h-4 w-4 text-primary/70" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Custom Categories
              </h2>
              <Badge className="text-xs bg-primary/10 text-primary border-primary/20 ml-1">
                {customCategories.length}
              </Badge>
            </div>

            {customCategories.length === 0 ? (
              <div className="glass rounded-xl py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                  <Tags className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">
                  No custom categories yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
                  Create your own to track unique expenses
                </p>
                <Button
                  onClick={openAdd}
                  variant="outline"
                  size="sm"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {customCategories.map((cat, i) => (
                    <motion.div
                      key={cat.id.toString()}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass rounded-xl p-4 flex items-start justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                          {cat.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {cat.name}
                          </p>
                          {cat.budgetLimit ? (
                            <p className="text-xs text-muted-foreground font-mono">
                              Budget: {formatCurrency(cat.budgetLimit)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/50">
                              No budget limit
                            </p>
                          )}
                        </div>
                      </div>

                      {deleteConfirm === cat.id ? (
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleDelete(cat.id)}
                            disabled={deleteCategory.isPending}
                          >
                            {deleteCategory.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Delete?"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="glass border-border/50"
                          >
                            <DropdownMenuItem
                              onClick={() => openEdit(cat)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(cat.id)}
                              className="text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      <CategoryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(undefined);
        }}
        editCategory={editingCategory}
      />
    </motion.div>
  );
}
