
import { useEffect, useState, type FormEvent } from "react";
import "./App.css";

import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "./services/transactionService";

import {
  getBudgetForMonth,
  getCategoryBudgetsForMonth,
  getCurrentBudget,
  getCurrentCategoryBudgets,
  updateCurrentBudget,
  updateCurrentCategoryBudget,
} from "./services/budgetService";

import type {
  Transaction,
  UpdateTransactionRequest,
} from "./services/transactionService";

import type {
  CategoryBudget,
  MonthlyBudget,
} from "./services/budgetService";

type Page =
  | "overview"
  | "transactions"
  | "categories"
  | "budgets"
  | "reports";

type MonthlySpendingPoint = {
  key: string;
  label: string;
  amount: number;
};

type CategoryDatum = {
  name: string;
  amount: number;
  count: number;
  percentage: number;
};

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Other",
];

const categoryColors: Record<string, string> = {
  Food: "#26865c",
  Transport: "#78b69a",
  Shopping: "#d1a351",
  Bills: "#6688bd",
  Health: "#b27da8",
  Other: "#9ba69e",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const formatCompactCurrency = (amount: number) =>
  `₹${new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount)}`;

function getToday(): string {
  const now = new Date();

  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getCategoryInitial(category: string): string {
  const initials: Record<string, string> = {
    Food: "F",
    Transport: "T",
    Shopping: "S",
    Bills: "B",
    Health: "H",
    Other: "O",
  };

  return initials[category] ?? "O";
}

function buildMonthlyTrend(
  transactions: Transaction[]
): MonthlySpendingPoint[] {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1
    );

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const amount = transactions
      .filter((transaction) => transaction.transactionDate.slice(0, 7) === key)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      key,
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      amount,
    };
  });
}

