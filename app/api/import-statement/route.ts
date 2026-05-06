// ═══════════════════════════════════════════════════════════════════════
// API ROUTE: POST /api/import-statement
//
// Recebe: multipart/form-data com `file` (PDF) e `account_id`
// Retorna: JSON com transações extraídas (preview, ainda não salva no banco)
//
// IMPORTANTE: o salvamento no banco é feito em outra rota (/api/save-statement)
// só depois que o usuário revisar o preview. Isso evita persistir lixo.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText, looksLikeBradescoPj } from '@/lib/pdf/parse';
import { extractTransactionsFromPdfText } from '@/lib/ai/extract';
import { createServerClient } from '@/lib/supabase/server';

// Permite até 60s no Vercel Pro / 10s no Hobby
export const maxDuration = 60;
export const runtime = 'nodejs'; // pdf-parse precisa de Node, não Edge

export async function POST(req: NextRequest) {
  try {
    // ─── 1. PARSE DO FORM ──────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const accountId = formData.get('account_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }
    if (!accountId) {
      return NextResponse.json({ error: 'account_id obrigatório' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são aceitos' },
        { status: 400 },
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF acima de 10MB' }, { status: 400 });
    }

    // ─── 2. VALIDA QUE A CONTA EXISTE ──────────────────────────────────
    const supabase = createServerClient();
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // ─── 3. EXTRAI TEXTO DO PDF ────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await extractPdfText(buffer);

    if (parsed.charCount < 100) {
      return NextResponse.json(
        { error: 'PDF sem texto extraível. É um PDF escaneado? Tente outro extrato.' },
        { status: 422 },
      );
    }

    // Heurística leve para alertar caso o usuário suba o PDF errado
    const looksValid = looksLikeBradescoPj(parsed.text);

    // ─── 4. EXTRAI TRANSAÇÕES VIA IA ───────────────────────────────────
    const extraction = await extractTransactionsFromPdfText(parsed.text);

    // ─── 5. CHECA SE JÁ EXISTE STATEMENT NO MESMO PERÍODO ──────────────
    const { data: existing } = await supabase
      .from('statements')
      .select('id, file_name, imported_at')
      .eq('account_id', accountId)
      .eq('period_start', extraction.period_start)
      .eq('period_end', extraction.period_end)
      .maybeSingle();

    // ─── 6. RETORNA PREVIEW ────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        name: account.name,
        bank: account.bank,
      },
      file_name: file.name,
      extraction,
      pdf_meta: {
        pages: parsed.pages,
        char_count: parsed.charCount,
        looks_valid: looksValid,
      },
      duplicate_warning: existing
        ? {
            existing_statement_id: existing.id,
            existing_file_name: existing.file_name,
            imported_at: existing.imported_at,
          }
        : null,
    });
  } catch (err) {
    console.error('[import-statement] erro:', err);
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao processar extrato', detail: message },
      { status: 500 },
    );
  }
}
