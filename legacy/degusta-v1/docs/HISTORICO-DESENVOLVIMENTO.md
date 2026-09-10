# PALADAR — HISTÓRICO DE DESENVOLVIMENTO E REGISTRO DE ALTERAÇÕES

**Projeto:** PALADAR  
**Documento:** Registro Permanente de Decisões Técnicas, Mudanças Arquiteturais e Auditorias  
**Norma de Governança:** CONSTITUIÇÃO DO PROJETO E REGRAS DE OURO (Versão 1.0)  

---

## REGISTRO DE ALTERAÇÃO: 2026-09-09 — IMPLEMENTAÇÃO DAS CORREÇÕES PÓS-AUDITORIA (C1 A C5)

* **Data:** 09 de setembro de 2026
* **Agente Responsável:** Antigravity (Arquiteto de Software e Engenheiro Full-Stack Sênior)
* **Objetivo:** Correção técnica obrigatória das quatro inconsistências identificadas na auditoria formal do MVP e blindagem matemática de cálculos monetários antes do avanço para o Neon PostgreSQL e deploy na Vercel.

---

### 1. MOTIVAÇÃO E CORREÇÕES IMPLEMENTADAS

#### C1 — Validação Server-Side da Árvore de Opções do Produto
* **O que mudou:** Implementada validação pura de domínio em [`src/domain/orders/validation.ts`](../src/domain/orders/validation.ts) e integrada diretamente ao serviço [`createCustomerOrder`](../src/services/order.service.ts). O backend agora busca a árvore relacional completa (`products` -> `productOptionGroups` -> `productOptions`) pertencente ao restaurante (`restaurantId`) e valida:
  1. Se o produto existe, está ativo e pertence ao restaurante do pedido;
  2. Se cada opção selecionada pertence de fato a um grupo daquele produto;
  3. Se cada opção está ativa e vinculada ao mesmo `restaurantId`;
  4. Se grupos obrigatórios (`required: true`) possuem ao menos uma opção escolhida;
  5. Se a quantidade de opções selecionadas por grupo respeita rigorosamente os limites `minSelect` e `maxSelect`.
* **Por que mudou:** A auditoria constatou que o endpoint de criação de pedidos confiava na seleção de opções enviada pelo cliente sem validar se as opções pertenciam ao produto ou se os limites de seleção foram respeitados.
* **Artigos da Constituição Aplicáveis:**
  - **Artigo 7 (Single Source of Truth):** Regras de negócio determinadas unicamente pelo servidor.
  - **Artigo 8 (Servidor é a Autoridade):** Proibição absoluta de confiar no cliente para validação de opções, limites e preços.
  - **Artigo 13 (Multi-tenancy Obrigatório):** Verificação de que todas as opções e produtos pertencem ao `restaurantId`.

#### C2 — Sanitização e Projeção Segura da Consulta Pública de Pedidos
* **O que mudou:** Criado o módulo de projeção segura [`src/domain/orders/sanitizer.ts`](../src/domain/orders/sanitizer.ts) com a função [`sanitizePublicOrder`](../src/domain/orders/sanitizer.ts). A consulta pública via [`getOrderByPublicId`](../src/services/order.service.ts) e o endpoint [`/api/order/[publicId]`](../src/app/api/order/[publicId]/route.ts) agora devolvem exclusivamente um tipo sanitizado `PublicOrder`.
* **Campos mascarados/omitidos:**
  - `orders.platformFee`: Removido permanentemente da projeção pública. A taxa de intermediação comercial de 0,5% é informação corporativa interna do PALADAR com o restaurante, jamais visível para o cliente final.
  - `orderStatusHistory.changedBy`: Removido permanentemente da projeção pública. Identificadores de operadores, garçons ou usuários internos do sistema não são vazados para a internet.
  - `orders.customerId`: Omitido da projeção pública por se tratar de chave estrangeira relacional interna.
  - Metadados ou configurações privadas do restaurante: Omitidos.