function MonthlyTrendChart({
  data,
}: {
  data: MonthlySpendingPoint[];
}) {
  const chartWidth = 720;
  const chartHeight = 260;
  const left = 70;
  const right = 700;
  const top = 28;
  const bottom = 207;
  const plotHeight = bottom - top;

  const maximum = Math.max(...data.map((point) => point.amount), 1);

  const points = data.map((point, index) => {
    const x =
      left +
      (index * (right - left)) / Math.max(data.length - 1, 1);

    const y = bottom - (point.amount / maximum) * plotHeight;

    return { ...point, x, y };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const areaPoints = `${left},${bottom} ${linePoints} ${right},${bottom}`;

  return (
    <div className="chart-wrap">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Monthly spending trend for the last six calendar months"
      >
        <defs>
          <linearGradient
            id="spendingAreaFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#38a774" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38a774" stopOpacity="0.015" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = bottom - fraction * plotHeight;
          const value = maximum * fraction;

          return (
            <g key={fraction}>
              <line
                x1={left}
                y1={y}
                x2={right}
                y2={y}
                className="chart-grid-line"
              />
              <text
                x={left - 10}
                y={y + 4}
                textAnchor="end"
                className="chart-axis-label"
              >
                {formatCompactCurrency(value)}
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} fill="url(#spendingAreaFill)" />

        <polyline
          points={linePoints}
          fill="none"
          stroke="#23855a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.key}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#ffffff"
              stroke="#23855a"
              strokeWidth="3"
            />
            <title>
              {`${formatMonth(point.key)}: ${formatCurrency(point.amount)}`}
            </title>
            <text
              x={point.x}
              y={bottom + 25}
              textAnchor="middle"
              className="chart-month-label"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CategoryDonutChart({
  data,
  total,
}: {
  data: CategoryDatum[];
  total: number;
}) {
  const radius = 69;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((item, index) => {
    const length =
      total > 0 ? (item.amount / total) * circumference : 0;

    // Calculate this segment's offset without mutating a variable during render.
    const offset = data
      .slice(0, index)
      .reduce(
        (sum, previousItem) =>
          sum +
          (total > 0
            ? (previousItem.amount / total) * circumference
            : 0),
        0
      );

    return {
      ...item,
      length,
      offset,
      color: categoryColors[item.name] ?? categoryColors.Other,
    };
  });

  return (
    <div className="donut-layout">
      <div className="donut-chart-wrap">
        <svg
          className="donut-chart"
          viewBox="0 0 220 220"
          role="img"
          aria-label="Doughnut chart showing spending by category"
        >
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#edf2ed"
            strokeWidth="25"
          />

          {segments.map((segment) => (
            <circle
              key={segment.name}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="25"
              strokeDasharray={`${segment.length} ${
                circumference - segment.length
              }`}
              strokeDashoffset={-segment.offset}
              transform="rotate(-90 110 110)"
            >
              <title>
                {`${segment.name}: ${formatCurrency(segment.amount)}`}
              </title>
            </circle>
          ))}

          <text
            x="110"
            y="103"
            textAnchor="middle"
            className="donut-center-amount"
          >
            {formatCompactCurrency(total)}
          </text>

          <text
            x="110"
            y="124"
            textAnchor="middle"
            className="donut-center-label"
          >
            TOTAL SPENT
          </text>
        </svg>
      </div>

      <div className="donut-legend">
        {data.length === 0 ? (
          <p className="empty-state">
            Category spending will appear after you add transactions.
          </p>
        ) : (
          data.map((item) => (
            <div className="donut-legend-item" key={item.name}>
              <span
                className="donut-legend-dot"
                style={{ backgroundColor: categoryColors[item.name] }}
              />
              <span className="donut-legend-name">{item.name}</span>
              <strong>{item.percentage.toFixed(1)}%</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activePage, setActivePage] = useState<Page>("overview");

  // Overall monthly budget.
  const [monthlyBudget, setMonthlyBudget] = useState(20000);
  const [budgetAmountInput, setBudgetAmountInput] = useState("20000.00");
  const [isBudgetLoading, setIsBudgetLoading] = useState(true);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [budgetSuccess, setBudgetSuccess] = useState("");

  // Category budget state.
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [isCategoryBudgetsLoading, setIsCategoryBudgetsLoading] =
    useState(true);
  const [categoryBudgetLoadError, setCategoryBudgetLoadError] = useState("");
  const [editingBudgetCategory, setEditingBudgetCategory] =
    useState<string | null>(null);
  const [categoryBudgetInput, setCategoryBudgetInput] = useState("");
  const [isSavingCategoryBudget, setIsSavingCategoryBudget] = useState(false);
  const [categoryBudgetError, setCategoryBudgetError] = useState("");
  const [categoryBudgetSuccess, setCategoryBudgetSuccess] = useState("");

  // Reports page state.
  const [reportMonth, setReportMonth] = useState(
    getToday().slice(0, 7)
  );
  const [reportBudget, setReportBudget] =
    useState<MonthlyBudget | null>(null);
  const [reportCategoryBudgets, setReportCategoryBudgets] = useState<
    CategoryBudget[]
  >([]);
  const [isReportDataLoading, setIsReportDataLoading] = useState(false);
  const [reportDataError, setReportDataError] = useState("");

  // Add transaction form.
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [transactionDate, setTransactionDate] = useState(getToday());
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transaction search and filters.
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] =
    useState("All categories");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Edit transaction form.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Food");
  const [editDate, setEditDate] = useState(getToday());
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const currentMonth = getToday().slice(0, 7);
  const currentMonthLabel = formatMonth(currentMonth);

  // Load transactions.
  useEffect(() => {
    let ignoreResult = false;

    async function loadTransactions() {
      try {
        const data = await getTransactions();

        if (!ignoreResult) {
          setTransactions(data);
          setLoadError("");
        }
      } catch (error) {
        if (!ignoreResult) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load transactions."
          );
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    void loadTransactions();

    return () => {
      ignoreResult = true;
    };
  }, []);

  // Load current overall budget.
  useEffect(() => {
    let ignoreResult = false;

    async function loadBudget() {
      try {
        const savedBudget = await getCurrentBudget();

        if (!ignoreResult) {
          setMonthlyBudget(savedBudget.amount);
          setBudgetAmountInput(savedBudget.amount.toFixed(2));
          setBudgetError("");
        }
      } catch (error) {
        if (!ignoreResult) {
          setBudgetError(
            error instanceof Error
              ? error.message
              : "Could not load the monthly budget."
          );
        }
      } finally {
        if (!ignoreResult) {
          setIsBudgetLoading(false);
        }
      }
    }

    void loadBudget();

    return () => {
      ignoreResult = true;
    };
  }, []);

  // Load current category budgets.
  useEffect(() => {
    let ignoreResult = false;

    async function loadCategoryBudgets() {
      try {
        const savedBudgets = await getCurrentCategoryBudgets();

        if (!ignoreResult) {
          setCategoryBudgets(savedBudgets);
          setCategoryBudgetLoadError("");
        }
      } catch (error) {
        if (!ignoreResult) {
          setCategoryBudgetLoadError(
            error instanceof Error
              ? error.message
              : "Could not load category budgets."
          );
        }
      } finally {
        if (!ignoreResult) {
          setIsCategoryBudgetsLoading(false);
        }
      }
    }

    void loadCategoryBudgets();

    return () => {
      ignoreResult = true;
    };
  }, []);

  // Load budgets for the selected report month.
  useEffect(() => {
    if (activePage !== "reports") return;

    let ignoreResult = false;

    async function loadReportBudgets() {
      setIsReportDataLoading(true);
      setReportDataError("");

      const [overallResult, categoryResult] = await Promise.allSettled([
        getBudgetForMonth(reportMonth),
        getCategoryBudgetsForMonth(reportMonth),
      ]);

      if (ignoreResult) return;

      const errors: string[] = [];

      if (overallResult.status === "fulfilled") {
        setReportBudget(overallResult.value);
      } else {
        setReportBudget(null);
        errors.push(
          overallResult.reason instanceof Error
            ? overallResult.reason.message
            : "Could not load the overall budget for this month."
        );
      }

      if (categoryResult.status === "fulfilled") {
        setReportCategoryBudgets(categoryResult.value);
      } else {
        setReportCategoryBudgets([]);
        errors.push(
          categoryResult.reason instanceof Error
            ? categoryResult.reason.message
            : "Could not load category budgets for this month."
        );
      }

      setReportDataError(errors.join(" "));
      setIsReportDataLoading(false);
    }

    void loadReportBudgets();

    return () => {
      ignoreResult = true;
    };
  }, [activePage, reportMonth]);

  // Scroll to the selected page after navigation.
  useEffect(() => {
    if (activePage === "overview") return;

    const targetId =
      activePage === "transactions"
        ? "transactions-page"
        : activePage === "categories"
          ? "categories-page"
          : activePage === "budgets"
            ? "budgets-page"
            : "reports-page";

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activePage]);

  // Overall spending across all recorded transactions.
  const totalSpent = transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  // Spending counted toward the current month's budgets.
  const currentMonthTransactions = transactions.filter(
    (transaction) => transaction.transactionDate.slice(0, 7) === currentMonth
  );

  const monthlySpent = currentMonthTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const remaining = monthlyBudget - monthlySpent;
  const budgetUsed =
    monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0;
  const budgetBarWidth = Math.min(Math.max(budgetUsed, 0), 100);

  // Overall category analytics, based on all transactions.
  const categoryBreakdown: CategoryDatum[] = categories
    .map((name) => {
      const categoryTransactions = transactions.filter(
        (transaction) => transaction.category === name
      );

      const categoryAmount = categoryTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      return {
        name,
        amount: categoryAmount,
        count: categoryTransactions.length,
        percentage:
          totalSpent > 0 ? (categoryAmount / totalSpent) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const categoryTotals = categoryBreakdown.filter(
    (item) => item.amount > 0
  );

  const categoriesInUse = categoryBreakdown.filter(
    (item) => item.count > 0
  ).length;

  const topCategory = categoryBreakdown.find(
    (item) => item.amount > 0
  );

  const averageTransaction =
    transactions.length > 0 ? totalSpent / transactions.length : 0;

  const monthlyTrend = buildMonthlyTrend(transactions);

  // Current-month category budget calculations.
  const monthlyCategorySpending = categories.map((name) => {
    const spent = currentMonthTransactions
      .filter((transaction) => transaction.category === name)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const savedBudget = categoryBudgets.find(
      (item) => item.category === name
    );

    const limit = savedBudget?.amount ?? null;
    const usage = limit !== null && limit > 0 ? (spent / limit) * 100 : 0;

    return {
      name,
      spent,
      limit,
      remaining: limit !== null ? limit - spent : null,
      usage,
      barWidth: Math.min(Math.max(usage, 0), 100),
      overBudget: limit !== null && spent > limit,
    };
  });

  // Transaction page filters.
  const latestTransactions = [...transactions].sort(
    (a, b) => b.id - a.id
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTransactions = latestTransactions.filter((transaction) => {
    const matchesDescription = transaction.description
      .toLowerCase()
      .includes(normalizedSearch);

    const matchesCategory =
      filterCategory === "All categories" ||
      transaction.category === filterCategory;

    const matchesStartDate =
      !startDate || transaction.transactionDate >= startDate;

    const matchesEndDate =
      !endDate || transaction.transactionDate <= endDate;

    return (
      matchesDescription &&
      matchesCategory &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filterCategory !== "All categories" ||
    startDate !== "" ||
    endDate !== "";

  function clearFilters() {
    setSearchTerm("");
    setFilterCategory("All categories");
    setStartDate("");
    setEndDate("");
  }

  // Report transactions for the selected month.
  const reportTransactions = transactions
    .filter(
      (transaction) => transaction.transactionDate.slice(0, 7) === reportMonth
    )
    .sort((a, b) => {
      const dateComparison = b.transactionDate.localeCompare(
        a.transactionDate
      );

      return dateComparison !== 0 ? dateComparison : b.id - a.id;
    });

  const reportTotalSpent = reportTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const reportAverage =
    reportTransactions.length > 0
      ? reportTotalSpent / reportTransactions.length
      : 0;

  const reportCategoryBreakdown: CategoryDatum[] = categories
    .map((name) => {
      const categoryTransactions = reportTransactions.filter(
        (transaction) => transaction.category === name
      );

      const categoryAmount = categoryTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      return {
        name,
        amount: categoryAmount,
        count: categoryTransactions.length,
        percentage:
          reportTotalSpent > 0
            ? (categoryAmount / reportTotalSpent) * 100
            : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const reportCategoryBudgetsByName = new Map(
    reportCategoryBudgets.map((item) => [item.category, item])
  );

  const reportBudgetAmount = reportBudget?.amount ?? null;

  const reportBudgetUsed =
    reportBudgetAmount !== null && reportBudgetAmount > 0
      ? (reportTotalSpent / reportBudgetAmount) * 100
      : null;

  const reportBudgetRemaining =
    reportBudgetAmount !== null
      ? reportBudgetAmount - reportTotalSpent
      : null;

  const reportConfiguredCategoryLimits = reportCategoryBudgets.filter(
    (item) => item.amount > 0
  );

  const reportCategoriesOverBudget = reportConfiguredCategoryLimits.filter(
    (item) => {
      const spent =
        reportCategoryBreakdown.find(
          (categoryItem) => categoryItem.name === item.category
        )?.amount ?? 0;

      return spent > item.amount;
    }
  ).length;

  // Export the complete monthly report as CSV.
  function exportMonthlyReport() {
    /*
     * Escape CSV fields and protect spreadsheet applications from
     * interpreting user-supplied text as formulas.
     *
     * Numeric values remain numeric. Text fields beginning with =, +, -,
     * @, tab, or carriage return receive a leading apostrophe.
     */
    const escapeCsv = (value: unknown): string => {
      let text = String(value ?? "");

      if (
        typeof value === "string" &&
        /^[=+\-@\t\r]/.test(value)
      ) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const csvRows: unknown[][] = [
      // Section 1: monthly summary.
      ["SPENDWISE MONTHLY FINANCIAL REPORT", formatMonth(reportMonth)],
      ["Report month", reportMonth],
      ["Total spending (INR)", Number(reportTotalSpent.toFixed(2))],
      ["Transaction count", reportTransactions.length],
      ["Average transaction (INR)", Number(reportAverage.toFixed(2))],
      [
        "Overall monthly budget (INR)",
        reportBudgetAmount === null
          ? "Not configured"
          : Number(reportBudgetAmount.toFixed(2)),
      ],
      [
        "Overall budget used (%)",
        reportBudgetUsed === null
          ? "Not available"
          : Number(reportBudgetUsed.toFixed(2)),
      ],
      [
        "Overall budget remaining (INR)",
        reportBudgetRemaining === null
          ? "Not available"
          : Number(reportBudgetRemaining.toFixed(2)),
      ],
      [
        "Category budgets configured",
        reportConfiguredCategoryLimits.length,
      ],
      ["Categories over budget", reportCategoriesOverBudget],
      [],

      // Section 2: spending and budget performance for every category.
      ["CATEGORY-WISE SPENDING AND BUDGET PERFORMANCE"],
      [
        "Category",
        "Transaction Count",
        "Total Spent (INR)",
        "Share of Total (%)",
        "Budget Limit (INR)",
        "Budget Used (%)",
        "Budget Remaining (INR)",
        "Budget Status",
      ],

      ...categories.map((categoryName) => {
        const item = reportCategoryBreakdown.find(
          (categoryItem) => categoryItem.name === categoryName
        )!;

        const savedBudget = reportCategoryBudgetsByName.get(categoryName);
        const limit = savedBudget?.amount ?? null;
        const hasLimit = limit !== null && limit > 0;

        const usage =
          hasLimit ? (item.amount / limit) * 100 : null;

        const categoryRemaining =
          hasLimit ? limit - item.amount : null;

        const status =
          !hasLimit
            ? "No limit configured"
            : item.amount > limit
              ? "Over budget"
              : "Within budget";

        return [
          item.name,
          item.count,
          Number(item.amount.toFixed(2)),
          Number(item.percentage.toFixed(2)),
          hasLimit ? Number(limit.toFixed(2)) : "Not configured",
          usage === null ? "Not available" : Number(usage.toFixed(2)),
          categoryRemaining === null
            ? "Not available"
            : Number(categoryRemaining.toFixed(2)),
          status,
        ];
      }),

      [],
      // Section 3: full transaction detail.
      ["TRANSACTION DETAILS"],
      [
        "Transaction ID",
        "Description",
        "Amount (INR)",
        "Category",
        "Transaction Date",
        "Notes",
      ],

      ...reportTransactions.map((transaction) => [
        transaction.id,
        transaction.description,
        Number(transaction.amount.toFixed(2)),
        transaction.category,
        transaction.transactionDate,
        transaction.notes ?? "",
      ]),
    ];

    const csvContent =
      "\uFEFF" +
      csvRows
        .map((row) => row.map(escapeCsv).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `spendwise-report-${reportMonth}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Navigation.
  function navigateToOverview() {
    setActivePage("overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigateToTransactions() {
    setActivePage("transactions");
  }

  function navigateToCategories() {
    setActivePage("categories");
  }

  function navigateToBudgets() {
    setActivePage("budgets");
  }

  function navigateToReports() {
    setActivePage("reports");
  }

  function openCategoryTransactions(selectedCategory: string) {
    setSearchTerm("");
    setFilterCategory(selectedCategory);
    setStartDate("");
    setEndDate("");
    setActivePage("transactions");
  }

  // Add transaction.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    const parsedAmount = Number(amount);

    if (
      !description.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !transactionDate
    ) {
      setSubmitError(
        "Enter a description, a positive amount, and a date."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const created = await createTransaction({
        description: description.trim(),
        amount: parsedAmount,
        category,
        transactionDate,
        notes: null,
      });

      setTransactions((current) => [...current, created]);

      setDescription("");
      setAmount("");
      setCategory("Food");
      setTransactionDate(getToday());
      setSubmitError("");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not save the transaction."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Edit transaction.
  function startEditing(transaction: Transaction) {
    setEditingId(transaction.id);
    setEditDescription(transaction.description);
    setEditAmount(String(transaction.amount));
    setEditCategory(transaction.category);
    setEditDate(transaction.transactionDate);
    setEditNotes(transaction.notes ?? "");
    setEditError("");
    setActionError("");
  }

  async function handleUpdateSubmit(
    event: FormEvent<HTMLFormElement>,
    id: number
  ) {
    event.preventDefault();
    setEditError("");

    const parsedAmount = Number(editAmount);

    if (
      !editDescription.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !editDate
    ) {
      setEditError(
        "Enter a description, a positive amount, and a date."
      );
      return;
    }

    const request: UpdateTransactionRequest = {
      description: editDescription.trim(),
      amount: parsedAmount,
      category: editCategory,
      transactionDate: editDate,
      notes: editNotes.trim() || null,
    };

    try {
      setIsSavingEdit(true);

      const updated = await updateTransaction(id, request);

      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === id ? updated : transaction
        )
      );

      setEditingId(null);
      setEditError("");
      setActionError("");
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Could not update the transaction."
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Delete transaction after confirmation.
  async function handleDeleteTransaction(transaction: Transaction) {
    const confirmed = window.confirm(
      `Delete "${transaction.description}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(transaction.id);
    setActionError("");

    try {
      await deleteTransaction(transaction.id);

      setTransactions((current) =>
        current.filter((item) => item.id !== transaction.id)
      );

      setEditingId((current) =>
        current === transaction.id ? null : current
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not delete the transaction."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Save the current overall monthly budget.
  async function handleBudgetSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBudgetError("");
    setBudgetSuccess("");

    const parsedBudget = Number(budgetAmountInput);

    if (
      !Number.isFinite(parsedBudget) ||
      parsedBudget <= 0 ||
      parsedBudget > 9999999999.99
    ) {
      setBudgetError("Enter a valid budget greater than ₹0.");
      return;
    }

    try {
      setIsSavingBudget(true);

      const savedBudget = await updateCurrentBudget(parsedBudget);

      setMonthlyBudget(savedBudget.amount);
      setBudgetAmountInput(savedBudget.amount.toFixed(2));
      setBudgetSuccess(
        `Your ${formatMonth(savedBudget.month)} budget has been saved.`
      );
    } catch (error) {
      setBudgetError(
        error instanceof Error
          ? error.message
          : "Could not save the monthly budget."
      );
    } finally {
      setIsSavingBudget(false);
    }
  }

  // Category budget editor.
  function startEditingCategoryBudget(categoryName: string) {
    const existing = categoryBudgets.find(
      (item) => item.category === categoryName
    );

    setEditingBudgetCategory(categoryName);
    setCategoryBudgetInput(existing ? existing.amount.toFixed(2) : "");
    setCategoryBudgetError("");
    setCategoryBudgetSuccess("");
  }

  function cancelEditingCategoryBudget() {
    setEditingBudgetCategory(null);
    setCategoryBudgetInput("");
    setCategoryBudgetError("");
  }

  async function handleCategoryBudgetSubmit(
    event: FormEvent<HTMLFormElement>,
    categoryName: string
  ) {
    event.preventDefault();
    setCategoryBudgetError("");
    setCategoryBudgetSuccess("");

    if (categoryBudgetInput.trim() === "") {
      setCategoryBudgetError(
        "Enter an amount. Use 0 to remove the limit."
      );
      return;
    }

    const parsedAmount = Number(categoryBudgetInput);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 0 ||
      parsedAmount > 9999999999.99
    ) {
      setCategoryBudgetError("Enter a valid amount of ₹0 or more.");
      return;
    }

    try {
      setIsSavingCategoryBudget(true);

      const saved = await updateCurrentCategoryBudget(
        categoryName,
        parsedAmount
      );

      if (saved.amount === 0) {
        setCategoryBudgets((current) =>
          current.filter((item) => item.category !== categoryName)
        );

        setCategoryBudgetSuccess(
          `${categoryName} limit removed for ${currentMonthLabel}.`
        );
      } else {
        setCategoryBudgets((current) => [
          ...current.filter((item) => item.category !== categoryName),
          saved,
        ]);

        setCategoryBudgetSuccess(
          `${categoryName} limit saved for ${currentMonthLabel}.`
        );
      }

      setEditingBudgetCategory(null);
      setCategoryBudgetInput("");
      setCategoryBudgetError("");
    } catch (error) {
      setCategoryBudgetError(
        error instanceof Error
          ? error.message
          : "Could not save the category budget."
      );
    } finally {
      setIsSavingCategoryBudget(false);
    }
  }

  const editingTransaction = transactions.find(
    (transaction) => transaction.id === editingId
  );

  // Shared edit form.
  function renderEditForm() {
    if (!editingTransaction) return null;

    return (
      <form
        className="edit-transaction-form"
        onSubmit={(event) =>
          void handleUpdateSubmit(event, editingTransaction.id)
        }
      >
        <h3>Edit transaction #{editingTransaction.id}</h3>

        <div className="edit-form-grid">
          <label>
            Description
            <input
              type="text"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              maxLength={150}
              required
            />
          </label>

          <label>
            Amount (₹)
            <input
              type="number"
              value={editAmount}
              onChange={(event) => setEditAmount(event.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label>
            Category
            <select
              value={editCategory}
              onChange={(event) => setEditCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              value={editDate}
              onChange={(event) => setEditDate(event.target.value)}
              required
            />
          </label>

          <label className="edit-notes-field">
            Notes
            <textarea
              value={editNotes}
              onChange={(event) => setEditNotes(event.target.value)}
              maxLength={500}
              rows={2}
            />
          </label>
        </div>

        {editError && (
          <p className="action-error" role="alert">
            {editError}
          </p>
        )}

        <div className="edit-form-buttons">
          <button
            className="submit-button"
            type="submit"
            disabled={isSavingEdit}
          >
            {isSavingEdit ? "Saving changes..." : "Save changes"}
          </button>

          <button
            className="cancel-button"
            type="button"
            disabled={isSavingEdit}
            onClick={() => {
              setEditingId(null);
              setEditError("");
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // Shared transaction row.
  function renderTransactionRow(transaction: Transaction) {
    const formattedDate = new Date(
      `${transaction.transactionDate}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return (
      <div className="transaction-row" key={transaction.id}>
        <div className="category-icon">
          {getCategoryInitial(transaction.category)}
        </div>

        <div className="transaction-info">
          <strong>{transaction.description}</strong>
          <span>
            {transaction.category} · {formattedDate}
          </span>
        </div>

        <strong className="transaction-amount">
          −{formatCurrency(transaction.amount)}
        </strong>

        <div className="transaction-actions">
          <button
            type="button"
            className="transaction-action-button"
            onClick={() => startEditing(transaction)}
          >
            Edit
          </button>

          <button
            type="button"
            className="transaction-action-button delete-button"
            disabled={deletingId === transaction.id}
            onClick={() => void handleDeleteTransaction(transaction)}
          >
            {deletingId === transaction.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  // Category-wise budget card.
  function renderCategoryBudgetCard(categoryName: string) {
    const spending = monthlyCategorySpending.find(
      (item) => item.name === categoryName
    );

    if (!spending) return null;

    const isEditing = editingBudgetCategory === categoryName;
    const hasBudget = spending.limit !== null && spending.limit > 0;
    const usageColor = spending.overBudget ? "#bd4343" : "#23865a";

    return (
      <article className="summary-card" key={categoryName}>
        <div className="category-card-heading">
          <div className="category-icon">
            {getCategoryInitial(categoryName)}
          </div>
          <div>
            <p>{categoryName}</p>
            <span className="card-footnote">
              {hasBudget ? "Monthly spending limit" : "No limit configured"}
            </span>
          </div>
        </div>

        <p className="card-footnote">Spent this month</p>
        <h2 style={{ marginTop: "5px" }}>
          {formatCurrency(spending.spent)}
        </h2>

        {hasBudget ? (
          <>
            <div className="category-item-heading">
              <span>Limit: {formatCurrency(spending.limit!)}</span>
              <strong style={{ color: usageColor }}>
                {spending.usage.toFixed(0)}%
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="category-progress"
                style={{
                  width: `${spending.barWidth}%`,
                  background: usageColor,
                }}
              />
            </div>

            <p
              className="card-footnote"
              style={{
                marginTop: "10px",
                color: spending.overBudget ? "#bd4343" : undefined,
              }}
            >
              {spending.overBudget
                ? `${formatCurrency(Math.abs(spending.remaining!))} over limit`
                : `${formatCurrency(spending.remaining!)} remaining`}
            </p>
          </>
        ) : (
          <p className="card-footnote" style={{ marginTop: "8px" }}>
            Set a limit to track category spending.
          </p>
        )}

        <div style={{ marginTop: "15px" }}>
          <button
            type="button"
            className="transaction-action-button"
            onClick={() => {
              if (isEditing) {
                cancelEditingCategoryBudget();
              } else {
                startEditingCategoryBudget(categoryName);
              }
            }}
          >
            {isEditing
              ? "Cancel"
              : hasBudget
                ? "Edit limit"
                : "Set limit"}
          </button>
        </div>

        {isEditing && (
          <form
            className="expense-form"
            style={{ marginTop: "14px", gap: "10px" }}
            onSubmit={(event) =>
              void handleCategoryBudgetSubmit(event, categoryName)
            }
          >
            <label>
              Monthly limit (₹)
              <input
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                value={categoryBudgetInput}
                onChange={(event) => {
                  setCategoryBudgetInput(event.target.value);
                  setCategoryBudgetError("");
                  setCategoryBudgetSuccess("");
                }}
                placeholder="e.g. 5000 (0 removes limit)"
                required
              />
            </label>

            <button
              type="submit"
              className="submit-button"
              disabled={isSavingCategoryBudget}
            >
              {isSavingCategoryBudget ? "Saving..." : "Save limit"}
            </button>

            <p
              className="card-footnote"
              style={{ gridColumn: "1 / -1", margin: 0 }}
            >
              Enter 0 to remove this category's limit for the month.
            </p>

            {categoryBudgetError && (
              <p
                className="action-error"
                role="alert"
                style={{ gridColumn: "1 / -1" }}
              >
                {categoryBudgetError}
              </p>
            )}
          </form>
        )}
      </article>
    );
  }

  // Category card in historical reports.
  function renderReportCategoryCard(item: CategoryDatum) {
    const savedBudget = reportCategoryBudgetsByName.get(item.name);
    const limit = savedBudget?.amount ?? null;
    const hasLimit = limit !== null && limit > 0;
    const usedPercentage = hasLimit ? (item.amount / limit) * 100 : null;
    const categoryRemaining = hasLimit ? limit - item.amount : null;
    const overBudget = hasLimit && item.amount > limit;

    return (
      <article className="summary-card" key={item.name}>
        <div className="category-card-heading">
          <div className="category-icon">
            {getCategoryInitial(item.name)}
          </div>
          <div>
            <p>{item.name}</p>
            <span className="card-footnote">
              {item.count} {item.count === 1 ? "transaction" : "transactions"}
            </span>
          </div>
        </div>

        <h2>{formatCurrency(item.amount)}</h2>
        <p className="card-footnote">
          {item.percentage.toFixed(1)}% of this month's spending
        </p>

        {hasLimit ? (
          <>
            <div className="category-item-heading">
              <span>Budget: {formatCurrency(limit)}</span>
              <strong style={{ color: overBudget ? "#bd4343" : "#23865a" }}>
                {usedPercentage!.toFixed(1)}%
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="category-progress"
                style={{
                  width: `${Math.min(usedPercentage!, 100)}%`,
                  background: overBudget ? "#bd4343" : "#23865a",
                }}
              />
            </div>

            <p
              className="card-footnote"
              style={{
                marginTop: "9px",
                color: overBudget ? "#bd4343" : undefined,
              }}
            >
              {overBudget
                ? `${formatCurrency(Math.abs(categoryRemaining!))} over budget`
                : `${formatCurrency(categoryRemaining!)} remaining`}
            </p>
          </>
        ) : (
          <p className="card-footnote" style={{ marginTop: "12px" }}>
            No category budget was saved for this month.
          </p>
        )}
      </article>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#dashboard"
          onClick={(event) => {
            event.preventDefault();
            navigateToOverview();
          }}
          aria-label="SpendWise home"
        >
          <span className="brand-icon">S</span>
          <span>SpendWise</span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="navigation">
          <a
            className={`nav-link ${activePage === "overview" ? "active" : ""}`}
            href="#dashboard"
            onClick={(event) => {
              event.preventDefault();
              navigateToOverview();
            }}
          >
            <span>▦</span> Overview
          </a>

          <a
            className={`nav-link ${
              activePage === "transactions" ? "active" : ""
            }`}
            href="#transactions-page"
            onClick={(event) => {
              event.preventDefault();
              navigateToTransactions();
            }}
          >
            <span>↔</span> Transactions
          </a>

          <a
            className={`nav-link ${activePage === "budgets" ? "active" : ""}`}
            href="#budgets-page"
            onClick={(event) => {
              event.preventDefault();
              navigateToBudgets();
            }}
          >
            <span>◷</span> Budgets
          </a>

          <a
            className={`nav-link ${
              activePage === "categories" ? "active" : ""
            }`}
            href="#categories-page"
            onClick={(event) => {
              event.preventDefault();
              navigateToCategories();
            }}
          >
            <span>◉</span> Categories
          </a>

          <a
            className={`nav-link ${activePage === "reports" ? "active" : ""}`}
            href="#reports-page"
            onClick={(event) => {
              event.preventDefault();
              navigateToReports();
            }}
          >
            <span>▤</span> Reports
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">S</div>
          <div>
            <strong>My Workspace</strong>
            <p>Personal finance</p>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL FINANCE</p>
            <h1>
              {activePage === "overview"
                ? "Overview"
                : activePage === "transactions"
                  ? "Transactions"
                  : activePage === "categories"
                    ? "Categories"
                    : activePage === "budgets"
                      ? "Budgets"
                      : "Reports"}
            </h1>
          </div>

          <span className="demo-badge">
            {loadError || budgetError || categoryBudgetLoadError
              ? "API ERROR"
              : isLoading || isBudgetLoading || isCategoryBudgetsLoading
                ? "CONNECTING..."
                : "LIVE DATA"}
          </span>
        </header>

        {activePage === "overview" ? (
          <>
            <section className="welcome-section">
              <div>
                <p className="eyebrow light">
                  YOUR MONEY, IN PERSPECTIVE
                </p>
                <h2>Know where your money goes.</h2>
                <p>
                  Track spending, stay on budget, and build better
                  financial habits.
                </p>
              </div>
              <div className="welcome-symbol">₹</div>
            </section>

            <section className="summary-grid">
              <article className="summary-card">
                <p>Total spending</p>
                <h2>
                  {isLoading
                    ? "Loading..."
                    : loadError
                      ? "Unavailable"
                      : formatCurrency(totalSpent)}
                </h2>
                <span className="card-footnote">
                  {isLoading
                    ? "Loading transaction data..."
                    : loadError
                      ? "Transaction data could not be loaded"
                      : "Across all recorded transactions"}
                </span>
              </article>

              <article className="summary-card">
                <p>Monthly budget</p>
                <h2>
                  {isBudgetLoading
                    ? "Loading..."
                    : budgetError
                      ? "Unavailable"
                      : formatCurrency(monthlyBudget)}
                </h2>
                {!isBudgetLoading && !budgetError && (
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${budgetBarWidth}%` }}
                    />
                  </div>
                )}
                <span className="card-footnote">
                  {isBudgetLoading
                    ? "Loading budget..."
                    : budgetError
                      ? "Budget data could not be loaded"
                      : `${budgetUsed.toFixed(0)}% of ${currentMonthLabel} budget used`}
                </span>
              </article>

              <article className="summary-card">
                <p>Budget remaining</p>
                <h2
                  className={
                    !isLoading &&
                    !isBudgetLoading &&
                    !loadError &&
                    !budgetError
                      ? remaining < 0
                        ? "negative"
                        : "positive"
                      : undefined
                  }
                >
                  {isLoading || isBudgetLoading
                    ? "Loading..."
                    : loadError || budgetError
                      ? "Unavailable"
                      : formatCurrency(remaining)}
                </h2>
                <span className="card-footnote">
                  {isLoading || isBudgetLoading
                    ? "Loading financial data..."
                    : loadError || budgetError
                      ? "Cannot calculate remaining budget while data is unavailable"
                      : `Based on ${currentMonthLabel} spending`}
                </span>
              </article>
            </section>

            <section className="analytics-grid">
              <article className="panel analytics-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Spending trend</h3>
                    <p>Your spending across the last six months</p>
                  </div>
                  <span className="count-pill">6 months</span>
                </div>

                {isLoading ? (
                  <p className="empty-state">Loading spending trend...</p>
                ) : loadError ? (
                  <p className="empty-state" role="alert">
                    Spending trend is unavailable because transaction data could
                    not be loaded.
                  </p>
                ) : (
                  <>
                    <MonthlyTrendChart data={monthlyTrend} />
                    <p className="chart-footnote">
                      Based on transaction dates. Months without recorded
                      expenses are shown as ₹0.
                    </p>
                  </>
                )}
              </article>

              <article className="panel analytics-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Spending distribution</h3>
                    <p>How spending is divided by category</p>
                  </div>
                </div>

                {isLoading ? (
                  <p className="empty-state">Loading category distribution...</p>
                ) : loadError ? (
                  <p className="empty-state" role="alert">
                    Category distribution is unavailable because transaction
                    data could not be loaded.
                  </p>
                ) : (
                  <CategoryDonutChart
                    data={categoryTotals}
                    total={totalSpent}
                  />
                )}
              </article>
            </section>

            <section className="panel insights-panel">
              <div className="panel-heading">
                <div>
                  <h3>Spending insights</h3>
                  <p>A quick summary of your recorded activity</p>
                </div>
              </div>

              <div className="insights-grid">
                <article className="insight-item">
                  <span className="insight-label">
                    Highest spending category
                  </span>
                  <strong>
                    {isLoading
                      ? "Loading..."
                      : loadError
                        ? "Unavailable"
                        : topCategory?.name ?? "No spending yet"}
                  </strong>
                  <span className="insight-detail">
                    {isLoading
                      ? "Loading transaction data..."
                      : loadError
                        ? "Spending insights are unavailable until transaction data loads"
                        : topCategory
                          ? `${formatCurrency(topCategory.amount)} across all records`
                          : "Add a transaction to get started"}
                  </span>
                </article>

                <article className="insight-item">
                  <span className="insight-label">Average transaction</span>
                  <strong>
                    {isLoading
                      ? "Loading..."
                      : loadError
                        ? "Unavailable"
                        : formatCurrency(averageTransaction)}
                  </strong>
                  <span className="insight-detail">
                    {isLoading
                      ? "Loading transaction data..."
                      : loadError
                        ? "Transaction count is unavailable"
                        : `${transactions.length} recorded ${transactions.length === 1 ? "expense" : "expenses"}`}
                  </span>
                </article>

                <article className="insight-item">
                  <span className="insight-label">Current-month budget</span>
                  <strong
                    className={
                      !isLoading &&
                      !isBudgetLoading &&
                      !loadError &&
                      !budgetError
                        ? remaining < 0
                          ? "negative"
                          : "positive"
                        : undefined
                    }
                  >
                    {isLoading || isBudgetLoading
                      ? "Loading..."
                      : loadError || budgetError
                        ? "Unavailable"
                        : `${budgetUsed.toFixed(1)}% used`}
                  </strong>
                  <span className="insight-detail">
                    {isLoading || isBudgetLoading
                      ? "Loading financial data..."
                      : loadError || budgetError
                        ? "Budget insight unavailable until financial data loads"
                        : remaining < 0
                          ? `${formatCurrency(Math.abs(remaining))} over budget`
                          : `${formatCurrency(remaining)} remaining`}
                  </span>
                </article>
              </div>
            </section>

            <section className="content-grid">
              <article className="panel" id="transactions-preview">
                <div className="panel-heading">
                  <div>
                    <h3>Recent transactions</h3>
                    <p>Your latest recorded expenses</p>
                  </div>
                  <button
                    type="button"
                    className="transaction-action-button"
                    onClick={navigateToTransactions}
                  >
                    View all
                  </button>
                </div>

                {actionError && (
                  <p className="action-error" role="alert">
                    {actionError}
                  </p>
                )}

                {isLoading ? (
                  <p className="empty-state">Loading transactions...</p>
                ) : loadError ? (
                  <p className="empty-state" role="alert">
                    Unable to load transactions: {loadError}
                  </p>
                ) : latestTransactions.length === 0 ? (
                  <p className="empty-state">
                    No transactions yet. Add your first expense.
                  </p>
                ) : (
                  <div className="transaction-list">
                    {latestTransactions.slice(0, 6).map(renderTransactionRow)}
                  </div>
                )}

                {renderEditForm()}
              </article>

              <article className="panel" id="categories-preview">
                <div className="panel-heading">
                  <div>
                    <h3>Spending by category</h3>
                    <p>Where your money is going</p>
                  </div>
                  <button
                    type="button"
                    className="transaction-action-button"
                    onClick={navigateToCategories}
                  >
                    View all
                  </button>
                </div>

                {isLoading ? (
                  <p className="empty-state">Loading category spending...</p>
                ) : loadError ? (
                  <p className="empty-state" role="alert">
                    Category spending is unavailable because transaction data
                    could not be loaded.
                  </p>
                ) : categoryTotals.length === 0 ? (
                  <p className="empty-state">
                    Category spending will appear here after you add transactions.
                  </p>
                ) : (
                  <div className="category-list">
                    {categoryTotals.map((item) => (
                      <div className="category-item" key={item.name}>
                        <div className="category-item-heading">
                          <span>{item.name}</span>
                          <strong>{formatCurrency(item.amount)}</strong>
                        </div>
                        <div className="progress-track">
                          <div
                            className="category-progress"
                            style={{
                              width: `${
                                totalSpent > 0
                                  ? (item.amount / totalSpent) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <section className="panel add-expense-panel">
              <div className="panel-heading">
                <div>
                  <h3>Add an expense</h3>
                  <p>Record a purchase or payment</p>
                </div>
              </div>

              <form className="expense-form" onSubmit={handleSubmit}>
                <label>
                  Description
                  <input
                    type="text"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="e.g. Lunch"
                    maxLength={150}
                    required
                  />
                </label>

                <label>
                  Amount (₹)
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="250"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(event) => setTransactionDate(event.target.value)}
                    required
                  />
                </label>

                {submitError && (
                  <p className="action-error" role="alert">
                    {submitError}
                  </p>
                )}

                <button
                  className="submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "+ Add expense"}
                </button>
              </form>
            </section>
          </>
        ) : activePage === "transactions" ? (
          <section className="panel" id="transactions-page">
            <div className="panel-heading">
              <div>
                <h3>All transactions</h3>
                <p>Search, filter, edit, and manage your expenses.</p>
              </div>
              <span className="count-pill">
                {filteredTransactions.length} of {transactions.length}
              </span>
            </div>

            {actionError && (
              <p className="action-error" role="alert">
                {actionError}
              </p>
            )}

            <form
              className="expense-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label>
                Search description
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="e.g. Lunch, groceries..."
                />
              </label>

              <label>
                Category
                <select
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                >
                  <option value="All categories">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                From date
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>

              <label>
                To date
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="cancel-button"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </form>

            <p className="card-footnote">
              {hasActiveFilters
                ? `Showing ${filteredTransactions.length} matching transaction(s).`
                : `Showing all ${transactions.length} transaction(s), newest first.`}
            </p>

            {isLoading ? (
              <p className="empty-state">Loading transactions...</p>
            ) : loadError ? (
              <p className="empty-state" role="alert">
                Unable to load transactions: {loadError}
              </p>
            ) : filteredTransactions.length === 0 ? (
              <p className="empty-state">
                {transactions.length === 0
                  ? "No transactions recorded yet."
                  : "No transactions match these filters. Try changing or clearing them."}
              </p>
            ) : (
              <div className="transaction-list">
                {filteredTransactions.map(renderTransactionRow)}
              </div>
            )}

            {renderEditForm()}
          </section>
        ) : activePage === "categories" ? (
          <section className="panel" id="categories-page">
            <div className="panel-heading">
              <div>
                <h3>Category breakdown</h3>
                <p>
                  See how your expenses are distributed across categories.
                </p>
              </div>
              <span className="count-pill">{categories.length} categories</span>
            </div>

            <section className="summary-grid">
              <article className="summary-card">
                <p>Total spending</p>
                <h2>{formatCurrency(totalSpent)}</h2>
                <span className="card-footnote">
                  Across all recorded transactions
                </span>
              </article>

              <article className="summary-card">
                <p>Categories used</p>
                <h2>
                  {categoriesInUse} / {categories.length}
                </h2>
                <span className="card-footnote">
                  Categories with saved transactions
                </span>
              </article>

              <article className="summary-card">
                <p>Highest spending category</p>
                <h2>{topCategory?.name ?? "None yet"}</h2>
                <span className="card-footnote">
                  {topCategory
                    ? formatCurrency(topCategory.amount)
                    : "Add an expense to get started"}
                </span>
              </article>
            </section>

            <div className="summary-grid">
              {categoryBreakdown.map((item) => (
                <article className="summary-card" key={item.name}>
                  <div className="category-card-heading">
                    <div className="category-icon">
                      {getCategoryInitial(item.name)}
                    </div>
                    <div>
                      <p>{item.name}</p>
                      <span className="card-footnote">
                        {item.count}{" "}
                        {item.count === 1 ? "transaction" : "transactions"}
                      </span>
                    </div>
                  </div>

                  <h2>{formatCurrency(item.amount)}</h2>
                  <div className="progress-track">
                    <div
                      className="category-progress"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="card-footnote">
                    {item.percentage.toFixed(1)}% of total spending
                  </span>

                  <div className="category-card-action">
                    <button
                      type="button"
                      className="transaction-action-button"
                      onClick={() => openCategoryTransactions(item.name)}
                    >
                      View transactions
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {!isLoading && !loadError && transactions.length === 0 && (
              <p className="empty-state">
                No expenses recorded yet. Add an expense from Overview
                to build your category breakdown.
              </p>
            )}
          </section>
        ) : activePage === "budgets" ? (
          <section id="budgets-page">
            <section className="welcome-section">
              <div>
                <p className="eyebrow light">YOUR MONTHLY PLAN</p>
                <h2>Give your money a purpose.</h2>
                <p>
                  Set an overall spending limit and category limits for{" "}
                  {currentMonthLabel}.
                </p>
              </div>
              <div className="welcome-symbol">₹</div>
            </section>

            <section className="summary-grid">
              <article className="summary-card">
                <p>Overall monthly budget</p>
                <h2>{formatCurrency(monthlyBudget)}</h2>
                <span className="card-footnote">
                  {isBudgetLoading
                    ? "Loading saved budget..."
                    : `Saved for ${currentMonthLabel}`}
                </span>
              </article>

              <article className="summary-card">
                <p>Spent this month</p>
                <h2>{formatCurrency(monthlySpent)}</h2>
                <span className="card-footnote">
                  {currentMonthTransactions.length} transactions this month
                </span>
              </article>

              <article className="summary-card">
                <p>Overall budget remaining</p>
                <h2 className={remaining < 0 ? "negative" : "positive"}>
                  {formatCurrency(remaining)}
                </h2>
                <span className="card-footnote">
                  {remaining < 0
                    ? "You have exceeded this month's budget."
                    : "Amount remaining for this month"}
                </span>
              </article>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Set your overall monthly budget</h3>
                  <p>Choose your spending limit for {currentMonthLabel}.</p>
                </div>
              </div>

              <form className="expense-form" onSubmit={handleBudgetSubmit}>
                <label>
                  Budget amount (₹)
                  <input
                    type="number"
                    min="0.01"
                    max="9999999999.99"
                    step="0.01"
                    value={budgetAmountInput}
                    onChange={(event) => {
                      setBudgetAmountInput(event.target.value);
                      setBudgetError("");
                      setBudgetSuccess("");
                    }}
                    required
                  />
                </label>

                <button
                  className="submit-button"
                  type="submit"
                  disabled={isSavingBudget || isBudgetLoading}
                >
                  {isSavingBudget ? "Saving..." : "Save overall budget"}
                </button>
              </form>

              {budgetError && (
                <p className="action-error" role="alert">
                  {budgetError}
                </p>
              )}
              {budgetSuccess && (
                <p className="budget-success" role="status">
                  {budgetSuccess}
                </p>
              )}

              <div className="budget-progress-section">
                <div className="category-item-heading">
                  <span>Overall budget used</span>
                  <strong>{budgetUsed.toFixed(1)}%</strong>
                </div>
                <div className="progress-track budget-large-progress">
                  <div
                    className="progress-fill"
                    style={{ width: `${budgetBarWidth}%` }}
                  />
                </div>
                <p className="card-footnote" style={{ marginTop: "9px" }}>
                  {formatCurrency(monthlySpent)} spent out of{" "}
                  {formatCurrency(monthlyBudget)} for {currentMonthLabel}.
                </p>
              </div>
            </section>

            <section className="panel" style={{ marginTop: "20px" }}>
              <div className="panel-heading">
                <div>
                  <h3>Category-wise budgets</h3>
                  <p>
                    Individual spending limits saved for the current month.
                  </p>
                </div>
                <span className="count-pill">
                  {categoryBudgets.length} limits set
                </span>
              </div>

              {categoryBudgetLoadError && (
                <p className="action-error" role="alert">
                  {categoryBudgetLoadError}
                </p>
              )}
              {categoryBudgetSuccess && (
                <p className="budget-success" role="status">
                  {categoryBudgetSuccess}
                </p>
              )}

              {isCategoryBudgetsLoading ? (
                <p className="empty-state">Loading category budgets...</p>
              ) : (
                <>
                  <div className="summary-grid">
                    {categories.map(renderCategoryBudgetCard)}
                  </div>
                  <p className="card-footnote">
                    Enter 0 to remove a category's limit. Categories without a
                    limit still count toward the overall budget.
                  </p>
                </>
              )}
            </section>

            <section className="panel budget-transactions-panel">
              <div className="panel-heading">
                <div>
                  <h3>This month's transactions</h3>
                  <p>Expenses counted toward this month's budget.</p>
                </div>
                <button
                  type="button"
                  className="transaction-action-button"
                  onClick={navigateToTransactions}
                >
                  View all
                </button>
              </div>

              {actionError && (
                <p className="action-error" role="alert">
                  {actionError}
                </p>
              )}

              {isLoading ? (
                <p className="empty-state">Loading transactions...</p>
              ) : loadError ? (
                <p className="empty-state" role="alert">
                  Unable to load transactions: {loadError}
                </p>
              ) : currentMonthTransactions.length === 0 ? (
                <p className="empty-state">
                  No transactions dated in {currentMonthLabel} yet.
                </p>
              ) : (
                <div className="transaction-list">
                  {[...currentMonthTransactions]
                    .sort((a, b) => b.id - a.id)
                    .map(renderTransactionRow)}
                </div>
              )}

              {renderEditForm()}
            </section>
          </section>
        ) : (
          <section id="reports-page">
            <section className="welcome-section">
              <div>
                <p className="eyebrow light">YOUR FINANCIAL SUMMARY</p>
                <h2>Understand your spending.</h2>
                <p>
                  Review monthly expenses, compare budgets, and export your
                  report.
                </p>
              </div>
              <div className="welcome-symbol">₹</div>
            </section>

            <section className="panel" style={{ marginTop: "20px" }}>
              <div className="panel-heading">
                <div>
                  <h3>Monthly report</h3>
                  <p>
                    Select a month to review its transactions and budget
                    performance.
                  </p>
                </div>
              </div>

              <form
                className="expense-form"
                onSubmit={(event) => event.preventDefault()}
              >
                <label>
                  Report month
                  <input
                    type="month"
                    value={reportMonth}
                    max={currentMonth}
                    onChange={(event) => setReportMonth(event.target.value)}
                    required
                  />
                </label>

                <button
                  type="button"
                  className="submit-button"
                  onClick={exportMonthlyReport}
                  disabled={
                    isLoading ||
                    isReportDataLoading ||
                    reportTransactions.length === 0
                  }
                >
                  Export monthly CSV
                </button>
              </form>

              <p className="card-footnote" style={{ marginTop: "10px" }}>
                The CSV includes the monthly summary, category budget
                performance, and detailed transactions.
              </p>
            </section>

            {actionError && (
              <p className="action-error" role="alert">
                {actionError}
              </p>
            )}

            {loadError && (
              <p className="action-error" role="alert">
                Transaction data could not be loaded: {loadError}
              </p>
            )}

            {reportDataError && (
              <p className="action-error" role="alert">
                Budget data could not be fully loaded: {reportDataError}
              </p>
            )}

            {isLoading || isReportDataLoading ? (
              <section className="panel" style={{ marginTop: "20px" }}>
                <p className="empty-state">
                  Loading report data for {formatMonth(reportMonth)}...
                </p>
              </section>
            ) : (
              <>
                <section className="summary-grid">
                  <article className="summary-card">
                    <p>Total spending</p>
                    <h2>{formatCurrency(reportTotalSpent)}</h2>
                    <span className="card-footnote">
                      {formatMonth(reportMonth)}
                    </span>
                  </article>

                  <article className="summary-card">
                    <p>Transactions</p>
                    <h2>{reportTransactions.length}</h2>
                    <span className="card-footnote">
                      Average: {formatCurrency(reportAverage)}
                    </span>
                  </article>

                  <article className="summary-card">
                    <p>Overall monthly budget</p>
                    <h2>
                      {reportBudgetAmount === null
                        ? "Not saved"
                        : formatCurrency(reportBudgetAmount)}
                    </h2>
                    <span className="card-footnote">
                      {reportBudgetUsed === null
                        ? "No overall budget saved for this month"
                        : `${reportBudgetUsed.toFixed(1)}% used`}
                    </span>
                  </article>
                </section>

                <section className="panel" style={{ marginTop: "20px" }}>
                  <div className="panel-heading">
                    <div>
                      <h3>Overall budget performance</h3>
                      <p>
                        {formatMonth(reportMonth)} spending compared with its
                        saved budget.
                      </p>
                    </div>
                  </div>

                  {reportBudgetAmount === null ? (
                    <p className="empty-state">
                      No overall budget was saved for this month, so budget
                      performance cannot be calculated reliably.
                    </p>
                  ) : (
                    <>
                      <div className="category-item-heading">
                        <span>Spent: {formatCurrency(reportTotalSpent)}</span>
                        <strong
                          style={{
                            color:
                              reportBudgetRemaining! < 0
                                ? "#bd4343"
                                : "#23865a",
                          }}
                        >
                          {reportBudgetUsed!.toFixed(1)}% used
                        </strong>
                      </div>

                      <div className="progress-track budget-large-progress">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(
                              Math.max(reportBudgetUsed!, 0),
                              100
                            )}%`,
                            background:
                              reportBudgetRemaining! < 0
                                ? "#bd4343"
                                : undefined,
                          }}
                        />
                      </div>

                      <p className="card-footnote" style={{ marginTop: "10px" }}>
                        {reportBudgetRemaining! < 0
                          ? `${formatCurrency(
                              Math.abs(reportBudgetRemaining!)
                            )} over budget`
                          : `${formatCurrency(
                              reportBudgetRemaining!
                            )} remaining out of ${formatCurrency(
                              reportBudgetAmount
                            )}`}
                      </p>
                    </>
                  )}
                </section>

                <section className="panel" style={{ marginTop: "20px" }}>
                  <div className="panel-heading">
                    <div>
                      <h3>Category report</h3>
                      <p>
                        Spending and saved category limits for{" "}
                        {formatMonth(reportMonth)}.
                      </p>
                    </div>

                    <span className="count-pill">
                      {reportConfiguredCategoryLimits.length} limits set
                    </span>
                  </div>

                  {reportConfiguredCategoryLimits.length > 0 && (
                    <p
                      className="card-footnote"
                      style={{ marginBottom: "15px" }}
                    >
                      {reportCategoriesOverBudget}{" "}
                      {reportCategoriesOverBudget === 1
                        ? "category exceeds"
                        : "categories exceed"}{" "}
                      its saved limit.
                    </p>
                  )}

                  <div className="summary-grid">
                    {reportCategoryBreakdown.map(renderReportCategoryCard)}
                  </div>

                  <p className="card-footnote">
                    Category totals use transactions dated in the selected
                    month. Missing limits are shown as not configured.
                  </p>
                </section>

                <section className="panel" style={{ marginTop: "20px" }}>
                  <div className="panel-heading">
                    <div>
                      <h3>Transactions in {formatMonth(reportMonth)}</h3>
                      <p>
                        {reportTransactions.length} recorded{" "}
                        {reportTransactions.length === 1
                          ? "transaction"
                          : "transactions"}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="submit-button"
                      onClick={exportMonthlyReport}
                      disabled={reportTransactions.length === 0}
                    >
                      Export CSV
                    </button>
                  </div>

                  {reportTransactions.length === 0 ? (
                    <p className="empty-state">
                      No transactions were recorded in {formatMonth(reportMonth)}.
                      Choose a different month to view its report.
                    </p>
                  ) : (
                    <div className="transaction-list">
                      {reportTransactions.map(renderTransactionRow)}
                    </div>
                  )}

                  {renderEditForm()}
                </section>
              </>
            )}
          </section>
        )}

        <footer className="footer">
          SpendWise · Personal finance, made clearer.
        </footer>
      </main>
    </div>
  );
}

export default App;
