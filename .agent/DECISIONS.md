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

---

## ADR-009: Runtime ORM — Drizzle (apps/web) vs Prisma (@concierge/database)

- **Status:** Débito Técnico Reconhecido — MIGRATE LATER
- **Data:** Setembro de 2026 (Auditoria Arquitetural)
- **Contexto:** Durante a auditoria arquitetural de setembro/2026, foi identificado que o runtime de `apps/web` utiliza exclusivamente **Drizzle ORM** com `@neondatabase/serverless` (via `apps/web/src/db/index.ts`), enquanto toda a documentação anterior afirmava que o ORM em uso era o **Prisma**. O pacote `@concierge/database` (com Prisma Client e schema Prisma) é declarado como dependência no `package.json` e `transpilePackages` do `next.config.ts`, mas não é importado em nenhum arquivo de `apps/web/src`. O Better Auth é configurado com `drizzleAdapter`, confirmando que Drizzle é o ORM real em runtime. O schema Drizzle (`apps/web/src/db/schema.ts`, 759 linhas) cobre 20+ tabelas com entidades não presentes no schema Prisma, incluindo `deliveryZones`, `deliveryDrivers`, `loyaltyAccounts`, `stockItems`, `auditLogs`. A hierarquia de UserRole no Drizzle é `'MASTER' | 'GERENTE' | 'PEDIDOS' | 'CLIENTE'`, enquanto o enum do Prisma era `SUPERADMIN | VENDOR_ADMIN | OPERATOR | CUSTOMER`.
- **Decisão:** **MIGRATE LATER.** O runtime de `apps/web` permanece com Drizzle ORM. O pacote `@concierge/database` (Prisma) fica como infraestrutura legada de geração de schema de referência e CLI de DDL até que seja formalmente removido ou convertido em outra função. Nenhuma nova funcionalidade deve ser desenvolvida contra o Prisma Client em `apps/web`. Toda documentação foi corrigida para refletir o estado real.
- **Consequências:**
  - *Positivas:* Elimina confusão entre documentação e código; consolida a decisão de uso do Drizzle como ORM de runtime; permite planejamento ordenado da remoção do Prisma.
  - *Cuidados:* O `prebuild` em `apps/web/package.json` ainda executa `db:generate` do Prisma — isso pode ser removido ou substituído por `drizzle-kit generate` em uma migração futura. Não misturar queries Prisma e Drizzle no mesmo fluxo de dados.

---

## ADR-010: Webhooks com Autenticação HMAC e Idempotência Obrigatória

- **Status:** Decisão Arquitetural — A IMPLEMENTAR
- **Data:** Setembro de 2026 (Auditoria Arquitetural)
- **Contexto:** A auditoria identificou ausência de verificação de assinatura e mecanismo de idempotência nos webhooks de gateways de pagamento (Mercado Pago, Asaas). Webhooks sem autenticação são vulneráveis a replay attacks e confirmações fraudulentas de pedidos. Webhooks sem idempotência podem resultar em lançamentos duplicados no ledger financeiro.
- **Decisão:**
  1. Todo endpoint de webhook implementa verificação de assinatura HMAC-SHA256 (ou mecanismo equivalente do provedor) antes de qualquer processamento. Requisições com assinatura inválida são rejeitadas com HTTP 401.
  2. Toda operação de webhook implementa deduplicação via tabela `webhook_events` com chave única `{provider}:{event_id}`. Eventos já processados retornam HTTP 200 silencioso sem re-execução.
  3. O processamento de webhook ocorre dentro de transação atômica para garantir consistência entre atualização de status e lançamento no ledger.
- **Consequências:**
  - *Positivas:* Proteção contra replay attacks e confirmações fraudulentas; garantia de que cada evento de pagamento resulta em exatamente um lançamento no ledger; conformidade com FIN-007 e FIN-008.
  - *Cuidados:* As chaves de assinatura dos webhooks (secrets) são variáveis de ambiente da classe SECRET e não podem ser expostas em logs ou respostas de API.

