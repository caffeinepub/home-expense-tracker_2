import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CategoryTotal {
    categoryId: bigint;
    total: number;
    categoryName: string;
    budgetLimit?: number;
}
export interface Expense {
    id: bigint;
    categoryId: bigint;
    month: bigint;
    title: string;
    isRecurring: boolean;
    createdAt: bigint;
    createdBy: Principal;
    year: bigint;
    notes: string;
    amount: number;
}
export interface UserProfile {
    name: string;
}
export interface Category {
    id: bigint;
    icon: string;
    name: string;
    budgetLimit?: number;
    isDefault: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCategory(name: string, icon: string, budgetLimit: number | null): Promise<bigint>;
    addExpense(title: string, amount: number, categoryId: bigint, month: bigint, year: bigint, notes: string, isRecurring: boolean): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCategory(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    getAllCategories(): Promise<Array<Category>>;
    getBudgetAlerts(month: bigint, year: bigint): Promise<Array<CategoryTotal>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategoryTotals(month: bigint, year: bigint): Promise<Array<CategoryTotal>>;
    getExpensesByMonth(month: bigint, year: bigint): Promise<Array<Expense>>;
    getMonthlyTotal(month: bigint, year: bigint): Promise<number>;
    getRecurringExpenses(): Promise<Array<Expense>>;
    getTopSpendingCategories(month: bigint, year: bigint): Promise<Array<CategoryTotal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initialize(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCategory(id: bigint, name: string, icon: string, budgetLimit: number | null): Promise<void>;
    updateExpense(id: bigint, title: string, amount: number, categoryId: bigint, month: bigint, year: bigint, notes: string, isRecurring: boolean): Promise<void>;
}
