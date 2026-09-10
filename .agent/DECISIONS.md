# 📐 CONCIERGE / OSTRAS.AI — REGISTRO DE DECISÕES TÉCNICAS (ADR)

> Este documento registra as decisões arquiteturais e técnicas fundamentais tomadas no projeto, seus contextos, motivações e consequências.

---

## ADR-001: Adoção de Monorepo com Turborepo e pnpm Workspaces

- **Status:** Aceito e Implementado
- **Data:** Setembro de 2026
- **Contexto:** O ecossistema Concierge envolve múltiplas frentes (portal web, módulos de pedidos, agentes de IA com LLMs, camadas de banco de dados e contratos compartilhados). Manter repositórios separados geraria atrito na sincronização de tipos e duplicação de regras de negócio.
- **Decisão:** Estruturar o projeto como um monorepo gerenciado por **Turborepo** com **pnpm workspaces** (`apps/*` e `packages/*`).
- **Consequências:**
  - *Positivas:* Compartilhamento atômico de tipos TypeScript sem necessidade de publicar pacotes no npm; cache de build incremental; pipeline unificado de lint e typecheck.
  - *Cuidados:* Exige atenção na declaração de dependências (`workspace:*`) e na configuração de builds na Vercel.

---

## ADR-002: Next.js 16 (App Router) e React 19

- **Status:** Aceito e Implementado
- **Data:** Setembro de 2026
- **Contexto:** A aplicação necessita de renderização no servidor (SSR) para SEO de cardápios de restaurantes, componentes de servidor (RSC) para redução de bundle, e Server Actions seguras para mutações de pedidos e autenticação.
- **Decisão:** Utilizar **Next.js 16 App Router** com **React 19** e **Tailwind CSS v4** na aplicação principal (`apps/web`).
- **Consequências:**
  - *Positivas:* Excelente performance; suporte nativo a streaming para o chat de IA; integração simplificada de rotas dinâmicas (`/r/[slug]`, `/pedido/[publicId]`).
  - *Cuidados:* Requer `transpilePackages` configurado no `next.config.ts` para compilar os pacotes internos do monorepo (`@concierge/core`, `@concierge/ai`, etc.).

---

## ADR-003: Neon PostgreSQL com Prisma ORM (Dual Connection: Pooled + Direct)

- **Status:** Aceito e Implementado
- **Data:** Setembro de 2026
- **Contexto:** Ambientes serverless (Vercel Functions) abrem e fecham conexões de banco de dados sob demanda, o que pode facilmente esgotar o limite de conexões de uma instância tradicional de PostgreSQL. Além disso, migrações de DDL exigem conexões diretas não-pooladas.
- **Decisão:** Utilizar **Neon PostgreSQL Serverless** com o **Prisma ORM**, configurando o schema com `url = env("DATABASE_URL")` (pooled via PgBouncer na porta 6543) e `directUrl = env("DIRECT_URL")` (porta direta 5432). O cliente do Prisma é instanciado como singleton em `packages/database/src/client.ts`.
- **Consequências:**
  - *Positivas:* Resiliência contra picos de tráfego; custo escalável sob demanda; capacidade de rodar `prisma db push` e migrações sem conflitos com o PgBouncer.
  - *Cuidados:* É mandatório declarar ambas as variáveis no ambiente e no `turbo.json`.

---

## ADR-004: Domínio Puro e Agnóstico no `@concierge/core`

- **Status:** Aceito e Implementado
- **Data:** Setembro de 2026
- **Contexto:** Regras de negócio como cálculos de pedidos, validação de limites de adicionais e divisões financeiras não devem depender do framework web (Next.js) nem do banco de dados (Prisma). Elas precisam ser reutilizáveis pelo Web App, pelo WhatsApp Bot (Evolution API) e por ferramentas CLI.
- **Decisão:** Aplicar os princípios da **Clean Architecture**, isolando todo o domínio de pedidos, comissões, reservas e tipos no pacote `packages/core`, totalmente livre de dependências externas de infraestrutura.
- **Consequências:**
  - *Positivas:* Alta testabilidade (testes unitários rápidos com Vitest sem necessidade de mockar banco ou HTTP); portabilidade total entre canais.
  - *Cuidados:* O desenvolvedor não deve importar bibliotecas de servidor ou cliente dentro de `packages/core`.

---

## ADR-005: Aritmética Financeira em Centavos Inteiros e Comissão de 0,5%

