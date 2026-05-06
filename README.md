# Átomo Finance — Extrato IA

Sistema de gestão financeira PJ com importação de extratos bancários via IA.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase · Anthropic Claude · pdf-parse · Zod

---

## 🚀 Setup local

### Pré-requisitos

- Node.js 20+
- Conta na [Vercel](https://vercel.com) (plano gratuito serve)
- Projeto Supabase com o schema da Etapa 1 já rodado (arquivo `01-schema.sql`)
- API Key da [Anthropic](https://console.anthropic.com)

### Instalação

```bash
# 1. Instala dependências
npm install

# 2. Copia variáveis de ambiente
cp .env.example .env.local

# 3. Edita .env.local com suas credenciais
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - ANTHROPIC_API_KEY

# 4. Roda em dev
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## 📁 Estrutura

```
atomo-finance/
├── app/
│   ├── api/
│   │   ├── import-statement/route.ts   ← Recebe PDF, extrai com IA, retorna preview
│   │   └── save-statement/route.ts     ← Salva no Supabase após confirmação
│   ├── import/page.tsx                 ← UI de upload + preview editável
│   ├── page.tsx                        ← Home
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── supabase/
│   │   ├── server.ts                   ← Client server-side (service role)
│   │   └── client.ts                   ← Client browser-side (anon)
│   ├── ai/
│   │   ├── prompt.ts                   ← Prompt calibrado p/ Bradesco PJ
│   │   └── extract.ts                  ← Chamada Claude + validação Zod
│   └── pdf/parse.ts                    ← Wrapper pdf-parse
├── types/database.ts                   ← Tipos do schema Supabase
├── .env.example
└── package.json
```

---

## 🔄 Fluxo da feature

```
1. Usuário escolhe conta + arrasta PDF
                  ↓
2. POST /api/import-statement (multipart)
   ├── pdf-parse extrai texto bruto
   ├── Claude Sonnet 4.5 extrai e categoriza transações
   └── Zod valida JSON da IA
                  ↓
3. Front renderiza preview EDITÁVEL
   ├── Usuário pode ajustar data/descrição/categoria
   └── Pode remover transações
                  ↓
4. POST /api/save-statement (JSON)
   ├── Cria registro em `statements`
   └── Insere transações em batch em `transactions`
                  ↓
5. ✅ Confirmação visual
```

---

## 💰 Custo por extrato

- Input: ~1.000 tokens × $3/MTok = $0.003
- Output: ~1.500 tokens × $15/MTok = $0.022
- **Total: ~$0.025 (R$ 0,13) por extrato**

40 extratos por dólar.

---

## ⚠️ Limites do Vercel Hobby

- **Timeout:** 10s para serverless functions
- A API `import-statement` foi calibrada para rodar em 5-8s para extratos típicos do Bradesco PJ (até ~50 transações)
- Se você fizer upgrade pro Pro, o `maxDuration = 60` já está configurado no código

---

## 🔐 Auth

Auth está **desligada** por enquanto (`NEXT_PUBLIC_AUTH_ENABLED=false`).

Para ativar quando quiser:

1. Mude a env para `true`
2. Implementa middleware Supabase Auth (próxima etapa)
3. Atualiza policies RLS para filtrar por `user_id`

---

## 🚢 Deploy na Vercel

```bash
# Via CLI
npm i -g vercel
vercel

# Ou conecta o repositório no painel
```

**Não esquece de configurar as 4 variáveis de ambiente no painel da Vercel.**

---

## 🗺️ Próximos passos sugeridos

- [ ] Etapa 6: Listagem de transações com filtros (`/transactions`)
- [ ] Dashboard com gráfico mensal por categoria
- [ ] Adicionar Conta Simples (testar prompt)
- [ ] Multi-tenant (PF + PJ separados)
- [ ] Auth com Supabase
- [ ] Export para CSV / planilha mensal