* **Por que mudou:** A auditoria identificou que a consulta pública expunha o objeto bruto do pedido com chaves internas e histórico completo sem sanitização.
* **Artigos da Constituição Aplicáveis:**
  - **Artigo 1 (Hierarquia das Regras):** Segurança e Privacidade/LGPD acima de conveniência de implementação.
  - **Artigo 14 (Zero IDOR/BOLA e Tokens Unguessable):** Rastreamento restrito estritamente a tokens públicos sem vazamento de chaves ou dados internos.
  - **Artigo 20 (LGPD by Design):** Princípio da minimização de dados na interface pública.

#### C3 — Atomicidade de Criação do Pedido via Lote Transacional no Neon HTTP
* **O que mudou:** A gravação de pedidos em [`createCustomerOrder`](../src/services/order.service.ts) foi refatorada. Como o driver serverless `drizzle-orm/neon-http` não suporta transações interativas (`db.transaction` lança exceção em tempo de execução), os identificadores UUIDs primários e estrangeiros (`orderId`, `orderItemId`, `orderItemOptionId`, `customerId`) são agora pré-gerados deterministicamente na memória da aplicação via `crypto.randomUUID()`. Todas as operações (criação/atualização de cliente, inserção do pedido, inserção de itens, inserção de opções, inserção de histórico de status e inserção de pagamento) são reunidas em um array e submetidas em uma única requisição de lote via `await db.batch([...])`.
* **Comportamento em falha:** Se qualquer query do lote falhar, o endpoint HTTP do Neon executa ROLLBACK de todas as instruções. Nenhuma linha órfã (pedido sem itens, itens sem pedido ou cliente com saldo inconsistente) é persistida.
* **Por que mudou:** A persistência anterior executava 6 a 15 chamadas HTTP individuais consecutivas sem transação, deixando o banco suscetível a corrupção parcial caso a conexão caísse no meio do processo.
* **Artigos da Constituição Aplicáveis:**
  - **Artigo 1 (Integridade dos Dados):** Integridade relacional inegociável.
  - **Artigo 10 (Pedido é Histórico Imutável):** Preservação atômica do snapshot integral de compra.
  - **Artigo 80 (Atomicidade de Pedidos):** O pedido e seus relacionamentos nascem simultaneamente ou não nascem.

#### C4 — Unicidade e Concorrência do Número Sequencial do Pedido (`orderNumber`)
* **O que mudou:**
  1. Schema Drizzle atualizado em [`src/db/schema.ts`](../src/db/schema.ts) com índice único composto:
     `uniqueIndex("orders_restaurant_order_number_idx").on(table.restaurantId, table.orderNumber)`.
  2. Gerada a migration SQL [`drizzle/0001_peaceful_the_phantom.sql`](../drizzle/0001_peaceful_the_phantom.sql).
  3. Implementado loop de retentativa em [`src/services/order.service.ts`](../src/services/order.service.ts) limitado a 5 tentativas (`MAX_RETRIES = 5`). Caso ocorra colisão de concorrência simultânea (código PostgreSQL `23505`), o serviço aguarda um backoff progressivo (`20ms * attempt`), busca o novo maior `orderNumber` do restaurante e reexecuta o lote atômico. Se o limite de 5 tentativas for atingido, a exceção é propagada de forma controlada.
* **Por que mudou:** A consulta simples de `findFirst` sujeitava o sistema a colisões e erros 500 caso dois clientes finalizassem pedidos na mesma fração de segundo para o mesmo restaurante.
* **Artigos da Constituição Aplicáveis:**
  - **Artigo 1 (Integridade dos Dados e Isolamento Multi-tenant):** Garante unicidade da numeração do pedido por restaurante, inclusive sob concorrência.
  - **Artigo 2 (Não quebrar o que já funciona):** Resiliência operacional sob carga concorrente.

