# 🚀 Guia Oficial de Deploy: Vercel + Neon (PostgreSQL)

Este documento contém o guia definitivo para deploy do monorepo **Concierge (Ostras.ai)** na **Vercel** conectado ao banco de dados serverless **Neon**.

---

## 1. Visão Geral da Arquitetura de Produção

- **Frontend & Serverless Functions:** [Vercel](https://vercel.com) (Hospedando `apps/web` com Next.js 16 App Router).
- **Banco de Dados Relacional:** [Neon](https://neon.tech) (PostgreSQL Serverless com Connection Pooling via PgBouncer).
- **Orquestração Monorepo:** [Turborepo](https://turbo.build) + [pnpm](https://pnpm.io).
- **Camada ORM:** Prisma Client singleton com suporte a serverless pooling.

---

## 2. Passo 1: Preparar o Banco de Dados no Neon

### 2.1 Criar o Projeto no Neon
1. Acesse o console do [Neon](https://console.neon.tech) e faça login.
2. Clique em **"Create Project"**.
3. Defina:
   - **Project Name:** `concierge-production` (ou o nome que preferir)
   - **Postgres Version:** 16 ou 17
   - **Region:** Escolha a região mais próxima dos seus usuários (ex: `AWS us-east-1` ou `sa-east-1` se disponível).
4. Clique em **"Create Project"**.

### 2.2 Obter as Duas Connection Strings (Pooled e Direct)
No painel do Neon, localize a caixa **Connection Details**:

1. **Pooled Connection (`DATABASE_URL`):**
   - Marque a caixa de seleção **"Connection pooling"**.
   - A URL gerada conterá `-pooler` no host e `?sslmode=require`.
   - Exemplo:
     ```text
     postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - *Finalidade:* Utilizada pelas Serverless Functions da Vercel para reaproveitar conexões sem esgotar o pool do Postgres.

2. **Direct Connection (`DIRECT_URL`):**
   - Desmarque a caixa de seleção **"Connection pooling"**.
   - A URL gerada aponta diretamente para o nó primário (porta 5432).
   - Exemplo:
     ```text
     postgresql://user:password@ep-sample.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - *Finalidade:* Utilizada pelo Prisma para aplicar migrações (`prisma db push` / `prisma migrate`), pois transações de DDL exigem conexão direta.

### 2.3 Sincronizar o Schema e Popular o Banco Inicialmente (Localmente)
Antes de disparar o deploy na Vercel, sincronize as tabelas com o Neon:

```bash
# 1. No seu arquivo .env local, preencha as duas URLs obtidas no Neon:
DATABASE_URL="postgresql://user:password@ep-sample-pooler.../neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-sample.../neondb?sslmode=require"

# 2. Sincronize o schema Prisma com o banco Neon:
pnpm db:push

# 3. (Opcional) Crie os dados de demonstração iniciais:
pnpm db:seed
```

---

## 3. Passo 2: Conectar e Configurar na Vercel

### 3.1 Importar o Repositório
1. Acesse o painel da [Vercel](https://vercel.com/dashboard).
2. Clique em **"Add New..."** → **"Project"**.
3. Conecte sua conta GitHub e localize o repositório:
   👉 **`Rilen/concierge`**
4. Clique em **"Import"**.

### 3.2 Configurações de Build & Monorepo (Preset Zero-Config)
O repositório já possui um arquivo [`vercel.json`](../vercel.json) na raiz configurado com as diretrizes do Turborepo:

- **Framework Preset:** `Next.js` (detectado automaticamente)
- **Root Directory:** Deixe `./` (a raiz do projeto).
- **Build Command:** Já controlado pelo `vercel.json` (`turbo run build --filter=@concierge/web...`).
- **Output Directory:** Já controlado pelo `vercel.json` (`apps/web/.next`).
- **Install Command:** A Vercel detecta automaticamente o `pnpm` pelo arquivo `pnpm-lock.yaml` e pela propriedade `packageManager` no `package.json`.

> [!TIP]
> Durante a instalação das dependências (`pnpm install`), o script `postinstall` configurado no `package.json` raiz executa automaticamente `pnpm --filter @concierge/database db:generate`, garantindo que os tipos do Prisma Client estejam prontos antes do build do Next.js!

---

## 4. Passo 3: Configurar Variáveis de Ambiente na Vercel

Na seção **"Environment Variables"** da Vercel, adicione as variáveis abaixo.

### 4.1 Banco de Dados (Obrigatórias)
| Variável | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...@...-pooler.../neondb?sslmode=require` | URL Pooled do Neon |
| `DIRECT_URL` | `postgresql://...@.../neondb?sslmode=require` | URL Direta do Neon para Prisma |

### 4.2 Aplicação & Autenticação (Obrigatórias)
| Variável | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Ambiente de produção |
| `APP_URL` | `https://seu-projeto.vercel.app` | URL de produção gerada pela Vercel |
| `NEXT_PUBLIC_APP_URL` | `https://seu-projeto.vercel.app` | URL pública da aplicação |
| `BETTER_AUTH_SECRET` | `a-random-32-byte-hex-string` | Chave secreta de sessão |
| `BETTER_AUTH_URL` | `https://seu-projeto.vercel.app` | URL base do Better Auth |
| `NEXTAUTH_SECRET` | `a-random-32-byte-hex-string` | Chave secreta alternativa |

### 4.3 Provedores de Inteligência Artificial (Obrigatório ao menos 1)
| Variável | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Chave Google Gemini (Recomendado) |
| `OPENAI_API_KEY` | `sk-proj-...` | Chave OpenAI (Opcional) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Chave Anthropic Claude (Opcional) |

### 4.4 Pagamentos & Canais (Conforme ativação)
| Variável | Descrição |
| :--- | :--- |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token do Mercado Pago |
| `MERCADO_PAGO_PUBLIC_KEY` | Chave pública Mercado Pago |
| `ASAAS_API_KEY` | Chave de API do gateway Asaas |
| `ASAAS_API_URL` | URL do Asaas (`https://api.asaas.com/v3` ou sandbox) |
| `EVOLUTION_API_URL` | URL da instância do WhatsApp Evolution API |
| `EVOLUTION_API_KEY` | API Key da Evolution API |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância do WhatsApp |

---

## 5. Passo 4: Fazer o Primeiro Deploy

1. Com as variáveis preenchidas, clique no botão **"Deploy"**.
2. Acompanhe os logs da Vercel:
   - **Building Dependencies:** `pnpm install` roda e executa `postinstall` gerando o Prisma Client.
   - **Running Turbo Build:** O Turborepo compila `@concierge/database` e na sequência compila `@concierge/web`.
   - **Static & Dynamic Generation:** O Next.js compila todas as rotas estáticas e dinâmicas com sucesso.
3. Ao finalizar, você verá a tela de confetes da Vercel com a URL pública do seu projeto!

---

## 6. Prevenção de Problemas Comuns de Monorepo na Vercel

### Problema 1: `Cannot find module '@prisma/client'` no build
- **Causa:** O Prisma Client não foi gerado antes de o Next.js compilar os arquivos TypeScript.
- **Solução já aplicada:** O script `"postinstall": "pnpm --filter @concierge/database db:generate"` no `package.json` raiz garante a geração durante o install. Adicionalmente, `"serverExternalPackages": ["@prisma/client", "prisma"]` foi configurado no `next.config.ts`.

### Problema 2: Limite de conexões no PostgreSQL durante picos de tráfego
- **Causa:** Serverless Functions abrem conexões simultâneas que excedem a capacidade de conexões diretas do Postgres.
- **Solução já aplicada:** Uso estrito do connection pooler do Neon (`DATABASE_URL` apontando para o endpoint `-pooler` com PgBouncer) e client singleton no `packages/database/src/client.ts`.

### Problema 3: Erro de `Image hostname not configured`
- **Causa:** Next.js bloqueia URLs externas no componente `<Image />` por padrão.
- **Solução já aplicada:** `remotePatterns` configurado no `next.config.ts` para permitir imagens HTTPS de qualquer domínio para logos e fotos de pratos.

### Problema 4: Falha em transações interativas no Neon HTTP
- **Causa:** Drivers serverless HTTP puros não suportam transações de longa duração.
- **Solução já aplicada:** Conforme Artigo 80 da Constituição Paladar, as operações atômicas utilizam IDs pré-gerados (`crypto.randomUUID()`) e operações em lote (`batch`) ou transações via pooling.
