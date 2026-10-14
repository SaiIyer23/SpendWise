
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const CURRENT_BUDGET_URL = `${API_BASE_URL}/api/budgets/current`;
const CATEGORY_BUDGETS_URL =
  `${API_BASE_URL}/api/budgets/categories/current`;

export type MonthlyBudget = {
  month: string;
  amount: number;
};

export type CategoryBudget = {
  month: string;
  category: string;
  amount: number;
};

async function readError(response: Response): Promise<string> {
  const message = await response.text();

  return message || `Budget request failed (HTTP ${response.status})`;
}

export async function getCurrentBudget(): Promise<MonthlyBudget> {
  const response = await fetch(CURRENT_BUDGET_URL);

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<MonthlyBudget>;
}

export async function updateCurrentBudget(
  amount: number
): Promise<MonthlyBudget> {
  const response = await fetch(CURRENT_BUDGET_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<MonthlyBudget>;
}

export async function getCurrentCategoryBudgets(): Promise<CategoryBudget[]> {
  const response = await fetch(CATEGORY_BUDGETS_URL);

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<CategoryBudget[]>;
}

export async function updateCurrentCategoryBudget(
  category: string,
  amount: number
): Promise<CategoryBudget> {
  const response = await fetch(CATEGORY_BUDGETS_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category, amount }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<CategoryBudget>;
}

/**
 * Retrieve a budget saved for any selected month.
 * A 404 means the month has no saved overall budget.
 */
export async function getBudgetForMonth(
  month: string
): Promise<MonthlyBudget | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/budgets?month=${encodeURIComponent(month)}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<MonthlyBudget>;
}

/**
 * Retrieve category limits saved for any selected month.
 */
export async function getCategoryBudgetsForMonth(
  month: string
): Promise<CategoryBudget[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/budgets/categories?month=${encodeURIComponent(month)}`
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<CategoryBudget[]>;
}
