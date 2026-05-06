// ═══════════════════════════════════════════════════════════════════════
// TIPOS DO BANCO — espelha o schema SQL da Etapa 1
// ═══════════════════════════════════════════════════════════════════════

export type AccountType = 'PJ' | 'PF';
export type TransactionType = 'credit' | 'debit';
export type StatementStatus = 'processing' | 'completed' | 'failed';

export interface Account {
  id: string;
  name: string;
  bank: string;
  type: AccountType;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Statement {
  id: string;
  account_id: string;
  file_name: string;
  period_start: string;       // ISO date
  period_end: string;
  total_credits: number;
  total_debits: number;
  transaction_count: number;
  status: StatementStatus;
  error_message: string | null;
  imported_at: string;
}

export interface Transaction {
  id: string;
  statement_id: string;
  account_id: string;
  date: string;                // ISO date
  description: string;
  amount: number;              // sempre positivo
  type: TransactionType;
  category: string | null;
  counterparty: string | null;
  metadata: Record<string, unknown>;
  raw_text: string | null;
  edited_by_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  usage_count: number;
  color: string | null;
  created_at: string;
}

// ─── TIPOS DERIVADOS PARA INSERTS ──────────────────────────────────────
export type StatementInsert = Omit<
  Statement,
  'id' | 'imported_at' | 'total_credits' | 'total_debits' | 'transaction_count'
> & {
  total_credits?: number;
  total_debits?: number;
  transaction_count?: number;
};

export type TransactionInsert = Omit<
  Transaction,
  'id' | 'created_at' | 'updated_at' | 'metadata' | 'edited_by_user'
> & {
  metadata?: Record<string, unknown>;
  edited_by_user?: boolean;
};