#### C5 — Padronização dos Cálculos Financeiros em Centavos Inteiros
* **O que mudou:** Todas as operações aritméticas em [`src/domain/orders/calculations.ts`](../src/domain/orders/calculations.ts) foram convertidas para aritmética exata de inteiros em centavos (`cents = Math.round(val * 100)`). A conversão para reais ocorre unicamente no retorno final por divisão por 100.
* **Regra Comercial da Comissão:**
  > **A comissão PALADAR permanece estritamente em 0,5% do valor bruto do pedido, conforme regra estabelecida no Artigo 40 da Constituição do Projeto.**
  Calculada via `calculatePlatformFee(total) = Math.round(totalCents * 0.005) / 100`.
* **Por que mudou:** Eliminar risco de distorção cumulativa por imprecisão de frações decimais em ponto flutuante IEEE-754.
* **Artigos da Constituição Aplicáveis:**
  - **Artigo 9 (Dinheiro):** Proibição de ponto flutuante para contas financeiras; operações em centavos inteiros.
  - **Artigo 40 (Comissão Paladar):** Alíquota de 0,5% sobre o valor bruto auditável do pedido.

---

### 2. MATRIZ DE RASTREABILIDADE DA CONSTITUIÇÃO

| Correção | Artigos da Constituição | Arquivos Afetados | Evidência de Teste |
| :--- | :--- | :--- | :--- |
| **C1** | Art. 7, Art. 8, Art. 13 | `src/domain/orders/validation.ts`<br>`src/services/order.service.ts` | `src/domain/orders/validation.test.ts`<br>`src/services/order.service.test.ts` |
| **C2** | Art. 1, Art. 14, Art. 20 | `src/domain/orders/sanitizer.ts`<br>`src/services/order.service.ts`<br>`src/app/api/order/[publicId]/route.ts` | `src/domain/orders/sanitizer.test.ts`<br>`src/services/order.service.test.ts` |
| **C3** | Art. 1, Art. 10, Art. 80 | `src/services/order.service.ts` | `src/services/order.service.test.ts`<br>Código-fonte de `@neondatabase/serverless` e `drizzle-orm` |
| **C4** | Art. 1, Art. 2, Art. 13 | `src/db/schema.ts`<br>`drizzle/0001_peaceful_the_phantom.sql`<br>`src/services/order.service.ts` | `src/services/order.service.test.ts` |
| **C5** | Art. 9, Art. 40 | `src/domain/orders/calculations.ts` | `src/domain/orders/calculations.test.ts` |

---

### 3. ALTERAÇÕES NO BANCO DE DADOS

* **Migration Criada:** [`drizzle/0001_peaceful_the_phantom.sql`](../drizzle/0001_peaceful_the_phantom.sql)
* **Tabela Afetada:** `orders`
* **Operação:** Criação de índice único composto:
  ```sql
  CREATE UNIQUE INDEX "orders_restaurant_order_number_idx" ON "orders" USING btree ("restaurant_id","order_number");
  ```
* **Impacto:** Garante unicidade da numeração do pedido por restaurante, inclusive sob concorrência.
* **Rollback Possível:** `DROP INDEX IF EXISTS "orders_restaurant_order_number_idx";`

---

### 4. EVIDÊNCIAS DE TESTES E VERIFICAÇÃO AUTOMATIZADA

Execução realizada em 09/09/2026 com aprovação integral (100% PASS):

1. **`npm run lint`:** 0 erros, 0 avisos.
2. **`npm run typecheck`:** 0 erros de tipagem TypeScript estrita.
3. **`npm run test` (Vitest):**
   - `src/domain/orders/validation.test.ts`: 7 testes aprovados.
   - `src/domain/orders/sanitizer.test.ts`: 5 testes aprovados.
   - `src/domain/orders/calculations.test.ts`: 19 testes aprovados.
   - `src/services/order.service.test.ts`: 7 testes aprovados.
   - **Total:** 38 testes executados e aprovados.
4. **`npm run build`:** Compilação de produção Next.js 16.3.4 (Turbopack) bem-sucedida, com todas as 17 rotas estáticas e dinâmicas geradas sem falhas.

---

