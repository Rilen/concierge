# 📝 CHANGELOG — CONCIERGE / OSTRAS.AI

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Governance
- **Constituição 2.0 (.agent/CONSTITUTION.md):** Substituída pela versão 2.0 com 6 capítulos completos — Princípios Fundamentais (Arts. 1-5), Integridade Financeira (FIN-001 a FIN-008), Multi-tenancy & Autorização, Privacidade & LGPD, Padrões de Código e Protocolo de 11 Etapas para Agentes de Desenvolvimento. Cláusula Pétrea: hierarquia de 10 prioridades inegociáveis.
- **Constituição de IA (.agent/AI_CONSTITUTION.md):** Criado novo documento com AI-001 a AI-010 — Least Authority, No Direct Database, No Secret Access, Deterministic Transactions, Explicit Confirmation, Tool Validation, Prompt Injection Resistance, Output Is Untrusted, Data Minimization, Provider Abstraction.
- **Política de Segurança (.agent/SECURITY.md):** Criado novo documento com SEC-001 a SEC-015 — Zero Trust, Least Privilege, Defense in Depth, Fail Closed, Secrets Never Logged, Tenant Isolation, Server-side Authorization, Input Is Untrusted, AI Output Is Untrusted, Webhook Authentication, Idempotency, Auditability, Dependency Security, Supply Chain Security, Incident Response.
- **Governança de Dados (.agent/DATA_GOVERNANCE.md):** Criado novo documento com classificação de 7 classes de dados, finalidade e base legal, minimização, 4 fluxos de dados documentados (Pedidos, IA, Pagamentos, WhatsApp), direitos dos titulares, retenção e subprocessadores. Base: LGPD — arquitetura preparada para atendimento, A VALIDAR juridicamente.
- **Plano de Resposta a Incidentes (.agent/INCIDENT_RESPONSE.md):** Criado novo documento com fluxo de 8 etapas e 7 cenários — Vazamento de Secret, Cross-Tenant, Dados Pessoais, Prompt Injection, Webhook Comprometido, Conta Administrativa, Vazamento para LLM.
- **Registro de Subprocessadores (docs/DATA_PROCESSORS.md):** Criado novo documento mapeando 8 subprocessadores — Vercel, Neon, Google Gemini, OpenAI, Anthropic, Evolution API, Mercado Pago, Asaas. Campos A VALIDAR para DPA, adequabilidade e transferências internacionais.
- **ADRs (.agent/DECISIONS.md):** Adicionados ADR-009 (Drizzle vs Prisma — MIGRATE LATER), ADR-010 (Webhook HMAC + Idempotência), ADR-011 (Anti-IDOR/Tenant Context), ADR-012 (Secure Data Boundary para agentes de IA).
- **Contexto Executivo (.agent/CONTEXT.md):** Atualizado para refletir estado real — ORM de runtime é Drizzle (não Prisma), estado híbrido documentado, riscos P0/P1/P2 mapeados, estrutura de governança 2.0 incluída.
- **README.md:** Corrigidas afirmações incorretas sobre ORM — Prisma referenciado como infraestrutura legada, Drizzle identificado como ORM de runtime. Stack tecnológica atualizada.

### Planned
- Blindagem Anti-IDOR (ADR-011): revisão sistemática de Server Actions e rotas.
- Consolidação de domínio: remoção de pps/web/src/domain/orders/ duplicado.
- Webhooks seguros: HMAC + tabela de idempotência webhook_events (ADR-010).
- Ativação do Agente Concierge com streaming Google Gemini via Vercel AI SDK.
- Integração de pagamentos Pix (Mercado Pago / Asaas).
- Canal WhatsApp via Evolution API.


## [0.4.1] - 2026-09-10

### Fixed
- **Tracing de dependências do monorepo na Vercel:** Adicionado `outputFileTracingRoot: path.join(__dirname, "../../")` no [`apps/web/next.config.ts`](./apps/web/next.config.ts) para garantir o empacotamento integral das dependências do monorepo (`packages/*` e virtual store do pnpm) nas Serverless Functions da Vercel.
- **Compatibilidade do Prisma com Linux RHEL na Vercel:** Adicionado `binaryTargets = ["native", "rhel-openssl-3.0.x"]` nos schemas do Prisma para garantir a compilação do query engine para o ambiente serverless da Vercel.

### Added
- **Configuração local de framework:** Adicionado [`apps/web/vercel.json`](./apps/web/vercel.json) definindo o framework Next.js diretamente no diretório do app.

---

## [0.4.0] - 2026-09-10

