# 🧭 CONCIERGE / OSTRAS.AI — RESUMO EXECUTIVO DE CONTEXTO

> **Documento de Onboarding e Contextualização para Agentes de IA e Engenheiros.**  
> Atualizado em: Setembro de 2026.

---

## 1. O QUE É O CONCIERGE (OSTRAS.AI)?

O **Concierge** é uma plataforma transacional e conversacional voltada ao comércio e turismo gastronômico (inicialmente em Rio das Ostras / Região dos Lagos). O sistema une dois grandes pilares:
1. **Experiência Conversacional com Agentes de IA:** Atendimento omnicanal (Web Chat e WhatsApp via Evolution API) capaz de interpretar desejos do usuário ("Quero uma pizza de camarão sem lactose aberta agora"), recomendar pratos, consultar disponibilidade e montar rascunhos de pedidos.
2. **Infraestrutura Transacional de Marketplace:** Cardápio digital white-label por restaurante (`/r/[slug]`), carrinho dinâmico, checkout inteligente, rastreamento de pedidos em tempo real com código opaco (`/pedido/[publicId]`), kanban de pedidos para a cozinha (`/gestao`), reservas de mesas e ledger financeiro com taxa justa de **0,5%**.

---

## 2. MAPA ARQUITETURAL DO MONOREPO

```
concierge/
├── apps/
│   └── web/                         # Next.js 16 (App Router) + React 19 + Tailwind v4
│       ├── src/app/                 # Rotas da aplicação (portal, /r/[slug], /gestao, /admin, APIs)
│       ├── src/modules/orders/      # Componentes, Actions, Serviços e Contexto de Pedidos
│       ├── src/modules/concierge/   # Componentes de Chat, Hooks e Widgets do Agente
│       ├── src/lib/                 # Auth client (Better Auth), helpers e auth guards
│       └── package.json             # Workspace @concierge/web
│
├── packages/
│   ├── core/                        # @concierge/core: Domínio Puro Agnóstico de Framework
│   │   ├── src/orders/              # Cálculos em centavos, validação de regras de opções, sanitizador
│   │   ├── src/commission/          # Cálculo e split da comissão da plataforma (0,5%)
│   │   ├── src/agents/              # Tipagens de intenção, mensagens e contratos de tools de IA
│   │   ├── src/bookings/            # Tipos e regras de reservas de mesas
│   │   └── src/types/               # Value objects compartilhados (Result, Money, Address)
│   │
│   ├── ai/                          # @concierge/ai: Orquestração de LLMs e Agentes
│   │   ├── src/agents/              # Orquestrador do Concierge e loops de decisão
│   │   ├── src/tools/               # Tools: search_catalog, create_order_draft, track_order, book_table
│   │   ├── src/prompts/             # System prompts dos agentes
│   │   └── src/providers/           # Abstração para Gemini, OpenAI e Anthropic (Vercel AI SDK)
│   │
│   ├── database/                    # @concierge/database: Persistência & Prisma ORM
│   │   ├── prisma/schema.prisma     # Schema PostgreSQL unificado
│   │   └── src/client.ts            # Singleton do Prisma otimizado para Serverless Pooling
│   │
│   ├── ui/                          # @concierge/ui: Design System Compartilhado
│   │   └── src/components/          # Componentes visuais atômicos (Button, Card, Badge, Input)
│   │
│   └── config/                      # @concierge/config: Configurações TypeScript base
│
├── legacy/
│   └── degusta-v1/                  # Backup preservado do projeto legado original (não alterar)
│
├── .agent/                          # Governança de Agentes de IA
│   ├── CONSTITUTION.md              # Regras de ouro inegociáveis e protocolo operacional
│   ├── CONTEXT.md                   # Este documento (visão geral do estado)
│   └── DECISIONS.md                 # Architecture Decision Records (ADRs)
│
├── docs/                            # Documentações adicionais
│   └── DEPLOY.md                    # Guia passo a passo Vercel + Neon
│
├── turbo.json                       # Configuração de build, pipeline e env vars globais
├── vercel.json                      # Configuração do preset Next.js para a Vercel
├── pnpm-workspace.yaml              # Configuração dos workspaces do pnpm
└── CHANGELOG.md                     # Histórico cronológico de mudanças
```