### 5. RISCOS RESIDUAIS E LIMITAÇÕES TÉCNICAS

1. **Atomicidade no Neon HTTP (C3):**
   - *Evidência Documental/Estática:* Comprovada no código de `@neondatabase/serverless` (método `transaction` que encapsula o lote em `POST` transacional com cabeçalhos `Neon-Batch-*`).
   - *Evidência Empírica Local:* Não pôde ser testada contra banco PostgreSQL real localmente pela ausência de servidor PostgreSQL em execução no ambiente do agente (porta 5432 fechada e `DATABASE_URL` placeholder).
   - *Classificação:* **Aprovado com ressalva documental; validação empírica de rollback pendente de teste em ambiente controlado de staging no Neon.**
2. **Concorrência Extrema (C4):**
   - Em cenários com mais de 5 requisições colidindo no mesmo restaurante no intervalo de 100ms, o sistema abortará a 5ª tentativa para evitar consumo excessivo de conexões serverless, retornando erro amigável ao cliente.

---

### 6. PENDÊNCIAS ANTES DO GO-LIVE

1. Executar `npm run db:migrate` no banco Neon de desenvolvimento/staging provisionado.
2. Executar teste empírico de rollback no banco Neon de desenvolvimento provocando erro forçado em uma query intermediária de um lote `db.batch`.
3. Provisionar variáveis de ambiente seguras na Vercel (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).

---

## REGISTRO DE ALTERAÇÃO: 2026-09-09 — TENTATIVA DE PROVISIONAMENTO NEON DEV, VALIDAÇÃO DE CONECTIVIDADE E TESTE C3

* **Data:** 09 de setembro de 2026
* **Agente Responsável:** Antigravity (Arquiteto de Software e Engenheiro Full-Stack Sênior)
* **Objetivo:** Provisionar e validar o primeiro ambiente Neon PostgreSQL de desenvolvimento/staging, executar migrations, validar schema real, comprovar empiricamente o rollback do C3 (`db.batch`) e validar unicidade do C4 em banco ativo.
* **Ambiente Alvo:** Neon DEV / STAGING (exclusivo para desenvolvimento, sem dados reais).

### 1. Inspeção de Configuração e Credenciais
* `.gitignore`: Verificado. As regras `.env*` e `!.env.example` asseguram proteção rigorosa de secrets.
* `.env`: Inspecionado. Contém `DATABASE_URL` com valor placeholder de exemplo (`ep-sample-123456...`). Configurada variável de desenvolvimento `BETTER_AUTH_SECRET`.
* `.env.example`: Atualizado com o placeholder de `BETTER_AUTH_SECRET`.
* `src/lib/auth.ts`: Atualizado para reconhecer `process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET`.

### 2. Teste de Conectividade com o Banco de Dados
* **Comando de Teste:** Conexão via driver `@neondatabase/serverless` executando `SELECT 1`.
* **Resultado:** `DATABASE CONNECTION: FAIL`
* **Motivo:** `password authentication failed for user 'user'`. A URL configurada no `.env` é um endpoint fictício (`ep-sample-123456.us-east-2.aws.neon.tech/neondb`) com credenciais de exemplo (`user:password`).
* **Critério de Parada Acionado:** Conforme PARTE 4 e PARTE 17 das regras do projeto, ao falhar a conectividade a execução deve **PARAR imediatamente** sem tentar contornar por suposição ou mockar operações de banco real.

### 3. Impacto nas Etapas Subsequentes
* **Migration (`npm run db:migrate`):** NÃO EXECUTADA devido à ausência de banco conectado.
* **Validação de Schema Real:** NÃO EXECUTADA.
* **Seed Oficial (`src/db/seed.ts`):** NÃO EXECUTADO.
* **Teste Empírico de Rollback C3:** NÃO EXECUTADO / NÃO COMPROVADO EMPIRICAMENTE em banco real.
* **Teste de Concorrência C4 em Banco Real:** NÃO EXECUTADO em banco real.

