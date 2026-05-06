'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Trash2,
  Save,
} from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import type { Account } from '@/types/database';

type EditableTransaction = {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  counterparty: string | null;
  category: string | null;
  raw_text: string | null;
  edited_by_user: boolean;
};

type ExtractionPayload = {
  account: { id: string; name: string; bank: string };
  file_name: string;
  extraction: {
    period_start: string;
    period_end: string;
    account_holder: string;
    bank_detected: string;
    transactions: EditableTransaction[];
  };
  pdf_meta: { pages: number; char_count: number; looks_valid: boolean };
  duplicate_warning: {
    existing_statement_id: string;
    existing_file_name: string;
    imported_at: string;
  } | null;
};

const LOADING_MESSAGES = [
  'Lendo o PDF…',
  'Extraindo transações…',
  'Categorizando com IA…',
  'Quase lá…',
];

export default function ImportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExtractionPayload | null>(null);
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Carrega contas
  useEffect(() => {
    const supabase = getBrowserClient();
    supabase
      .from('accounts')
      .select('*')
      .eq('active', true)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setAccounts(data as Account[]);
          if (data.length > 0) setAccountId(data[0].id);
        }
      });
  }, []);

  // Anima as mensagens de loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  // ─── HANDLERS ──────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === 'application/pdf') setFile(dropped);
  };

  const handleSubmit = async () => {
    if (!file || !accountId) return;
    setLoading(true);
    setError(null);
    setLoadingMsgIdx(0);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('account_id', accountId);

      const res = await fetch('/api/import-statement', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || json.error || 'Falha ao processar');
      }

      setPreview(json);
      setTransactions(json.extraction.transactions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const updateTx = (idx: number, patch: Partial<EditableTransaction>) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, ...patch, edited_by_user: true } : t)),
    );
  };

  const removeTx = (idx: number) => {
    setTransactions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/save-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: preview.account.id,
          file_name: preview.file_name,
          period_start: preview.extraction.period_start,
          period_end: preview.extraction.period_end,
          transactions,
          replace_existing: !!preview.duplicate_warning,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error);

      setSavedOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setTransactions([]);
    setError(null);
    setSavedOk(false);
  };

  // ─── TOTAIS ────────────────────────────────────────────────────────
  const totalCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);
  const net = totalCredits - totalDebits;

  // ─── RENDER ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen">
      <header className="px-6 py-4 border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-primary">
            <ArrowLeft size={18} />
            <span className="font-heading font-bold text-primary">Átomo Finance</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-heading font-bold mb-1">Importar extrato</h1>
        <p className="text-muted mb-8">
          Selecione a conta e envie o PDF — a IA cuida do resto.
        </p>

        {/* ─── ESTADO: SUCESSO ─────────────────────────────── */}
        {savedOk && (
          <div className="card border-accent bg-surface-alt text-center py-12">
            <CheckCircle2 size={48} className="mx-auto text-accent mb-4" />
            <h2 className="text-xl font-heading font-bold mb-2">
              Extrato salvo com sucesso
            </h2>
            <p className="text-muted mb-6">{transactions.length} transações importadas.</p>
            <button onClick={reset} className="btn-primary">
              Importar outro
            </button>
          </div>
        )}

        {/* ─── ESTADO: PROCESSANDO ─────────────────────────── */}
        {loading && !savedOk && (
          <div className="card text-center py-16">
            <Loader2 size={48} className="mx-auto text-accent mb-4 animate-spin" />
            <p className="text-lg font-heading font-medium">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
            <p className="text-sm text-muted mt-2">
              Isso costuma levar entre 5 e 10 segundos.
            </p>
          </div>
        )}

        {/* ─── ESTADO: UPLOAD ──────────────────────────────── */}
        {!preview && !loading && !savedOk && (
          <div className="card max-w-2xl">
            <label className="block text-sm font-medium mb-2">Conta</label>
            <select
              className="input mb-6"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.length === 0 && <option>Nenhuma conta cadastrada</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-2">Arquivo PDF</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-accent bg-surface-alt' : 'border-border'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={24} className="text-accent" />
                  <span className="font-medium">{file.name}</span>
                  <button
                    onClick={() => setFile(null)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-muted mb-2" />
                  <p className="text-muted mb-2">Arraste o PDF aqui</p>
                  <label className="btn-ghost cursor-pointer inline-flex">
                    Ou escolha o arquivo
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-danger text-danger text-sm flex gap-2">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || !accountId || loading}
              className="btn-primary mt-6 w-full"
            >
              <Upload size={18} />
              Analisar com IA
            </button>
          </div>
        )}

        {/* ─── ESTADO: PREVIEW ─────────────────────────────── */}
        {preview && !loading && !savedOk && (
          <>
            {/* Aviso de duplicata */}
            {preview.duplicate_warning && (
              <div className="card border-warning bg-yellow-50 mb-6 flex gap-3">
                <AlertTriangle className="text-warning shrink-0" size={20} />
                <div>
                  <p className="font-medium">Esse período já foi importado antes</p>
                  <p className="text-sm text-muted">
                    Arquivo: {preview.duplicate_warning.existing_file_name} ·{' '}
                    Importado em{' '}
                    {new Date(preview.duplicate_warning.imported_at).toLocaleDateString(
                      'pt-BR',
                    )}
                    . Ao salvar, o registro anterior será substituído.
                  </p>
                </div>
              </div>
            )}

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="card">
                <div className="text-xs text-muted">Conta</div>
                <div className="font-heading font-semibold">{preview.account.name}</div>
              </div>
              <div className="card">
                <div className="text-xs text-muted">Período</div>
                <div className="font-heading font-semibold">
                  {formatDate(preview.extraction.period_start)} →{' '}
                  {formatDate(preview.extraction.period_end)}
                </div>
              </div>
              <div className="card">
                <div className="text-xs text-muted">Entradas</div>
                <div className="font-heading font-semibold text-accent">
                  + {formatBRL(totalCredits)}
                </div>
              </div>
              <div className="card">
                <div className="text-xs text-muted">Saídas</div>
                <div className="font-heading font-semibold text-danger">
                  − {formatBRL(totalDebits)}
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-lg">
                  {transactions.length} transações encontradas
                </h2>
                <span className="text-sm text-muted">Saldo do período: {formatBRL(net)}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 px-2 font-medium">Data</th>
                      <th className="py-2 px-2 font-medium">Descrição</th>
                      <th className="py-2 px-2 font-medium">Contraparte</th>
                      <th className="py-2 px-2 font-medium">Categoria</th>
                      <th className="py-2 px-2 font-medium text-right">Valor</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr key={idx} className="border-b border-border last:border-0">
                        <td className="py-2 px-2 whitespace-nowrap">
                          <input
                            type="date"
                            value={t.date}
                            onChange={(e) => updateTx(idx, { date: e.target.value })}
                            className="input text-xs py-1"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={t.description}
                            onChange={(e) =>
                              updateTx(idx, { description: e.target.value })
                            }
                            className="input text-xs py-1"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={t.counterparty ?? ''}
                            onChange={(e) =>
                              updateTx(idx, { counterparty: e.target.value || null })
                            }
                            className="input text-xs py-1"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={t.category ?? ''}
                            onChange={(e) =>
                              updateTx(idx, { category: e.target.value || null })
                            }
                            className="input text-xs py-1"
                          />
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap font-mono">
                          <span
                            className={t.type === 'credit' ? 'text-accent' : 'text-danger'}
                          >
                            {t.type === 'credit' ? '+' : '−'} {formatBRL(t.amount)}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => removeTx(idx)}
                            className="text-muted hover:text-danger"
                            title="Remover transação"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && (
              <div className="card border-danger bg-red-50 mb-6 flex gap-3">
                <AlertTriangle className="text-danger" size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset} className="btn-ghost">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || transactions.length === 0}
                className="btn-primary flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Salvando…
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Confirmar e salvar {transactions.length} transações
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────
function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
