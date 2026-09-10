# 📜 CONCIERGE / OSTRAS.AI — CONSTITUIÇÃO DO PROJETO & REGRAS DE OURO

**Versão:** 2.0  
**Status:** NORMA FUNDAMENTAL E MANDATÓRIA  
**Aplicação:** Todo agente de IA, desenvolvedor, engenheiro de software, automação ou ferramenta que inspecionar, criar ou modificar código neste projeto.

---

## 🏛️ PREÂMBULO

O **Concierge (Ostras.ai)** é um ecossistema inteligente de comércio, gastronomia e turismo local, combinando agentes conversacionais de inteligência artificial com uma infraestrutura transacional completa de pedidos (Delivery/Retirada), reservas de mesas, pagamentos e repasses.

O projeto foi construído sob um axioma inegociável:

> **"SIMPLICIDADE PARA O CLIENTE E PARA O RESTAURANTE NUNCA JUSTIFICA SIMPLICIDADE IRRESPONSÁVEL NA ENGENHARIA."**

A interface deve ser elegante, fluida e intuitiva.  
A arquitetura deve ser rigorosa, modular e previsível.  
A segurança, a privacidade e a integridade matemática dos dados são cláusulas pétreas.  
Nenhum agente ou desenvolvedor tem autorização para sacrificar integridade, isolamento multi-tenant ou segurança em nome de velocidade ou conveniência de entrega.

---

## ARTIGO 1 — HIERARQUIA SUPREMA DE PRIORIDADES

Toda e qualquer decisão de arquitetura, codificação, refatoração ou configuração deverá respeitar rigorosamente a seguinte ordem de precedência:

1. **Segurança e Proteção de Segredos** (chaves de API, credenciais de banco, tokens de sessão).
2. **Integridade Matemática e Financeira dos Dados** (cálculos de pedidos, ledger e comissões).
3. **Isolamento Multi-tenant & Zero IDOR/BOLA** (restaurante nunca acessa dados de outro).
4. **LGPD & Privacidade de Dados** (minimização, sanitização de logs e projeções públicas).
5. **Regras de Negócio e Contratos de Domínio** (fonte única de verdade no servidor).
6. **Arquitetura Limpa e Modularidade do Monorepo** (desacoplamento entre packages e apps).
7. **Rastreabilidade e Imutabilidade Histórica** (snapshots de pedidos, auditoria).
8. **Cobertura de Testes e Tipagem Estrita** (zero `any`, validação Zod).
9. **Experiência do Usuário (UX) e Performance**.
10. **Conveniência de Implementação**.

> ⚠️ **Cláusula Pétrea:** Um item de nível inferior JAMAIS poderá sobrepor ou comprometer um item de nível superior.

---

## ARTIGO 2 — REGRA SUPREMA DE CONTINUIDADE: "NÃO QUEBRAR O QUE JÁ FUNCIONA"

Antes de alterar, remover ou renomear qualquer módulo, tabela, rota ou componente:
1. **Localizar** a implementação original e seu contexto histórico.
2. **Identificar** todos os consumidores ativos e dependências cruzadas no monorepo.
3. **Mapear** os contratos de entrada/saída (TypeScript types, Zod schemas, eventos).
4. **Verificar** as suítes de testes associadas antes de editar.
5. **Classificar o risco** da intervenção (SAFE, RISKY ou CRITICAL).
6. **Garantir retrocompatibilidade** caso consumidores dependam da assinatura antiga.

---

## ARTIGO 3 — PRINCÍPIOS DE ARQUITETURA DO MONOREPO

1. **Monorepo com Turborepo & pnpm:**
   - As aplicações ficam em `apps/` (ex: `apps/web`).
   - Os pacotes compartilhados ficam em `packages/` (`core`, `ai`, `database`, `ui`, `config`).
   - A gestão de pacotes utiliza estritamente `pnpm` workspaces (`workspace:*`).
2. **Clean Architecture & Domínio Puro (`@concierge/core`):**
   - O pacote `packages/core` contém as entidades, value objects, validações e cálculos de negócio.
   - O `core` é **estritamente agnóstico de frameworks**: não importa React, Next.js, Prisma ou bibliotecas de UI.
   - Regras de negócio vivem no `core`, garantindo portabilidade entre Web, WhatsApp Bot, CLI e Workers.