### 4. Estado da Suíte Local de Testes e Código
A integridade de todo o código da aplicação foi revalidada localmente com 100% de sucesso:
* `npm run lint`: 0 erros, 0 avisos.
* `npm run typecheck`: 0 erros de compilação TypeScript estrita.
* `npm test`: 4 suítes, 38 testes aprovados.
* `npm run build`: Build de produção Next.js 16.3.4 (Turbopack) bem-sucedido com todas as 17 rotas estáticas e dinâmicas geradas.

### 5. Riscos e Pendências
* **Risco Imediato:** Impossibilidade de atestar o comportamento transacional do Neon em tempo de execução enquanto a connection string real de desenvolvimento não estiver provisionada no `.env`.
* **Pendência Bloqueante:** O desenvolvedor/operador deve criar ou fornecer uma branch/instância de desenvolvimento no Neon e inserir a `DATABASE_URL` válida no arquivo `.env` (ex: `postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require`).

### 6. Decisão de Governança
* **Status:** **BLOQUEADO** (aguardando credencial de desenvolvimento).
* **Autorização para Vercel:** **NÃO** (o banco de staging deve ser conectado e validado antes do deploy de infraestrutura).

---

## REGISTRO DE ALTERAÇÃO: 2026-09-09 — CONEXÃO NEON DEV, MIGRATION, SEED E COMPROVAÇÃO EMPÍRICA DE C3 E C4

* **Data:** 09 de setembro de 2026
* **Agente Responsável:** Antigravity (Arquiteto de Software e Engenheiro Full-Stack Sênior)
* **Objetivo:** Aplicar migrations no banco Neon PostgreSQL de desenvolvimento/staging, validar catálogo físico, executar seed oficial, comprovar empiricamente o rollback atômico do C3 (`db.batch`) e a unicidade multi-tenant do C4 (`orders_restaurant_order_number_idx`).
* **Ambiente Alvo:** Neon DEV / STAGING (exclusivo para desenvolvimento, sem dados reais).

### 1. Conectividade com Neon PostgreSQL
* **Status:** `DATABASE CONNECTION: PASS`
* O endpoint de desenvolvimento foi conectado via driver `@neondatabase/serverless` com verificação de `SELECT version()`, atestando compatibilidade completa com PostgreSQL 16+ no ambiente serverless. Nenhuma credencial ou URL sensível foi exposta em logs ou relatórios.

### 2. Execução de Migrations Oficiais
* **Comando Executado:** `npm run db:migrate` (`drizzle-kit migrate`).
* **Migrations Aplicadas com Sucesso:**
  1. `0000_blushing_blizzard.sql`: Criação de 29 tabelas relacionais do sistema (restaurantes, categorias, produtos, grupos de opções, opções, pedidos, itens, histórico, pagamentos, usuários, sessões, contas, estoque).
  2. `0001_peaceful_the_phantom.sql`: Criação do índice único composto `orders_restaurant_order_number_idx` em `orders(restaurant_id, order_number)`.
* **Tabela de Controle do Drizzle:** `__drizzle_migrations` inicializada e atualizada com hash e timestamp de ambas as migrações.

### 3. Validação do Schema Físico no PostgreSQL
* **Tabelas Criadas:** 29 tabelas no schema `public`.
* **Tipos Numéricos em `orders`:**
  - `subtotal`: `numeric(10, 2)` (zero `float`).
  - `delivery_fee`: `numeric(10, 2)`.
  - `discount`: `numeric(10, 2)`.
  - `total`: `numeric(10, 2)`.
  - `platform_fee`: `numeric(10, 2)`.
* **Índice Único C4 Físico:**
  - Comprovado no catálogo do PostgreSQL (`pg_indexes` e `pg_class`):
    `CREATE UNIQUE INDEX orders_restaurant_order_number_idx ON public.orders USING btree (restaurant_id, order_number)`.

