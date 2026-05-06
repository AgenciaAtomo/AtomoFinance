// ═══════════════════════════════════════════════════════════════════════
// Extração de transações via Claude API.
// Usa o SDK oficial @anthropic-ai/sdk e valida saída com Zod.
// ═══════════════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt';

// ─── SCHEMA DE VALIDAÇÃO ───────────────────────────────────────────────
const ExtractedTransaction = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  description: z.string().min(1),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['credit', 'debit']),
  counterparty: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  raw_text: z.string().nullable().default(null),
});

const ExtractionResult = z.object({
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  account_holder: z.string(),
  bank_detected: z.string(),
  transactions: z.array(ExtractedTransaction),
});

export type ExtractedTransactionT = z.infer<typeof ExtractedTransaction>;
export type ExtractionResultT = z.infer<typeof ExtractionResult>;

// ─── CHAMADA AO CLAUDE ─────────────────────────────────────────────────
export async function extractTransactionsFromPdfText(
  pdfText: string,
): Promise<ExtractionResultT> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(pdfText) }],
  });

  // Pega o primeiro bloco de texto da resposta
  const textBlock = response.content.find((c) => c.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude não retornou conteúdo textual');
  }

  const rawJson = textBlock.text.trim();

  // Tenta limpar caso o modelo escorregue e devolva ```json ... ```
  const cleaned = rawJson
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      `Resposta da IA não é JSON válido. Início: ${cleaned.slice(0, 200)}...`,
    );
  }

  // Valida com Zod
  const result = ExtractionResult.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `JSON da IA não passou na validação: ${JSON.stringify(result.error.issues, null, 2)}`,
    );
  }

  return result.data;
}
