# 🛎️ Concierge / Ostras.ai

> **Marketplace de Gastronomia, Pedidos & Reservas impulsionado por Agentes de IA.**  
> Arquitetura Monorepo Moderna com **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Clean Architecture**, **Drizzle ORM** (runtime), **Neon PostgreSQL** e **Turborepo**.

---

## 🌟 Visão Geral do Projeto

O **Concierge (Ostras.ai)** é um ecossistema inteligente voltado ao comércio e turismo gastronômico local (iniciando em Rio das Ostras e Região dos Lagos). O sistema combina experiência conversacional com infraestrutura transacional completa de marketplace:

1. **Agente Inteligente Concierge:** Atendimento omnicanal (Web Chat e WhatsApp via Evolution API) com compreensão contextual para busca culinária ("quero pizza de camarão aberta agora"), recomendações personalizadas e geração de rascunhos de pedidos.
2. **Módulo de Pedidos & Delivery (Evolução do Degusta / Paladar):** Cardápio digital white-label por restaurante (`/r/[slug]`), carrinho dinâmico, cálculo monetário estritamente em centavos inteiros, validação server-side de opções e taxa transparente e competitiva de **0,5%**.
3. **Acompanhamento Seguro em Tempo Real:** Rastreamento público de pedidos via identificador opaco (`/pedido/[publicId]`) com projeções blindadas contra ataques IDOR/BOLA e vazamento de dados (LGPD by Design).
4. **Painel de Operações da Cozinha:** Kanban interativo em tempo real para recebimento, preparo e despacho de pedidos (`/gestao`).
5. **Módulo de Reservas de Mesas:** Agendamento com controle de capacidade por turnos e confirmação automática.
6. **Ledger & Repasse Financeiro:** Registro contábil imutável de todas as transações, taxas da plataforma e pagamentos aos comerciantes.

---

## 🏗️ Arquitetura do Monorepo

O projeto é estruturado como um monorepo modular orquestrado com **Turborepo** e **pnpm workspaces**:

```
concierge/
├── apps/
│   └── web/                           # Aplicação Web Principal (Next.js 16 App Router)
│       ├── src/app/                   # Rotas públicas, administrativas e endpoints de API
│       │   ├── page.tsx               # Portal Concierge com chat interativo & busca
│       │   ├── r/[slug]/              # Cardápio digital do restaurante (Delivery/Retirada)
│       │   ├── pedido/[publicId]/     # Rastreamento seguro do pedido pelo cliente
│       │   ├── gestao/                # Kanban de cozinha e gestão de pedidos do restaurante
│       │   ├── admin/                 # Painel administrativo master da plataforma
│       │   └── api/                   # Rotas de API (Concierge AI, Auth, Webhooks)
│       ├── src/modules/
│       │   ├── orders/                # Componentes, contexto de carrinho, actions e serviços de pedidos
│       │   └── concierge/             # Componentes de chat e hooks do agente conversacional
│       ├── turbo.json                 # Configuração do Turborepo em nível de pacote
│       └── package.json               # Scripts de build (incluindo hook prebuild)
│
├── packages/
│   ├── core/                          # @concierge/core: Domínio Puro de Negócio (Framework-Agnostic)
│   │   ├── src/orders/                # Cálculos em centavos, validação server-side, sanitizador
│   │   ├── src/commission/            # Regras da taxa oficial de 0,5% e divisão financeira
│   │   ├── src/agents/                # Tipos de conversa, intenções e contratos de tools de IA
│   │   ├── src/bookings/              # Entidades e regras de capacidade de reservas
│   │   └── src/types/                 # Value objects comuns (Result, Money, Address)
│   │
│   ├── ai/                            # @concierge/ai: Orquestração de Agentes & LLMs
│   │   ├── src/agents/                # Concierge Orchestrator e loops de decisão
│   │   ├── src/tools/                 # Tools: search_catalog, create_order_draft, track_order
│   │   ├── src/prompts/               # System prompts mestres do Concierge
│   │   └── src/providers/             # Integração com Gemini, OpenAI e Anthropic (Vercel AI SDK)
│   │
│   ├── database/                      # @concierge/database: Infraestrutura Prisma (legado — NÃO usado em runtime pelo apps/web)
│   │   ├── prisma/schema.prisma       # Schema de referência — não consumido pelo runtime de apps/web
│   │   └── src/client.ts              # Prisma singleton — não importado por apps/web/src
│   │
│   ├── ui/                            # @concierge/ui: Design System Compartilhado
│   │   └── src/components/            # Button, Card, Badge, StatusBadge, Input
│   │
│   └── config/                        # @concierge/config: Configurações Compartilhadas
│       └── tsconfig.base.json         # Presets de TypeScript
│
├── .agent/                            # Governança de Agentes de IA & Engenharia
│   ├── CONSTITUTION.md                # Constituição do Projeto e Regras de Ouro inegociáveis
│   ├── CONTEXT.md                     # Resumo executivo do estado atual para novos chats/agentes
│   └── DECISIONS.md                   # Architecture Decision Records (ADRs) das decisões técnicas
│
├── docs/                              # Documentação Operacional
│   └── DEPLOY.md                      # Guia oficial passo a passo de deploy (Vercel + Neon)
│
├── legacy/
│   └── degusta-v1/                    # Backup integral e preservado do código legado Degusta
│
├── CHANGELOG.md                       # Histórico cronológico de mudanças do projeto
├── turbo.json                         # Pipeline de tarefas, cache e variáveis globais do Turborepo
├── vercel.json                        # Preset do Next.js para a Vercel
├── pnpm-workspace.yaml                # Definição dos workspaces do pnpm
└── .env.example                       # Variáveis de ambiente completas e documentadas
```

