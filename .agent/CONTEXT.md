# 🧭 CONCIERGE / OSTRAS.AI — RESUMO EXECUTIVO DE CONTEXTO

> **Documento de Onboarding e Contextualização para Agentes de IA e Engenheiros.**  
> Atualizado em: Setembro de 2026 — Revisado após Auditoria Arquitetural.

> **LEIA TAMBÉM:** `.agent/CONSTITUTION.md` antes de qualquer modificação no repositório.

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
│       ├── src/db/                  # ⚠️ ORM REAL: Drizzle + @neondatabase/serverless
│       │   ├── index.ts             # drizzle(neon(connectionString)) — conexão ao banco
│       │   └── schema.ts            # Schema Drizzle (759 linhas, 20+ tabelas)
│       ├── src/domain/orders/       # Cópia local do domínio de pedidos (débito técnico — ver ADR-004)
│       ├── src/modules/orders/      # Componentes, Actions, Serviços e Contexto de Pedidos
│       ├── src/modules/concierge/   # Componentes de Chat, Hooks e Widgets do Agente
│       ├── src/lib/                 # Auth client (Better Auth com drizzleAdapter), helpers e auth guards
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
│   ├── database/                    # @concierge/database: Infraestrutura Prisma (LEGADO — não importado pelo apps/web)
│   │   ├── prisma/schema.prisma     # Schema Prisma — referência, não usado em runtime
│   │   └── src/client.ts            # Singleton do Prisma — não consumido por apps/web/src
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
│   ├── CONSTITUTION.md              # Regras de ouro inegociáveis e protocolo operacional (v2.0)
│   ├── AI_CONSTITUTION.md           # Constituição específica para agentes de IA (AI-001 a AI-010)
│   ├── SECURITY.md                  # Política de segurança (SEC-001 a SEC-015)
│   ├── DATA_GOVERNANCE.md           # Governança de dados, LGPD e classificação de dados
│   ├── INCIDENT_RESPONSE.md         # Plano de resposta a incidentes (7 cenários)
│   ├── CONTEXT.md                   # Este documento (visão geral do estado atual)
│   └── DECISIONS.md                 # Architecture Decision Records (ADR-001 a ADR-012)
│
├── docs/                            # Documentações adicionais
│   ├── DEPLOY.md                    # Guia passo a passo Vercel + Neon
│   └── DATA_PROCESSORS.md           # Registro de subprocessadores de dados (LGPD)
│
├── turbo.json                       # Configuração de build, pipeline e env vars globais
├── vercel.json                      # Configuração do preset Next.js para a Vercel
├── pnpm-workspace.yaml              # Configuração dos workspaces do pnpm
└── CHANGELOG.md                     # Histórico cronológico de mudanças
```

---

## 3. ⚠️ ESTADO CRÍTICO: DUALIDADE ORM (DÉBITO TÉCNICO)

> Esta seção documenta a divergência descoberta na auditoria de setembro/2026. Leia antes de implementar qualquer funcionalidade de banco.

### ORM em Runtime: Drizzle (apps/web/src/db/)

```typescript
// apps/web/src/db/index.ts — ESTA É A CONEXÃO REAL AO BANCO
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
```

- **Schema:** `apps/web/src/db/schema.ts` (759 linhas, 20+ tabelas)
- **Auth:** `apps/web/src/lib/auth.ts` usa `drizzleAdapter(db, { provider: "pg", schema: {...} })`
- **UserRole no Drizzle:** `'MASTER' | 'GERENTE' | 'PEDIDOS' | 'CLIENTE'`

### @concierge/database (Prisma — NÃO importado pelo apps/web)

- Localização: `packages/database/src/client.ts`
- Declarado como dependência e em `transpilePackages`, mas **zero imports** em `apps/web/src`
- UserRole no Prisma: `SUPERADMIN | VENDOR_ADMIN | OPERATOR | CUSTOMER` (enum diferente do Drizzle)
- Tabelas no schema Drizzle ausentes no schema Prisma: `deliveryZones`, `deliveryDrivers`, `loyaltyAccounts`, `stockItems`, `auditLogs` (e mais)

### Decisão: MIGRATE LATER (ADR-009)

O runtime de `apps/web` permanece com Drizzle. O Prisma é infraestrutura legada. Nenhuma nova funcionalidade deve usar o Prisma Client em `apps/web`. Ver ADR-009 para detalhes e plano futuro.

---

## 4. STATUS DA INFRAESTRUTURA & DEPLOY

- **Repositório GitHub:** `https://github.com/Rilen/concierge` (branch ativa: `main`).
- **Deploy Host:** **Vercel** (`apps/web`).
  - **Root Directory:** `apps/web`.
  - **Preset:** Next.js.
  - **Build Command:** NÃO sobrescrever no painel da Vercel (deixar padrão).
  - **Build Trigger:** `apps/web/package.json` possui `"prebuild": "pnpm --filter @concierge/database db:generate"` para geração do Prisma Client antes do build.
  - **Configuração Turborepo:** `apps/web/turbo.json` e `turbo.json` na raiz declaram variáveis de ambiente.
