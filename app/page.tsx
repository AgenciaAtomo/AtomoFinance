import Link from 'next/link';
import { Upload, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-accent font-heading font-bold">Á</span>
            </div>
            <span className="font-heading font-bold text-lg">Átomo Finance</span>
          </div>
          <Link href="/import" className="btn-ghost">
            Importar extrato
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-alt text-secondary text-sm mb-6">
            <Sparkles size={14} />
            Powered by Claude
          </div>

          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-primary">
            Seu extrato bancário,
            <br />
            <span className="text-accent">organizado em segundos</span>
          </h1>

          <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
            Faça upload do PDF do seu extrato. A IA extrai, categoriza e organiza cada
            transação por mês. Você só revisa e confirma.
          </p>

          <Link href="/import" className="btn-primary text-base px-6 py-3">
            <Upload size={18} />
            Importar primeiro extrato
            <ArrowRight size={18} />
          </Link>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="card">
              <div className="font-heading font-semibold mb-1">📥 Upload</div>
              <p className="text-sm text-muted">
                Arraste o PDF do extrato — Bradesco PJ ou Conta Simples.
              </p>
            </div>
            <div className="card">
              <div className="font-heading font-semibold mb-1">🤖 IA categoriza</div>
              <p className="text-sm text-muted">
                Cada transação ganha categoria automática: Marketing, Folha, Receita...
              </p>
            </div>
            <div className="card">
              <div className="font-heading font-semibold mb-1">✅ Você confirma</div>
              <p className="text-sm text-muted">
                Revisa o preview, ajusta o que precisar e salva.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 py-4 border-t border-border text-center text-sm text-muted">
        Átomo Finance · Agência Átomo · MVP v0.1
      </footer>
    </main>
  );
}