3. **Servidor é a Única Autoridade:**
   - O frontend é apenas um canal de apresentação e coleta de intenções.
   - Preços, descontos, taxas de entrega, comissões, totais e status de pedidos são **exclusivamente calculados e validados no servidor**.
   - O cliente nunca envia o preço final a ser gravado; envia itens e opções selecionadas, e o servidor recalcula tudo.
4. **Serverless-Ready Database Layer (`@concierge/database`):**
   - Conexões com Neon PostgreSQL utilizam Connection Pooling via PgBouncer (`DATABASE_URL`) para runtime.
   - Operações de DDL e migrações utilizam a conexão direta (`DIRECT_URL`).
   - O Prisma Client deve ser mantido em padrão singleton para evitar esgotamento de conexões em ambientes serverless da Vercel.

---

## ARTIGO 4 — REGRAS DE COMISSÃO & MATEMÁTICA FINANCEIRA

1. **Taxa Oficial da Plataforma (0,5%):**
   - A taxa padrão do Concierge / Ostras.ai sobre pedidos originados pela plataforma é de **0,5%** (`ratePercentage: 0.5`).
   - A comissão incide sobre o valor bruto do pedido gerado através do ecossistema.
2. **Aritmética Estrita em Centavos Inteiros:**
   - **É terminantemente proibido utilizar ponto flutuante (`float`/`double`) para cálculos monetários.**
   - Todos os cálculos devem ser realizados em centavos inteiros (`integer`), utilizando `Math.round(valor * 100)`.
   - Divisões financeiras e splits são arredondados com precisão controlada em centavos, prevenindo anomalias de representação binária IEEE-754.
3. **Ledger Contábil Auditável:**
   - Todas as transações financeiras, taxas de plataforma retidas e valores líquidos do comerciante devem ser registrados no modelo `FinancialLedger`.
   - Registros do ledger são **imutáveis** (apenas inserções são permitidas; correções exigem lançamentos de estorno/compensação).
4. **Imutabilidade Histórica do Pedido:**
   - Ao finalizar um pedido, é gerado um snapshot integral (`OrderItem`, preços unitários, nomes dos produtos, opções adicionais e taxa de entrega vigentes no instante exato da compra).
   - Alterações posteriores no cardápio ou nas taxas do restaurante nunca alteram pedidos passados.

---

## ARTIGO 5 — PADRÕES DE CÓDIGO E ENGENHARIA

1. **TypeScript Estrito:**
   - O uso de `any` é **terminantemente proibido**. Use `unknown`, `never`, genéricos ou schemas tipados.
   - Erros de typecheck (`pnpm typecheck`) bloqueiam qualquer deploy.
2. **Validação em Todas as Fronteiras (Zod):**
   - Toda entrada de dados externos (Server Actions, rotas de API, webhooks, payloads do agente de IA) deve ser validada por schemas Zod antes do processamento.
3. **Tratamento Explícito de Erros:**
   - Preferência pelo padrão `Result<T, E>` para regras de negócio e operações de domínio, evitando throws invisíveis.
   - Mensagens de erro voltadas ao usuário final devem ser amigáveis e não expor stack traces ou detalhes de infraestrutura.
4. **Server Actions Seguras:**
   - Server Actions do Next.js devem validar autenticação e autorização do usuário no início da execução antes de invocar serviços de banco.

---

## ARTIGO 6 — SEGURANÇA, PRIVACIDADE & MULTI-TENANCY

1. **Isolamento Multi-Tenant Inegociável:**
   - Toda query, mutação, visualização ou ação que envolva dados de um restaurante deve incluir explicitamente a cláusula `restaurantId` (ou validar o vínculo com o usuário logado).
   - Nenhuma rota administrativa ou de gestão pode permitir a leitura ou alteração de dados de outro estabelecimento.
2. **Zero IDOR / BOLA (Broken Object Level Authorization):**
   - Identificadores sequenciais de banco de dados (`autoincrement`) nunca devem ser expostos em URLs públicas.
   - Pedidos utilizam identificadores públicos opacos e imprevisíveis (`publicId` via nanoid seguro).