---

## ADR-011: Anti-IDOR — Tenant Context Obrigatório em Todas as Queries Sensíveis

- **Status:** Decisão Arquitetural — PARCIALMENTE IMPLEMENTADO (risco P0 — A CORRIGIR)
- **Data:** Setembro de 2026 (Auditoria Arquitetural)
- **Contexto:** A auditoria identificou risco CRITICAL de IDOR/BOLA: a rota de tracking de pedido (`/pedido/[publicId]`) e algumas Server Actions buscam entidades usando apenas identificadores públicos ou IDs, sem validar o `restaurantId` do solicitante. Isto permite que um ator malicioso acesse dados de qualquer pedido ao adivinhar ou enumerar `publicId`s.
- **Decisão:**
  1. Toda query sobre entidade tenant-scoped (pedidos, clientes, pagamentos, produtos, etc.) inclui `restaurantId` como filtro obrigatório na cláusula WHERE.
  2. A rota pública de tracking de pedido (`/pedido/[publicId]`) é uma exceção documentada: por design, permite acesso anônimo ao status de rastreamento, mas retorna EXCLUSIVAMENTE dados sanitizados pelo `sanitizeOrderForTracking` — sem dados financeiros internos, notas de operadores ou informações de outros clientes.
  3. Para todas as demais operações (atualização de status, cancelamento, histórico completo), o `restaurantId` é verificado contra a sessão do usuário autenticado antes do processamento.
  4. A função `requireRestaurantRole(restaurantId, roles)` deve ser chamada no início de toda Server Action que não seja explicitamente pública.
- **Consequências:**
  - *Positivas:* Eliminação do risco IDOR/BOLA; conformidade com os princípios de multi-tenancy da Constituição; redução de superfície de ataque.
  - *Cuidados:* Requer revisão sistemática de todas as Server Actions e rotas de API para confirmar presença do filtro de tenant. Risco P0 ativo até a revisão ser concluída.

---

## ADR-012: Secure Data Boundary para Agentes de IA

- **Status:** Decisão Arquitetural — A IMPLEMENTAR antes da ativação do Agente Concierge
- **Data:** Setembro de 2026 (Auditoria Arquitetural)
- **Contexto:** O Agente Concierge precisará acessar dados do sistema (cardápio, status de pedido, disponibilidade) para responder ao usuário. Sem uma fronteira de dados clara, há risco de que dados pessoais (PERSONAL), financeiros (FINANCIAL) ou internos (INTERNAL/SECRET) sejam inadvertidamente incluídos no contexto enviado a provedores externos de LLM, violando AI-009 e princípios LGPD.
- **Decisão:**
  1. **Tool Interface Segura:** Cada tool disponível ao agente expõe apenas os campos estritamente necessários para a resposta do usuário. O schema de saída de cada tool é revisado para excluir campos sensíveis antes do retorno ao modelo.
  2. **Read-only por padrão:** Tools de consulta (search, get, list) não executam side effects. Tools de mutação (create_order_draft) operam em estado temporário e requerem confirmação explícita do usuário para persistência.
  3. **Context Budget:** O contexto enviado ao modelo é auditável — cada componente (system prompt, tool descriptions, histórico de mensagens, dados de domínio) tem tamanho e conteúdo rastreáveis.
  4. **No Personal Data in LLM Context:** Dados classificados como PERSONAL, FINANCIAL ou SECRET não são incluídos no contexto do modelo sem mascaramento e base legal documentada.
- **Consequências:**
  - *Positivas:* Conformidade com AI-001 a AI-009; proteção de dados pessoais na camada de IA; portabilidade entre provedores (AI-010); redução de risco de prompt injection (AI-007).
  - *Cuidados:* Exige design cuidadoso do schema de resposta de cada tool para balancear informatividade e minimização de dados. Deve ser validado em ambiente de staging antes de ativação em produção.
