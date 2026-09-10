# 🛎️ Concierge / Ostras.ai

> **Marketplace de Gastronomia, Pedidos & Reservas impulsionado por Agentes de IA.**  
> Arquitetura Monorepo Moderna com **Next.js (App Router)**, **TypeScript**, **Clean Architecture**, **Prisma** e **Turborepo**.

---

## 🌟 Visão Geral do Projeto

O **Concierge (Ostras.ai)** é um ecossistema conversacional e transacional voltado para o comércio e turismo local. Ele combina:
1. **Agente Inteligente Concierge**: Interação conversacional via Web e WhatsApp (Evolution API) para descoberta gastronômica, sugestões personalizadas e atendimento ágil.
2. **Módulo de Pedidos & Delivery**: Evolução da plataforma *Degusta / Paladar*, provendo cardápio digital próprio, cálculo monetário seguro em centavos inteiros, validação server-side de opções e taxa transparente de **0,5%**.
3. **Módulo de Reservas de Mesas**: Agendamento com controle de capacidade e confirmação em tempo real.
4. **Matching & Descoberta**: Algoritmo de recomendação baseado em intenções, preferências culinárias, proximidade e horário de funcionamento.
5. **Ledger & Split Financeiro**: Registro auditável de repasses e comissões da plataforma.

---

## 📁 Arquitetura do Monorepo

```
concierge/
├── apps/
│   └── web/                           # Aplicação Principal (Next.js 16 App Router)
│       ├── src/app/
│       │   ├── page.tsx               # Portal Concierge com chat interativo & busca
│       │   ├── r/[slug]/              # Cardápio digital do restaurante (Delivery/Retirada)
│       │   ├── pedido/[publicId]/     # Rastreamento do pedido pelo cliente em tempo real
│       │   ├── gestao/                # Kanban de cozinha e gestão de pedidos do restaurante
│       │   ├── admin/                 # Painel administrativo master
│       │   └── api/                   # Rotas de API (Concierge AI, Pedidos, Webhooks)
│       ├── src/modules/
│       │   ├── orders/                # Componentes, contexto de carrinho, actions e serviços de pedidos
│       │   └── concierge/             # Componentes de chat e hooks do agente
│       └── package.json
│
├── packages/
│   ├── core/                          # Domínio Puro de Negócio (Framework Agnostic)
│   │   ├── src/orders/                # Cálculos, validação server-side, sanitizador, testes
│   │   ├── src/agents/                # Tipos de conversa, intenções e contratos de tools
│   │   ├── src/bookings/              # Entidades e regras de capacidade de reservas
│   │   ├── src/matching/              # Algoritmo de relevância e recomendação
│   │   ├── src/commission/            # Regras da taxa de 0,5% e divisão financeira
│   │   └── src/types/                 # Entidades e value objects comuns (Result, Money, Address)
│   │
│   ├── ai/                            # Inteligência Artificial & LLM Orchestration
│   │   ├── src/agents/                # Concierge Orchestrator e loops de agente
│   │   ├── src/tools/                 # Tools: search_catalog, create_order_draft, track_order, book_table
│   │   ├── src/prompts/               # System prompt mestre do Concierge
│   │   ├── src/providers/             # Abstração de provedores (Gemini, OpenAI, Anthropic)
│   │   └── src/rag/                   # Recuperação semântica e catálogo vetorial
│   │
│   ├── database/                      # Camada de Dados (Prisma ORM)
│   │   ├── prisma/schema.prisma       # Schema unificado PostgreSQL
│   │   └── src/client.ts              # Singleton com pool de conexões para serverless
│   │
│   ├── ui/                            # Design System Compartilhado
│   │   ├── src/components/            # Button, Card, Badge, StatusBadge, Input
│   │   └── src/lib/utils.ts           # Utilitário cn (clsx + tailwind-merge)
│   │
│   └── config/                        # Configurações Compartilhadas
│       └── tsconfig.base.json         # Presets de TypeScript
│
├── prisma/
│   └── schema.prisma                  # Referência direta do schema para CLI na raiz
├── scripts/
│   └── setup.js                       # Script de diagnóstico e inicialização do ambiente
├── docs/
│   ├── CONSTITUTION.md                # Regras de ouro de engenharia e integridade
│   ├── architecture/                  # Detalhes de arquitetura e decisões técnicas
│   └── legacy-orders/                 # Histórico completo de desenvolvimento do Degusta
├── legacy/
│   └── degusta-v1/                    # Backup integral do projeto anterior (isolado e preservado)
├── .env.example                       # Variáveis de ambiente completas e documentadas
├── package.json                       # Scripts globais do Turborepo
├── pnpm-workspace.yaml                # Definição dos workspaces do pnpm
├── turbo.json                         # Pipeline de build e cache do Turborepo
└── README.md
```

