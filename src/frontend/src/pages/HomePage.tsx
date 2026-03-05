import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Receipt, Tags } from "lucide-react";
import CategoriesPage from "./CategoriesPage";
import DashboardPage from "./DashboardPage";
import ExpensesPage from "./ExpensesPage";

export default function HomePage() {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      {/* Tab Bar */}
      <div className="mb-6 flex justify-center">
        <TabsList className="relative inline-flex p-1 gap-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_24px_oklch(0.72_0.22_195/0.08)] h-auto">
          <TabsTrigger
            value="dashboard"
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
              text-muted-foreground transition-all duration-200
              data-[state=active]:text-primary
              data-[state=active]:bg-primary/10
              data-[state=active]:border
              data-[state=active]:border-primary/30
              data-[state=active]:shadow-[0_0_12px_oklch(0.72_0.22_195/0.25)]
              hover:text-foreground hover:bg-white/5
            "
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>

          <TabsTrigger
            value="expenses"
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
              text-muted-foreground transition-all duration-200
              data-[state=active]:text-primary
              data-[state=active]:bg-primary/10
              data-[state=active]:border
              data-[state=active]:border-primary/30
              data-[state=active]:shadow-[0_0_12px_oklch(0.72_0.22_195/0.25)]
              hover:text-foreground hover:bg-white/5
            "
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>

          <TabsTrigger
            value="categories"
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
              text-muted-foreground transition-all duration-200
              data-[state=active]:text-primary
              data-[state=active]:bg-primary/10
              data-[state=active]:border
              data-[state=active]:border-primary/30
              data-[state=active]:shadow-[0_0_12px_oklch(0.72_0.22_195/0.25)]
              hover:text-foreground hover:bg-white/5
            "
          >
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="dashboard"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <DashboardPage />
      </TabsContent>

      <TabsContent
        value="expenses"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <ExpensesPage />
      </TabsContent>

      <TabsContent
        value="categories"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <CategoriesPage />
      </TabsContent>
    </Tabs>
  );
}