### Fixed
- **Correção de caminho duplicado de output na Vercel:** Removido o parâmetro `"outputDirectory": "apps/web/.next"` do [`vercel.json`](./vercel.json). Como o Root Directory da Vercel está configurado como `apps/web`, a Vercel concatenava os caminhos (`apps/web/apps/web/.next`), causando falha no deploy. O Next.js preset agora assume o padrão `.next` nativo.
- **Eliminação de avisos de variáveis ausentes no Turborepo:** Criado o arquivo [`apps/web/turbo.json`](./apps/web/turbo.json) herdando da raiz (`"extends": ["//"]`) e declarando explicitamente todas as variáveis de ambiente necessárias (`DIRECT_URL`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.).

### Added
- **Script prebuild em `apps/web`:** Adicionado `"prebuild": "pnpm --filter @concierge/database db:generate"` no [`apps/web/package.json`](./apps/web/package.json) para garantir que o Prisma Client esteja sempre compilado antes do `next build`.
- **Governança Oficial para Agentes de IA (`.agent/`):**
  - [`.agent/CONSTITUTION.md`](./.agent/CONSTITUTION.md): Regras de ouro inegociáveis, hierarquia de prioridades, taxa de 0,5%, aritmética estrita em centavos inteiros e protocolo de 9 etapas para agentes de IA.
  - [`.agent/CONTEXT.md`](./.agent/CONTEXT.md): Resumo executivo do estado atual do projeto para onboarding de outros agentes e chats.
  - [`.agent/DECISIONS.md`](./.agent/DECISIONS.md): Architecture Decision Records (ADRs) simplificados cobrindo monorepo, banco Neon, autenticação e deploy.

---

## [0.3.0] - 2026-09-10

### Changed
- **Configuração de Variáveis de Ambiente no Turborepo:** Atualizado o [`turbo.json`](./turbo.json) raiz com as seções `globalEnv` e `tasks.build.env`, registrando `DATABASE_URL`, `DIRECT_URL`, chaves de IA (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) e variáveis de autenticação.

### Security
- **Segredos Criptográficos de Produção:** Geração e padronização de segredos randômicos de 32 bytes em hexadecimal para `BETTER_AUTH_SECRET` e `NEXTAUTH_SECRET`.
- **Organização do `.env.example`:** Classificação clara entre variáveis obrigatórias, recomendadas e opcionais para o primeiro deploy em produção.

---

## [0.2.0] - 2026-09-10

### Added
- **Configuração de Banco de Dados Neon (PostgreSQL Serverless):**
  - Atualizado o [`packages/database/prisma/schema.prisma`](./packages/database/prisma/schema.prisma) com `directUrl = env("DIRECT_URL")` para suportar migrações DDL diretas sem conflito com o connection pooling do PgBouncer.
  - Implementado singleton do Prisma em [`packages/database/src/client.ts`](./packages/database/src/client.ts) otimizado para reaproveitamento de conexões em serverless functions.
- **Hook de Postinstall para o Prisma:** Adicionado `"postinstall": "pnpm --filter @concierge/database db:generate"` no [`package.json`](./package.json) raiz para automatizar a geração do client durante o `pnpm install` na Vercel.
- **Configuração do Next.js para Monorepo:** Adicionado `transpilePackages` e `serverExternalPackages: ["@prisma/client", "prisma"]` no [`apps/web/next.config.ts`](./apps/web/next.config.ts).
- **Documentação de Deploy:** Criado o guia passo a passo [`docs/DEPLOY.md`](./docs/DEPLOY.md) cobrindo Neon + Vercel.

---

## [0.1.0] - 2026-09-10

### Added
- **Inicialização da Arquitetura Monorepo (Turborepo + pnpm):**
  - Criação da estrutura de pastas: `apps/web`, `packages/core`, `packages/ai`, `packages/database`, `packages/ui`, `packages/config`.
  - Configuração do pipeline de cache com [`turbo.json`](./turbo.json) e [`pnpm-workspace.yaml`](./pnpm-workspace.yaml).
- **Migração e Modernização do Módulo de Pedidos (Legado Degusta):**
  - Isolamento das regras de negócio puras no pacote [`@concierge/core`](./packages/core) (Clean Architecture).
  - Cálculos financeiros estritamente em centavos inteiros (`calculations.ts`) para eliminar erros de ponto flutuante.
  - Validação server-side estrita de árvores de opções e adicionais (`validation.ts`).
  - Projeção segura de tracking de pedidos com sanitização anti-IDOR/BOLA (`sanitizer.ts`).
  - Implementação da regra de comissão de **0,5%** da plataforma (`commission/index.ts`).
  - Migração de componentes visuais, context de carrinho, Server Actions e páginas de pedidos para [`apps/web/src/modules/orders`](./apps/web/src/modules/orders).
- **Preservação do Histórico Legado:**
  - Backup integral e imutável do projeto original arquivado em [`legacy/degusta-v1/`](./legacy/degusta-v1/).
- **Configuração Git Inicial:**
  - Configuração do repositório remoto `https://github.com/Rilen/concierge.git` e `.gitignore` abrangente.