---

## 🍕 Integração do Módulo Degusta / Paladar

O código original do projeto de pedidos online foi reorganizado estrategicamente:
1. **Domínio Puro (`packages/core/src/orders/`)**:
   - **`calculations.ts`**: Cálculos financeiros realizados unicamente em centavos inteiros (`cents = Math.round(val * 100)`), eliminando erros de ponto flutuante IEEE-754.
   - **`validation.ts`**: Autoridade server-side para validação da árvore de opções (`minSelect`, `maxSelect`, grupos obrigatórios e vínculo de tenant).
   - **`sanitizer.ts`**: Projeção de rastreamento de pedidos segura que **nunca vaza** margens internas (`platformFee`), identificadores de operadores (`changedBy`) ou dados confidenciais (Zero IDOR / BOLA / LGPD by Design).
   - **`validators.ts`**: Schemas de validação Zod para cardápio, pedidos e pizzas de 1 a 4 sabores.
   - **Suítes de Teste Vitest**: 100% dos testes do Degusta foram portados e preservados.
2. **Interface e Aplicação (`apps/web/src/modules/orders/`)**:
   - Componentes visuais (`cart-floating-bar`, `checkout-form`, `product-customizer`, `order-tracker`, `operator-order-board`, `menu-manager`, `restaurant-settings-form`).
   - Contexto de carrinho (`cart-context.tsx`).
   - Serviços e Server Actions de pedidos, cardápio e gestão.
3. **Backup Completo (`legacy/degusta-v1/`)**:
   - O projeto anterior foi arquivado intacto para consulta e rastreabilidade histórica.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js**: Versão 20.x ou superior.
- **pnpm**: Versão 9.x ou superior (caso não tenha instalado globalmente, utilize `npx pnpm` ou `npm install -g pnpm`).

### 1. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e preencha as credenciais:
```bash
cp .env.example .env
```
Principais chaves:
- `DATABASE_URL`: Conexão PostgreSQL (Neon, Supabase ou local).
- `GEMINI_API_KEY`: Chave da API Google Gemini para o agente Concierge.
- `EVOLUTION_API_URL` & `EVOLUTION_API_KEY`: Gateway para WhatsApp (opcional para desenvolvimento local).

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Preparar o Banco de Dados
```bash
# Gerar o client Prisma
pnpm db:generate

# Sincronizar o schema com o banco
pnpm db:push

# (Opcional) Executar seed inicial
pnpm db:seed
```

### 4. Iniciar o Ambiente de Desenvolvimento
```bash
pnpm dev
```
Acesse:
- **Portal Concierge & Chat de IA**: [http://localhost:3000](http://localhost:3000)
- **Cardápio Demo**: [http://localhost:3000/r/pizzaria-demo](http://localhost:3000/r/pizzaria-demo)
- **Painel de Gestão de Pedidos**: [http://localhost:3000/gestao](http://localhost:3000/gestao)

---

## 🛠️ Scripts Principais do Monorepo

| Comando | Descrição |
| :--- | :--- |
| `pnpm dev` | Inicia todas as aplicações e pacotes em modo desenvolvimento via Turborepo |
| `pnpm build` | Executa o build de produção de todo o monorepo com cache incremental |
| `pnpm test` | Executa todas as suítes de testes unitários (Vitest) |
| `pnpm typecheck` | Validação estática de tipos TypeScript em todos os workspaces |
| `pnpm lint` | Validação de ESLint em todo o código |
| `pnpm db:generate` | Gera o cliente do Prisma no workspace `@concierge/database` |
| `pnpm db:push` | Aplica o schema Prisma diretamente ao banco sem migrações |
| `pnpm db:studio` | Abre a interface visual do Prisma Studio no navegador |
| `pnpm db:seed` | Executa o script de seed para criar dados demonstrativos |

---

## 🏛️ Governança e Regras de Ouro
O projeto segue a **Constituição do Projeto** localizada em [`docs/CONSTITUTION.md`](./docs/CONSTITUTION.md).  
Todo desenvolvimento deve respeitar:
1. **Segurança e Integridade dos Dados** em 1º lugar.
2. **Servidor é a Autoridade**: Cálculos e validações nunca confiam no cliente.
3. **Imutabilidade de Histórico**: Pedidos congelam dados no momento da compra.
4. **Comissão Justa de 0,5%**: Alíquota padrão do ecossistema.