- **Banco de Dados:** **Neon PostgreSQL Serverless**.
  - `DATABASE_URL`: Connection string com pooling (`-pooler.neon.tech`) para runtime.
  - `DIRECT_URL`: Connection string direta (porta 5432) para DDL e migrações.
- **Autenticação:** Better Auth com `drizzleAdapter` conectado ao schema Drizzle.

---

## 5. CONTRATOS E REGRAS DE NEGÓCIO CRÍTICAS

1. **Moeda:** Todas as operações monetárias são processadas em **centavos inteiros** (`Math.round(valor * 100)`). A exibição visual divide por 100 com 2 casas decimais.
2. **Comissão:** O plano padrão é **0,5%** sobre o valor bruto do pedido (`packages/core/src/commission/index.ts`). **ESTA ALÍQUOTA NÃO PODE SER ALTERADA SEM ADR.**
3. **Isolamento de Pedidos:** A URL pública de acompanhamento usa `publicId` (ex: `/pedido/ord_abc123`). O sanitizador `sanitizeOrderForTracking` remove dados internos antes da serialização.
4. **Validação de Opções:** Reside exclusivamente no servidor em `packages/core/src/orders/validation.ts`.
5. **Autenticação:** Toda Server Action protegida chama `requireRestaurantRole(restaurantId, roles)` no início.

---

## 6. RISCOS ATIVOS (AUDITORIA SETEMBRO/2026)

| Prioridade | Risco | Tipo | ADR | Status |
|------------|-------|------|-----|--------|
| **P0** | IDOR/BOLA: queries sem filtro de restaurantId | CRITICAL | ADR-011 | A CORRIGIR |
| **P0** | Duplicação de domínio: `apps/web/src/domain/orders/` copia `packages/core/src/orders/` | HIGH | ADR-004 | A CONSOLIDAR |
| **P1** | Webhooks sem assinatura HMAC e sem idempotência | HIGH | ADR-010 | A IMPLEMENTAR |
| **P1** | Dualidade Drizzle/Prisma: documentação desatualizada | MEDIUM | ADR-009 | DOCUMENTADO |
| **P2** | Ausência de interface de direitos dos titulares (LGPD) | MEDIUM | — | A IMPLEMENTAR |
| **P2** | Boundary de dados para agente de IA não implementado | MEDIUM | ADR-012 | A IMPLEMENTAR |

---

## 7. ESTADO ATUAL E PRÓXIMOS PASSOS (ROADMAP)

### O que já está funcional:
- ✅ Monorepo Turborepo + pnpm configurado e compilando de ponta a ponta.
- ✅ Módulo de pedidos (legado Degusta) migrado e modularizado em `apps/web` e `packages/core`.
- ✅ Pipeline de deploy Vercel + Neon funcional (ver ADR-008).
- ✅ Governança 2.0 estabelecida (CONSTITUTION.md, AI_CONSTITUTION.md, SECURITY.md, DATA_GOVERNANCE.md, INCIDENT_RESPONSE.md, DECISIONS.md, CHANGELOG.md).
- ✅ Drizzle ORM como runtime real de banco de dados (documentado em ADR-009).

### Próximas prioridades de desenvolvimento:
1. **[P0] Blindagem Anti-IDOR:** Revisão sistemática de todas as Server Actions e rotas para garantir filtro de `restaurantId` (ADR-011).
2. **[P0] Consolidação de Domínio:** Remover `apps/web/src/domain/orders/` e usar exclusivamente `@concierge/core`.
3. **[P1] Webhooks Seguros:** Implementar HMAC + tabela de idempotência `webhook_events` (ADR-010).
4. **[P1] Agente Conversacional Concierge:** Conectar streaming de chat com Google Gemini via Vercel AI SDK.
5. **[P2] Integração de Pagamentos (Pix):** Webhook do Mercado Pago / Asaas.
6. **[P2] Gateway WhatsApp:** Evolution API para espelhar atendimento no WhatsApp.

---

*Concierge / Ostras.ai — Contexto Executivo — Setembro de 2026*
