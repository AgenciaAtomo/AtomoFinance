// ═══════════════════════════════════════════════════════════════════════
// Extração de texto bruto do PDF.
//
// Em PDFs do Bradesco PJ:
//   - Cada transação ocupa 2 linhas no PDF
//   - Linha 1: data + tipo de operação
//   - Linha 2: REM/DES + contraparte + doc + tipo + valor + saldo
//   - "Saldo do dia" são linhas de fechamento (ignorar)
// ═══════════════════════════════════════════════════════════════════════

// @ts-expect-error — pdf-parse não exporta tipos no entry default
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export interface ParsedPdf {
  text: string;
  pages: number;
  charCount: number;
}

export async function extractPdfText(buffer: Buffer): Promise<ParsedPdf> {
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    pages: data.numpages,
    charCount: data.text.length,
  };
}

/**
 * Identifica se o texto parece ser de um PDF de extrato Bradesco.
 * Usado pra dar erro amigável se o usuário subir o PDF errado.
 */
export function looksLikeBradescoPj(text: string): boolean {
  const markers = ['bradesco', 'extrato', 'período', 'lançamentos'];
  const lower = text.toLowerCase();
  return markers.filter((m) => lower.includes(m)).length >= 3;
}
