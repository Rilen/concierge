# Arquitetura do Sistema Concierge / Ostras.ai

## 1. Visão Geral
O **Concierge / Ostras.ai** é uma plataforma marketplace de gastronomia, reservas e serviços locais baseada em agentes de IA e arquitetura limpa (Clean Architecture) estruturada em Monorepo com **pnpm workspaces** e **Turborepo**.

O projeto unifica:
1. **Agente Conversacional Concierge**: Atendimento com linguagem natural no Web e WhatsApp (Evolution API).
2. **Módulo de Pedidos & Delivery (evolução do Degusta / Paladar)**: Cardápio online próprio, validação rigorosa de regras de opções de produtos, sanitização pública de pedidos (Zero IDOR / BOLA) e comissão de 0,5%.
3. **Módulo de Reservas**: Agendamento de mesas e controle de capacidade para restaurantes parceiros.
4. **Módulo de Matching & Descoberta**: Algoritmo de busca por culinária, proximidade, faixa de preço e status do estabelecimento.
5. **Divisão de Receita (Commission & Ledger)**: Gestão financeira transparente com registros imutáveis.

---

## 2. Mapa do Monorepo

```
concierge/
├── apps/
│   └── web/                           # Aplicação Next.js 16 (App Router)
│       ├── src/app/                   # Rotas públicas, pedidos (/r/[slug]), tracking (/pedido/[id]) e dashboard
│       ├── src/modules/orders/        # Componentes, contexto de carrinho, actions e serviços de pedidos
│       └── src/modules/concierge/     # Interface de chat e hooks do Concierge
├── packages/
│   ├── core/                          # Domínio puro (sem dependência de framework ou banco)
│   │   ├── src/orders/                # Cálculos, validação server-side, projeção sanitizada, testes
│   │   ├── src/agents/                # Tipos de conversação, intenções e contratos de tools
│   │   ├── src/bookings/              # Regras de reserva de mesas e capacidade
│   │   ├── src/matching/              # Algoritmo de ranking e recomendação
│   │   ├── src/commission/            # Cálculos de comissão (0,5%) e split financeiro
│   │   └── src/types/                 # Tipos comuns (Result, Money, Address, Tenancy)
│   ├── ai/                            # Orquestração de Agentes, Prompts, Tools e RAG
│   │   ├── src/agents/                # Concierge Orchestrator
│   │   ├── src/tools/                 # Tools de busca de cardápio, criação de rascunho de pedido e reservas
│   │   ├── src/prompts/               # System prompt do Concierge
│   │   ├── src/providers/             # Abstração de provedores LLM (Gemini, OpenAI, Claude)
│   │   └── src/rag/                   # Recuperação semântica (RAG) do catálogo
│   ├── database/                      # Prisma ORM
│   │   ├── prisma/schema.prisma       # Schema unificado do banco relacional PostgreSQL
│   │   └── src/client.ts              # Singleton com pool de conexões para serverless
│   ├── ui/                            # Design System compartilhado
│   │   ├── src/components/            # Button, Card, Badge, Input, StatusBadge
│   │   └── src/lib/utils.ts           # Utilitário cn (clsx + tailwind-merge)
│   └── config/                        # Configurações compartilhadas (TypeScript, ESLint)
├── prisma/                            # Referência do schema na raiz para CLI
├── scripts/                           # Scripts operacionais de setup e seed
├── docs/                              # Documentação do projeto, Constituição e Histórico
└── legacy/                            # Backup e isolamento de versões anteriores
```

---

## 3. Integração do Módulo de Pedidos (Degusta / Paladar)
O código útil do Degusta foi desacoplado segundo as seguintes fronteiras:
1. **Regras de Negócio e Cálculos**:
   - `packages/core/src/orders/calculations.ts` (operações monetárias em centavos inteiros, cálculo de taxa da plataforma de 0,5%, máquina de estados do pedido).
   - `packages/core/src/orders/validation.ts` (validação de autoridade de seleção de opções e limites `minSelect`/`maxSelect`).
   - `packages/core/src/orders/sanitizer.ts` (sanitização de dados sensíveis na consulta pública de pedidos).
   - `packages/core/src/orders/validators.ts` (schemas Zod de validação de formulários).
2. **Camada de Interface & Aplicação**:
   - `apps/web/src/modules/orders/` (carrinho, formulário de checkout, modal de personalização de produtos/pizzas, kanban de cozinha, rastreador).
   - `apps/web/src/app/r/[slug]` e `apps/web/src/app/pedido/[publicId]`.
3. **Persistência**:
   - Mapeado no `schema.prisma` com tabelas equivalentes (`Restaurant`, `Category`, `Product`, `ProductOptionGroup`, `ProductOption`, `Customer`, `Order`, `OrderItem`, `OrderItemOption`, `OrderStatusHistory`, `Payment`).

---

## 4. Princípios da Constituição do Projeto (Regras de Ouro)
1. **Servidor é a Autoridade**: Nunca confiar no cliente para preço, total, estoque ou validações de opções.
2. **Dinheiro sem Float**: Aritmética financeira sempre em inteiros (centavos) com arredondamento seguro.
3. **Pedido é Histórico Imutável**: O pedido grava snapshot completo do produto, nome, preço e opções no momento da compra.
4. **Isolamento Multi-tenant e Zero IDOR/BOLA**: Chaves públicas unguessable (`publicId`) para rastreamento sem vazamento de identificadores internos.
5. **Comissão Justa**: Alíquota padrão de 0,5% sobre os pedidos gerados pela plataforma.
