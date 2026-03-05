import Float "mo:core/Float";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Apply migration on upgrade

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type Category = {
    id : Nat;
    name : Text;
    icon : Text;
    budgetLimit : ?Float;
    isDefault : Bool;
  };

  public type Expense = {
    id : Nat;
    title : Text;
    amount : Float;
    categoryId : Nat;
    month : Nat; // 1-12
    year : Nat;
    notes : Text;
    isRecurring : Bool;
    createdBy : Principal;
    createdAt : Int; // Timestamp
  };

  module Expense {
    public func compareByAmount(a : Expense, b : Expense) : Order.Order {
      Float.compare(b.amount, a.amount); // Descending order
    };
  };

  public type CategoryTotal = {
    categoryId : Nat;
    categoryName : Text;
    total : Float;
    budgetLimit : ?Float;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let categories = Map.empty<Nat, Category>();
  let expenses = Map.empty<Nat, Expense>();

  var nextCategoryId = 1;
  var nextExpenseId = 1;

  // Default categories
  let defaultCategories : [Category] = [
    { id = 1; name = "Servant Salary"; icon = "💼"; budgetLimit = null; isDefault = true },
    { id = 2; name = "Electricity"; icon = "💡"; budgetLimit = null; isDefault = true },
    { id = 3; name = "Water"; icon = "🚰"; budgetLimit = null; isDefault = true },
    { id = 4; name = "Maintenance"; icon = "🛠️"; budgetLimit = null; isDefault = true },
    { id = 5; name = "Repairs"; icon = "🔧"; budgetLimit = null; isDefault = true },
    { id = 6; name = "Groceries"; icon = "🍎"; budgetLimit = null; isDefault = true },
    { id = 7; name = "Rent"; icon = "🏠"; budgetLimit = null; isDefault = true },
    { id = 8; name = "Internet"; icon = "🌐"; budgetLimit = null; isDefault = true },
    { id = 9; name = "Medical"; icon = "⚕️"; budgetLimit = null; isDefault = true },
    { id = 10; name = "Miscellaneous"; icon = "🧩"; budgetLimit = null; isDefault = true },
  ];

  // Returns the role, or #guest if not registered (never traps)
  func safeGetRole(caller : Principal) : AccessControl.UserRole {
    if (caller.isAnonymous()) { return #guest };
    switch (accessControlState.userRoles.get(caller)) {
      case (?role) { role };
      case (null) { #guest };
    };
  };

  // Auto-registers unregistered non-anonymous callers as #user. No-op if already registered.
  func ensureRegistered(caller : Principal) {
    if (caller.isAnonymous()) { return };
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { accessControlState.userRoles.add(caller, #user) };
      case (?_) {};
    };
  };

  func isAdmin(caller : Principal) : Bool {
    safeGetRole(caller) == #admin
  };

  func isUser(caller : Principal) : Bool {
    let role = safeGetRole(caller);
    role == #admin or role == #user
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    let role = safeGetRole(caller);
    if (role == #guest) {
      return null;
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    ensureRegistered(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func initialize() : async () {
    ensureRegistered(caller);
    if (categories.isEmpty()) {
      for (category in defaultCategories.values()) {
        categories.add(category.id, category);
      };
      nextCategoryId := 11;
    };
  };

  public shared ({ caller }) func addCategory(
    name : Text,
    icon : Text,
    budgetLimit : ?Float,
  ) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add categories");
    };
    let id = nextCategoryId;
    categories.add(id, { id; name; icon; budgetLimit; isDefault = false });
    nextCategoryId += 1;
    id;
  };

  public shared ({ caller }) func updateCategory(
    id : Nat,
    name : Text,
    icon : Text,
    budgetLimit : ?Float,
  ) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update categories");
    };
    switch (categories.get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?category) {
        categories.add(id, {
          id;
          name;
          icon;
          budgetLimit;
          isDefault = category.isDefault;
        });
      };
    };
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete categories");
    };
    switch (categories.get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?category) {
        if (category.isDefault) { Runtime.trap("Cannot delete default category") };
        categories.remove(id);
      };
    };
  };

  public query ({ caller }) func getAllCategories() : async [Category] {
    let role = safeGetRole(caller);
    if (role == #guest) {
      return [];
    };
    categories.values().toArray();
  };

  public shared ({ caller }) func addExpense(
    title : Text,
    amount : Float,
    categoryId : Nat,
    month : Nat,
    year : Nat,
    notes : Text,
    isRecurring : Bool,
  ) : async Nat {
    ensureRegistered(caller);
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };
    if (amount <= 0) { Runtime.trap("Amount must be positive") };
    let id = nextExpenseId;
    expenses.add(id, {
      id;
      title;
      amount;
      categoryId;
      month;
      year;
      notes;
      isRecurring;
      createdBy = caller;
      createdAt = Time.now();
    });
    nextExpenseId += 1;
    id;
  };

  public shared ({ caller }) func updateExpense(
    id : Nat,
    title : Text,
    amount : Float,
    categoryId : Nat,
    month : Nat,
    year : Nat,
    notes : Text,
    isRecurring : Bool,
  ) : async () {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can update expenses");
    };
    if (amount <= 0) { Runtime.trap("Amount must be positive") };
    switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?originalExpense) {
        expenses.add(id, {
          id;
          title;
          amount;
          categoryId;
          month;
          year;
          notes;
          isRecurring;
          createdBy = originalExpense.createdBy;
          createdAt = originalExpense.createdAt;
        });
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };
    switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?_) { expenses.remove(id) };
    };
  };

  public query ({ caller }) func getExpensesByMonth(month : Nat, year : Nat) : async [Expense] {
    let role = safeGetRole(caller);
    if (role == #guest) {
      return [];
    };
    expenses.values().toArray().filter(func(e) { e.month == month and e.year == year });
  };

  public query ({ caller }) func getRecurringExpenses() : async [Expense] {
    let role = safeGetRole(caller);
    if (role == #guest) {
      return [];
    };
    expenses.values().toArray().filter(func(e) { e.isRecurring });
  };

  public query ({ caller }) func getMonthlyTotal(month : Nat, year : Nat) : async Float {
    let role = safeGetRole(caller);
    if (role == #guest) {
      return 0.0;
    };
    var total = 0.0;
    let expensesArray = expenses.values().toArray();
    for (expense in expensesArray.values()) {
      if (expense.month == month and expense.year == year) {
        total += expense.amount;
      };
    };
    total;
  };

  public query ({ caller }) func getCategoryTotals(
    month : Nat,
    year : Nat,
  ) : async [CategoryTotal] {
    let role = safeGetRole(caller);
    if (role == #guest) {
      return [];
    };
    let categoryTotals = Map.empty<Nat, Float>();
    let expensesArray = expenses.values().toArray();
    for (expense in expensesArray.values()) {
      if (expense.month == month and expense.year == year) {
        switch (categoryTotals.get(expense.categoryId)) {
          case (null) { categoryTotals.add(expense.categoryId, expense.amount) };
          case (?currentTotal) { categoryTotals.add(expense.categoryId, currentTotal + expense.amount) };
        };
      };
    };
    let resultArray = categoryTotals.toArray();
    resultArray.map(
      func((categoryId, total)) {
        let category = switch (categories.get(categoryId)) {
          case (null) {
            { id = 0; name = "Unknown"; icon = ""; budgetLimit = null; isDefault = false };
          };
          case (?cat) { cat };
        };
        {
          categoryId;
          categoryName = category.name;
          total;
          budgetLimit = category.budgetLimit;
        };
      }
    );
  };

  public query ({ caller }) func getBudgetAlerts(
    month : Nat,
    year : Nat,
  ) : async [CategoryTotal] {
    let role = safeGetRole(caller);
    if (role == #guest) {
      return [];
    };
    let categoryTotals = Map.empty<Nat, Float>();
    let expensesArray = expenses.values().toArray();
    for (expense in expensesArray.values()) {
      if (expense.month == month and expense.year == year) {
        switch (categoryTotals.get(expense.categoryId)) {
          case (null) { categoryTotals.add(expense.categoryId, expense.amount) };
          case (?currentTotal) { categoryTotals.add(expense.categoryId, currentTotal + expense.amount) };
        };
      };
    };
    let resultArray = categoryTotals.toArray();
    let filteredResultArray = resultArray.filter(
      func((categoryId, total)) {
        let category = switch (categories.get(categoryId)) {
         case (null) {
            { id = 0; name = "Unknown"; icon = ""; budgetLimit = null; isDefault = false };
          };
          case (?cat) { cat };
        };
        switch (category.budgetLimit) {
          case (null) { false };
          case (?limit) { total >= limit * 0.8 };
        };
      }
    );
    filteredResultArray.map(
      func((categoryId, total)) {
        let category = switch (categories.get(categoryId)) {
          case (null) {
            { id = 0; name = "Unknown"; icon = ""; budgetLimit = null; isDefault = false };
          };
          case (?cat) { cat };
        };
        {
          categoryId;
          categoryName = category.name;
          total;
          budgetLimit = category.budgetLimit;
        };
      }
    );
  };

  public query ({ caller }) func getTopSpendingCategories(
    month : Nat,
    year : Nat,
  ) : async [CategoryTotal] {
    let role = safeGetRole(caller);
    if (role == #guest) {
      return [];
    };
    let categoryTotals = Map.empty<Nat, Float>();
    let expensesArray = expenses.values().toArray();
    for (expense in expensesArray.values()) {
      if (expense.month == month and expense.year == year) {
        switch (categoryTotals.get(expense.categoryId)) {
          case (null) { categoryTotals.add(expense.categoryId, expense.amount) };
          case (?currentTotal) { categoryTotals.add(expense.categoryId, currentTotal + expense.amount) };
        };
      };
    };
    let resultArray = categoryTotals.toArray();
    let mappedResultArray = resultArray.map(
      func((categoryId, total)) {
        let category = switch (categories.get(categoryId)) {
          case (null) {
            { id = 0; name = "Unknown"; icon = ""; budgetLimit = null; isDefault = false };
          };
          case (?cat) { cat };
        };
        {
          categoryId;
          categoryName = category.name;
          total;
          budgetLimit = category.budgetLimit;
        };
      }
    );
    mappedResultArray.sort(
      func(a, b) {
        Float.compare(b.total, a.total);
      }
    );
  };
};