---

## ⚡ Stack Tecnológica

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Framework Web** | [Next.js 16](https://nextjs.org/) (App Router) | Renderização híbrida (SSR/RSC/Server Actions) |
| **Biblioteca UI** | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) | Interfaces fluidas, componentização e estilos modernos |
| **Linguagem** | [TypeScript 5.8+](https://www.typescriptlang.org/) | Tipagem estrita de ponta a ponta sem `any` |
| **Monorepo** | [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) | Orquestração de tarefas, cache inteligente e workspaces |
| **Banco de Dados** | [Neon PostgreSQL Serverless](https://neon.tech/) | Banco relacional escalável com Connection Pooling |
| **ORM (Runtime)** | [Drizzle ORM](https://orm.drizzle.team/) + @neondatabase/serverless | ORM em uso efetivo pelo pps/web (ver ADR-009) |
| **ORM (Legado)** | [Prisma ORM 6.4](https://www.prisma.io/) | Infraestrutura de geração de schema — não usado em runtime (ver ADR-009) |
| **Autenticação** | [Better Auth](https://www.better-auth.com/) | Autenticação moderna multi-tenant e RBAC |
| **IA & LLMs** | [Vercel AI SDK](https://sdk.vercel.ai/) + [Google Gemini](https://ai.google.dev/) | Modelos generativos e tool calling para o Agente Concierge |
| **Validação** | [Zod](https://zod.dev/) | Validação de schemas em todas as bordas do sistema |
| **Hospedagem** | [Vercel](https://vercel.com/) | Deploy contínuo e Serverless Functions de alta performance |

---

## 💻 Como Rodar Localmente

### Pré-requisitos
- **Node.js**: Versão `20.x` ou superior.
- **pnpm**: Versão `9.x` ou superior (`npm install -g pnpm` ou utilize `npx pnpm`).

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/Rilen/concierge.git
cd concierge
pnpm install
```

### 2. Configurar o Arquivo `.env`
Copie o arquivo de exemplo na raiz do projeto:
```bash
cp .env.example .env
```
Preencha as variáveis fundamentais (veja a tabela de variáveis abaixo).

### 3. Preparar o Banco de Dados
```bash
# Gerar o cliente Prisma (referência de schema — o ORM de runtime é Drizzle, ver ADR-009)
pnpm db:generate

# Sincronizar as tabelas com o banco de dados (Neon ou Postgres local)
pnpm db:push

# (Opcional) Popular o banco com dados de demonstração
pnpm db:seed
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
pnpm dev
```

Acesse no navegador:
- **Portal Concierge & Chat:** [http://localhost:3000](http://localhost:3000)
- **Cardápio Demo:** [http://localhost:3000/r/pizzaria-demo](http://localhost:3000/r/pizzaria-demo)
- **Painel de Gestão de Pedidos:** [http://localhost:3000/gestao](http://localhost:3000/gestao)
- **Painel Administrativo:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🚀 Como Fazer Deploy (Vercel + Neon)

O projeto está otimizado para deploy na **Vercel** conectado ao **Neon**:

1. **Configurar o Banco no Neon:**
   - Crie o projeto no console do [Neon](https://console.neon.tech).
   - Obtenha as duas URLs:
     - `DATABASE_URL`: Connection string com pooling ativado (porta 6543, `-pooler.neon.tech`).
     - `DIRECT_URL`: Connection string direta (porta 5432) para migrações DDL e geração de schema Prisma.
2. **Importar o Projeto na Vercel:**
   - Conecte o repositório GitHub `Rilen/concierge`.
   - **Root Directory:** Configure como `apps/web`.
   - **Framework Preset:** `Next.js` (detectado automaticamente).
3. **Configurar as Variáveis de Ambiente na Vercel:**
   - Adicione `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `APP_URL`, etc. (veja checklist abaixo).
4. **Deploy Automático:**
   - Durante a instalação, o hook `postinstall` da raiz e o `prebuild` do `apps/web` executam a geração do Prisma Client (referência de schema).
   - O Turborepo compila as dependências e o Next.js constrói as rotas sem conflitos.

> 📖 Para instruções detalhadas passo a passo, consulte o [**Guia Oficial de Deploy (`docs/DEPLOY.md`)**](./docs/DEPLOY.md).

---

## 🔐 Variáveis de Ambiente Principais

| Variável | Obrigatória? | Descrição | Exemplo |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Sim** | URL Pooled do Neon (para runtime das serverless functions) | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | **Sim** | URL Direta do Neon (para migrações DDL e geração de schema Prisma) | `postgresql://user:pass@ep-direct.neon.tech/neondb?sslmode=require` |
| `BETTER_AUTH_SECRET` | **Sim** | Segredo criptográfico de 32 bytes para sessões e tokens | `hex-string-de-32-bytes` |
| `BETTER_AUTH_URL` | **Sim** | URL base do Better Auth | `https://seu-dominio.vercel.app` |
| `APP_URL` | **Sim** | URL canônica da aplicação em produção | `https://seu-dominio.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | **Sim** | URL pública exposta ao cliente | `https://seu-dominio.vercel.app` |
| `GEMINI_API_KEY` | **Sim** | Chave da API Google Gemini para o agente conversacional | `AIzaSy...` |
| `OPENAI_API_KEY` | Não | Chave OpenAI (provedor alternativo de LLM) | `sk-proj-...` |
| `ANTHROPIC_API_KEY` | Não | Chave Anthropic Claude (provedor alternativo) | `sk-ant-...` |
| `EVOLUTION_API_URL` | Não | Endpoint da instância Evolution API para WhatsApp | `https://api.seudominio.com` |
| `EVOLUTION_API_KEY` | Não | Chave de autenticação da Evolution API | `sua-api-key` |
| `MERCADO_PAGO_ACCESS_TOKEN` | Não | Token de produção do gateway Mercado Pago | `APP_USR-...` |

---

## 🛠️ Scripts Principais do Monorepo

| Comando | Descrição |
| :--- | :--- |
| `pnpm dev` | Inicia o ambiente de desenvolvimento de todas as aplicações e pacotes via Turborepo |
| `pnpm build` | Compila todo o monorepo em modo de produção com cache incremental |
| `pnpm test` | Executa a suíte de testes unitários com Vitest |
| `pnpm typecheck` | Validação estática de tipos TypeScript em todos os workspaces |
| `pnpm lint` | Validação de ESLint em todos os pacotes |
| `pnpm db:generate` | Gera o Prisma Client de referência em `@concierge/database` (ORM de runtime é Drizzle — ver ADR-009) |
| `pnpm db:push` | Sincroniza o schema Prisma com o banco (DDL de referência — runtime usa Drizzle) |
| `pnpm db:studio` | Abre o Prisma Studio para inspeção visual do banco |
| `pnpm db:seed` | Executa o seed de demonstração (restaurante demo, produtos, categorias) |

---

## 🏛️ Governança e Regras de Ouro

O projeto é regido por diretrizes estritas documentadas na pasta [`.agent/`](./.agent/):

- 📜 [**Constituição do Projeto (.agent/CONSTITUTION.md)**](./.agent/CONSTITUTION.md): Hierarquia inegociável de regras, comissão de 0,5%, cálculos em centavos, multi-tenancy e protocolo de 11 etapas (v2.0).
- 🧭 [**Resumo de Contexto (`.agent/CONTEXT.md`)**](./.agent/CONTEXT.md): Guia executivo de estado atual e módulos para novos chats e desenvolvedores.
- 📐 [**Registro de Decisões Técnicas (`.agent/DECISIONS.md`)**](./.agent/DECISIONS.md): ADRs detalhando escolhas de monorepo, banco Neon, autenticação e deploy.
- 📝 [**Changelog Oficial (`CHANGELOG.md`)**](./CHANGELOG.md): Histórico completo de versões e alterações do projeto.

---

## 📊 Status Atual do Projeto

| Módulo | Status | Observação |
| :--- | :---: | :--- |
| **Estrutura Monorepo** | 🟢 Concluído | Turborepo + pnpm workspaces com cache e pipelines configurados |
| **Módulo de Pedidos (Orders)** | 🟢 Concluído | Portado do legado Degusta, 100% tipado, cálculos em centavos e regras de opções |
| **Banco de Dados & Schema** | 🟢 Concluído | Drizzle ORM em runtime + Neon (Connection Pooling). Prisma como referência de schema (ADR-009). |
| **Infraestrutura de Deploy** | 🟢 Concluído | Vercel configurada, caminhos corrigidos, scripts de prebuild e env vars mapeadas |
| **Governança & Documentação** | 🟢 Concluído | Constituição, Contexto, ADRs, Changelog e README completos |
| **Agente Concierge (Chat)** | 🟡 Em Andamento | Rotas preparadas; conexão com streaming Gemini e tools em desenvolvimento |
| **Pagamentos Pix** | 🟡 Em Andamento | Webhooks de confirmação e split financeiro em implementação |
| **Canal WhatsApp** | ⚪ Planejado | Integração via Evolution API para atendimento conversacional |

---

*Desenvolvido com foco em engenharia de excelência, integridade matemática e segurança.*