- **Status:** Aceito e Implementado
- **Data:** Setembro de 2026
- **Contexto:** Operações monetárias utilizando ponto flutuante IEEE-754 sofrem de imprecisão cumulativa (ex: `0.1 + 0.2 = 0.30000000000000004`). Além disso, o marketplace necessita de um modelo sustentável e competitivo de receita.
- **Decisão:**
  1. Todos os valores de pedidos, itens, fretes, taxas e repasses são calculados e manipulados em **centavos inteiros** (`Math.round(valor * 100)`).
  2. A comissão padrão da plataforma sobre os pedidos do marketplace é fixada em **0,5%** (`ratePercentage: 0.5`).
  3. Toda transação é registrada em uma tabela imutável de ledger financeiro (`financial_ledger`).
- **Consequências:**
  - *Positivas:* Erro zero de arredondamento financeiro; transparência contábil total; alíquota altamente competitiva para atrair restaurantes locais.
  - *Cuidados:* A formatação para `R$ X,XX` ocorre estritamente na borda de apresentação (UI ou mensagens do chat).

---

## ADR-006: Identificadores Públicos Opacos (`publicId`) e Zero IDOR/BOLA

- **Status:** Aceito e Implementado
- **Data:** Setembro de 2026
- **Contexto:** Expor chaves primárias sequenciais ou UUIDs internos de pedidos em URLs públicas permite adivinhação de registros e vazamento de dados de outros clientes (ataques IDOR/BOLA).
- **Decisão:** Pedidos utilizam um identificador público opaco gerado via nanoid seguro (`publicId`, ex: `ord_abc123xyz`). A rota pública de rastreamento (`/pedido/[publicId]`) consulta exclusivamente por `publicId` e aplica o sanitizador `sanitizeOrderForTracking`, que elimina comissões da plataforma, notas de cozinha e dados sensíveis de operadores.
- **Consequências:**
  - *Positivas:* Blindagem contra ataques de enumeração e conformidade natural com a LGPD.
  - *Cuidados:* O `publicId` deve ser indexado no banco de dados para queries rápidas.

---

## ADR-007: Better Auth para Autenticação e Gestão de Sessões

- **Status:** Aceito e Implementado
- **Data:** Setembro de 2026
- **Contexto:** O sistema necessita de controle de acesso baseado em papéis (RBAC: `SUPERADMIN`, `VENDOR_ADMIN`, `OPERATOR`, `CUSTOMER`) com suporte a múltiplos restaurantes por usuário e compatibilidade com PostgreSQL e serverless.
- **Decisão:** Utilizar o **Better Auth** com tabelas mapeadas no Prisma (`users`, `sessions`, `accounts`, `verifications`).
- **Consequências:**
  - *Positivas:* Sessões seguras no banco de dados; integração facilitada com o ecossistema TypeScript moderno e React Server Components.
  - *Cuidados:* Segredo criptográfico de 32 bytes (`BETTER_AUTH_SECRET`) deve ser obrigatoriamente configurado em produção.

---

## ADR-008: Configuração de Deploy na Vercel com Root Directory `apps/web`

- **Status:** Aceito e Implementado
- **Data:** Setembro de 2026
- **Contexto:** Na importação de monorepos Turborepo, a Vercel configura o projeto com Root Directory apontando para `apps/web`. A presença de `"outputDirectory": "apps/web/.next"` no `vercel.json` raiz gerava resolução duplicada de caminhos (`/vercel/path0/apps/web/apps/web/.next`), quebrando o deploy. Além disso, a Vercel reportava warnings sobre variáveis de ambiente ausentes no `turbo.json`.
- **Decisão:**
  1. Simplificar o `vercel.json` mantendo apenas `"framework": "nextjs"`, permitindo que a Vercel use o diretório padrão `.next` relativo a `apps/web`.
  2. Adicionar o arquivo `apps/web/turbo.json` estendendo a raiz (`"extends": ["//"]`) com as variáveis de ambiente declaradas.
  3. Adicionar o script `"prebuild": "pnpm --filter @concierge/database db:generate"` no `apps/web/package.json` para garantir que o Prisma Client seja compilado antes de qualquer build.
- **Consequências:**
  - *Positivas:* Deploy 100% automatizado, sem caminhos duplicados e com geração garantida do cliente do banco.
  - *Cuidados:* Não recolocar `"outputDirectory"` no `vercel.json` enquanto o Root Directory da Vercel for `apps/web`.