---

## 3. STATUS DA INFRAESTRUTURA & DEPLOY

- **Repositório GitHub:** `https://github.com/Rilen/concierge` (branch ativa: `main`).
- **Deploy Host:** **Vercel** (`apps/web`).
  - **Root Directory:** `apps/web`.
  - **Preset:** Next.js.
  - **Build Trigger:** `apps/web/package.json` possui `"prebuild": "pnpm --filter @concierge/database db:generate"`, garantindo a geração prévia do client do Prisma.
  - **Configuração Turborepo:** `apps/web/turbo.json` e `turbo.json` na raiz declaram `DIRECT_URL`, `DATABASE_URL` e demais variáveis para evitar warnings no pipeline.
- **Banco de Dados:** **Neon PostgreSQL Serverless**.
  - `DATABASE_URL`: Connection string com pooling (`-pooler.neon.tech`) para runtime nas serverless functions da Vercel.
  - `DIRECT_URL`: Connection string direta (porta 5432) para DDL e migrações do Prisma.
- **Autenticação:** Better Auth compatível com sessões no PostgreSQL (`users`, `sessions`, `accounts`, `verifications`).

---

## 4. CONTRATOS E REGRAS DE NEGÓCIO CRÍTICAS

1. **Moeda:** Todas as operações monetárias são processadas em **centavos inteiros** (`Math.round(valor * 100)`). A exibição visual divide por 100 com 2 casas decimais.
2. **Comissão:** O plano padrão é **0,5%** sobre o valor bruto do pedido (`packages/core/src/commission/index.ts`).
3. **Isolamento de Pedidos:** A URL pública de acompanhamento usa `publicId` (ex: `/pedido/ord_abc123`). O sanitizador `sanitizeOrderForTracking` remove notas internas, margem de comissão da plataforma e IDs sequenciais de banco de dados antes da serialização.
4. **Validação de Opções:** A lógica de seleção de adicionais, grupos obrigatórios (`minSelect`/`maxSelect`) e fatias de pizza (1 a 4 sabores) reside exclusivamente no servidor em `packages/core/src/orders/validation.ts`.

---

## 5. ESTADO ATUAL E PRÓXIMOS PASSOS (ROADMAP)

### O que já está 100% pronto e funcional:
- ✅ Monorepo Turborepo + pnpm configurado e compilando de ponta a ponta.
- ✅ Módulo de pedidos (legado Degusta) totalmente migrado, modularizado e testado no `apps/web` e `packages/core`.
- ✅ Schema do Prisma unificado (Auth, Tenants, Menu, Orders, Bookings, Ledger) e validado com Neon.
- ✅ Pipeline de deploy Vercel + Neon com resolução de `outputDirectory` e injeção de env vars.
- ✅ Governança estabelecida (`CONSTITUTION.md`, `CONTEXT.md`, `DECISIONS.md`, `CHANGELOG.md`).

### Próximas prioridades de desenvolvimento:
1. **Agente Conversacional Concierge (`@concierge/ai` & `/api/concierge/chat`):**
   - Conectar o streaming de chat com Google Gemini (via Vercel AI SDK).
   - Implementar a execução real das tools (`search_catalog`, `create_order_draft`, `track_order`).
2. **Integração de Pagamentos (Pix):**
   - Implementar webhook do Mercado Pago / Asaas para confirmação automática de pagamentos Pix.
3. **Gateway WhatsApp (Evolution API):**
   - Configurar webhook para espelhar o atendimento do agente Concierge no WhatsApp.