3. **Sanitização de Projeções Públicas:**
   - A rota pública de rastreamento do pedido (`/pedido/[publicId]`) deve utilizar o sanitizador oficial (`sanitizeOrderForTracking`).
   - Dados sensíveis como comissão da plataforma (`platformFee`), notas internas do restaurante, dados bancários e identificadores de operadores **jamais são transmitidos ao cliente final**.
4. **LGPD by Design:**
   - Coleta mínima de dados para entrega (nome, telefone para contato/WhatsApp, endereço).
   - Não solicitar nem armazenar CPF de clientes no MVP de pedidos.
   - Tokens de sessão e segredos criptográficos são armazenados com hash seguro via Better Auth.

---

## ARTIGO 7 — COMPORTAMENTO E PROTOCOLO OPERACIONAL DOS AGENTES DE IA

Qualquer agente de IA que atue neste repositório (incluindo o assistente de desenvolvimento e o agente conversacional do Concierge) deve obedecer ao seguinte protocolo de 9 etapas:

```
[1. Entender] ➔ [2. Inspecionar] ➔ [3. Mapear] ➔ [4. Classificar Risco] ➔ [5. Planejar] ➔ [6. Implementar] ➔ [7. Validar] ➔ [8. Auditar] ➔ [9. Reportar]
```

1. **Entender:** Ler com atenção a solicitação do usuário e os requisitos mandatórios.
2. **Inspecionar:** Analisar os arquivos existentes envolvidos antes de gerar qualquer código.
3. **Mapear:** Verificar dependências cruzadas, imports e tipos compartilhados nos pacotes.
4. **Classificar Risco:**
   - `SAFE`: Edição de documentação, novos testes ou adição de rotas isoladas.
   - `SAFE WITH PRECONDITION`: Modificação em componentes compartilhados com consumidores conhecidos.
   - `RISKY`: Alterações no schema do Prisma, cálculos de pedidos, comissões ou autenticação.
   - `BLOCKED`: Ações que quebram contratos existentes ou violam a hierarquia do Artigo 1.
5. **Planejar:** Definir a estratégia passo a passo antes de alterar múltiplos arquivos.
6. **Implementar:** Escrever código limpo, documentado, seguindo as convenções do projeto.
7. **Validar:** Executar validação automatizada (`build`, `typecheck`, `tests`).
8. **Auditar:** Fazer `git diff` e `git status` para garantir que apenas os arquivos necessários foram modificados.
9. **Reportar:** Explicar claramente o que foi feito, o porquê e apresentar o resultado ao usuário.

---

## ARTIGO 8 — MATRIZ DE PERMITIDO VS PROIBIDO

| Categoria | ✅ PERMITIDO & RECOMENDADO | ❌ TERMINANTEMENTE PROIBIDO |
| :--- | :--- | :--- |
| **Moeda & Dinheiro** | Inteiros em centavos (`cents = Math.round(val * 100)`) | Usar `float`/`number` com decimais soltos em operações financeiras |
| **Comissão** | Taxa oficial de **0,5%** registrada em ledger auditável | Alterar alíquota sem autorização ou embutir taxas ocultas |
| **Tipagem** | Tipos explícitos, interfaces fechadas, Zod schemas | Uso de `any`, `@ts-ignore` ou casting inseguro (`as unknown as X`) |
| **Segurança** | `publicId` (nanoid) em links externos e rotas públicas | Expor `id` interno ou UUID sequencial em URLs de tracking |
| **Banco de Dados** | Singleton Prisma, pooling no runtime e direct no DDL | Múltiplas instâncias `new PrismaClient()` em serverless |
| **Monorepo** | Imports limpos via `@concierge/*` e workspaces pnpm | Imports relativos cruzados longos (ex: `../../packages/core`) |
| **Deploy** | Configuração limpa no Turborepo e hooks `prebuild` | Subir credenciais `.env` reais para o Git |
| **Agentes IA** | Verificar `git status`, testar build e pedir confirmação para commits | Fazer commit ou push destrutivo sem consentimento prévio do usuário |

---

*Esta Constituição vigora como norma orientadora suprema para todo o ciclo de vida do ecossistema Concierge (Ostras.ai).*
