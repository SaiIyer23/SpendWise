
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type Transaction = {
  id: number;
  description: string;
  amount: number;
  category: string;
  transactionDate: string;
  notes: string | null;
};

export type CreateTransactionRequest = {
  description: string;
  amount: number;
  category: string;
  transactionDate: string;
  notes: string | null;
};

// Updating a transaction uses the same fields as creating one.
export type UpdateTransactionRequest = {
  description: string;
  amount: number;
  category: string;
  transactionDate: string;
  notes: string | null;
};

const TRANSACTIONS_URL = `${API_BASE_URL}/api/transactions`;

export async function getTransactions(): Promise<Transaction[]> {
  const response = await fetch(TRANSACTIONS_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to load transactions (HTTP ${response.status})`
    );
  }

  return response.json() as Promise<Transaction[]>;
}

export async function createTransaction(
  request: CreateTransactionRequest
): Promise<Transaction> {
  const response = await fetch(TRANSACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Failed to create transaction (HTTP ${response.status})`
    );
  }

  return response.json() as Promise<Transaction>;
}

// Update an existing transaction using its ID.
export async function updateTransaction(
  id: number,
  request: UpdateTransactionRequest
): Promise<Transaction> {
  const response = await fetch(`${TRANSACTIONS_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Failed to update transaction (HTTP ${response.status})`
    );
  }

  return response.json() as Promise<Transaction>;
}

// Delete an existing transaction using its ID.
export async function deleteTransaction(id: number): Promise<void> {
  const response = await fetch(`${TRANSACTIONS_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Failed to delete transaction (HTTP ${response.status})`
    );
  }
}