### 4. Execução do Seed Oficial de Desenvolvimento
* **Comando Executado:** `npm run db:seed` (`src/db/seed.ts`).
* **Registros Criados:**
  - Usuários demo com senhas hashed Argon2:
    - Master / Superadmin (`master@paladar.local`)
    - Gerente (`gerente@pizzaria.local`)
    - Atendente / Pedidos (`pedidos@pizzaria.local`)
    - Cliente Demo (`cliente@exemplo.local`)
  - Restaurante demo: "Pizzaria Demo" (`pizzaria-demo`), com taxas de entrega, comissão padrão e horários.
  - Categorias: "Pizzas Tradicionais", "Pizzas Especiais", "Bebidas".
  - Produtos com grupos de opções ("Tamanho", "Borda Recheada") e adicionais com preços modelados em centavos.
  - Estoque de insumos e produtos.

### 5. Comprovação Empírica do Rollback Atômico (C3)
* **Script de Teste:** [`src/db/test-real-neon.ts`](../src/db/test-real-neon.ts).
* **Metodologia:**
  1. Contagem inicial em `orders`, `order_items`, `order_item_options`, `order_status_history`, `payments`.
  2. Submissão de lote atômico `db.batch([...])` contendo 5 queries (`orders`, `order_items`, `order_item_options`, `order_status_history`, `payments`).
  3. A 5ª query (`payments`) continha propositalmente uma violação de chave estrangeira (`restaurant_id = 00000000-0000-0000-0000-000000000000`).
  4. O Neon PostgreSQL rejeitou o lote inteiro com código de erro `23503` (`foreign_key_violation`).
  5. Contagem posterior e busca pelos UUIDs específicos submetidos:
     - `orders`: contagem inalterada (0 novas linhas, UUID específico não encontrado).
     - `order_items`: contagem inalterada (0 novas linhas, UUID específico não encontrado).
     - `order_item_options`: contagem inalterada (0 novas linhas, UUID específico não encontrado).
     - `order_status_history`: contagem inalterada (0 novas linhas, UUID específico não encontrado).
     - `payments`: contagem inalterada (0 novas linhas).
* **Resultado:** **C3 COMPROVADO EMPIRICAMENTE NO NEON POSTGRESQL REAL**. O driver `@neondatabase/serverless` encapsula chamadas `batch` em requisição transacional HTTP indivisível no PostgreSQL.

### 6. Comprovação Empírica de Unicidade e Multi-Tenancy (C4)
* **Script de Teste:** [`src/db/test-real-neon.ts`](../src/db/test-real-neon.ts).
* **Metodologia:**
  1. **Cenário A (Mesmo Restaurante):**
     - Pedido `#888801` inserido no restaurante A.
     - Tentativa de inserção de segundo pedido com o mesmo número `#888801` no restaurante A.
     - Bloqueio imediato pelo banco com código `23505` (`unique_violation`) na constraint `orders_restaurant_order_number_idx`.
  2. **Cenário B (Outro Tenant / Restaurante B):**
     - Criação de restaurante temporário B.
     - Inserção do pedido com o mesmo número `#888801` no restaurante B.
     - Sucesso confirmado na inserção do pedido no tenant B.
  3. Limpeza completa dos registros e tenants de teste.
* **Resultado:** **C4 COMPROVADO EMPIRICAMENTE NO NEON POSTGRESQL REAL**. Isolamento multi-tenant garantido fisicamente pelo banco.

### 7. Validação Completa de Qualidade
* `npm run lint`: 0 erros, 0 avisos.
* `npm run typecheck`: 0 erros de compilação estrita TypeScript.
* `npm test`: 4 suítes, 38 testes unitários/serviço aprovados (100% PASS).
* `npm run build`: Next.js 16.3.4 Turbopack build de produção aprovado (17 rotas geradas com sucesso).

### 8. Decisão de Governança
* **Status do Ambiente Neon DEV:** **APROVADO E VALIDADO**.
* **Autorização Técnica para Avanço à Vercel:** **SIM** (o projeto atende a todos os requisitos constitucionais, possui schema físico validado, seed funcional e garantias transacionais empíricas comprovadas).

