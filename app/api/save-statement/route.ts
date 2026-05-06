// ═══════════════════════════════════════════════════════════════════════
// API ROUTE: POST /api/save-statement
//
// Recebe: JSON com statement + transações (já editadas pelo usuário no preview)
// Faz: cria statement, insere transações em batch, retorna IDs criados
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ─── SCHEMA DE INPUT ────────────────────────────────────────────────────
const SaveTransaction = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['credit', 'debit']),
  counterparty: z.string().nullable(),
  category: z.string().nullable(),
  raw_text: z.string().nullable(),
  edited_by_user: z.boolean().default(false),
});

const SaveBody = z.object({
  account_id: z.string().uuid(),
  file_name: z.string(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transactions: z.array(SaveTransaction).min(1),
  replace_existing: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = SaveBody.safeParse(json);

    if (!body.success) {
      return NextResponse.json(
        { error: 'Body inválido', issues: body.error.issues },
        { status: 400 },
      );
    }

    const supabase = createServerClient();
    const data = body.data;

    // ─── 1. SE replace_existing, deleta statement antigo do mesmo período ───
    if (data.replace_existing) {
      await supabase
        .from('statements')
        .delete()
        .eq('account_id', data.account_id)
        .eq('period_start', data.period_start)
        .eq('period_end', data.period_end);
    }

    // ─── 2. CRIA STATEMENT ────────────────────────────────────────────────
    const { data: statement, error: stmtError } = await supabase
      .from('statements')
      .insert({
        account_id: data.account_id,
        file_name: data.file_name,
        period_start: data.period_start,
        period_end: data.period_end,
        status: 'completed',
      })
      .select()
      .single();

    if (stmtError || !statement) {
      return NextResponse.json(
        { error: 'Falha ao criar statement', detail: stmtError?.message },
        { status: 500 },
      );
    }

    // ─── 3. INSERE TRANSAÇÕES EM BATCH ────────────────────────────────────
    const rows = data.transactions.map((t) => ({
      statement_id: statement.id,
      account_id: data.account_id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      counterparty: t.counterparty,
      category: t.category,
      raw_text: t.raw_text,
      edited_by_user: t.edited_by_user,
    }));

    const { error: txError } = await supabase.from('transactions').insert(rows);

    if (txError) {
      // Rollback: apaga statement criado
      await supabase.from('statements').delete().eq('id', statement.id);
      return NextResponse.json(
        { error: 'Falha ao inserir transações', detail: txError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      statement_id: statement.id,
      transactions_saved: rows.length,
    });
  } catch (err) {
    console.error('[save-statement] erro:', err);
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao salvar', detail: message },
      { status: 500 },
    );
  }
}
