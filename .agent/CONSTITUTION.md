# 📜 CONCIERGE / OSTRAS.AI — CONSTITUIÇÃO DO PROJETO & REGRAS DE OURO v2.0

**Versão:** 2.0  
**Status:** NORMA FUNDAMENTAL E MANDATÓRIA — Cláusula Pétrea  
**Revisão:** Setembro de 2026 — Pós-Auditoria Arquitetural  
**Aplicação:** Todo agente de IA, desenvolvedor, engenheiro, automação ou ferramenta que inspecionar, criar, modificar ou remover qualquer artefato deste projeto.

> **"SIMPLICIDADE PARA O CLIENTE NUNCA JUSTIFICA SIMPLICIDADE IRRESPONSÁVEL NA ENGENHARIA."**

---

## CAPÍTULO I — PRINCÍPIOS FUNDAMENTAIS

### Art. 1º — Não Quebrar o que Funciona

Antes de alterar qualquer módulo, tabela, rota, schema, configuração ou dependência:

1. Localizar a implementação existente e entender seu contexto histórico.
2. Identificar todos os consumidores e dependências cruzadas no monorepo.
3. Mapear os contratos de entrada/saída (tipos TypeScript, schemas Zod, eventos).
4. Verificar testes e impacto em produção antes de editar.
5. Garantir retrocompatibilidade onde houver consumidores ativos.

Alterações que quebrem comportamento funcional existente exigem decisão arquitetural explícita registrada como ADR.

### Art. 2º — Hierarquia Suprema de Prioridades

Toda decisão de engenharia obedece esta ordem inegociável:

```
1. Segurança e proteção de segredos
2. Integridade dos dados (financeira, transacional, histórica)
3. Privacidade (LGPD, minimização, finalidade)
4. Isolamento Multi-tenant (restaurante nunca acessa dados de outro)
5. Regras de negócio e contratos de domínio
6. Arquitetura limpa e modularidade
7. Rastreabilidade e auditabilidade
8. Cobertura de testes e tipagem estrita
9. Experiência do Usuário (UX) e Performance
10. Conveniência de implementação
```

**Cláusula Pétrea:** Um item de nível inferior JAMAIS pode sobrepor ou comprometer um item de nível superior. Se uma regra de conveniência conflitar com segurança, segurança prevalece sem exceção.

Se um agente identificar que outra hierarquia é tecnicamente superior para um caso específico, deve registrar a justificativa como ADR antes de qualquer implementação.

### Art. 3º — Não Confundir Automação com Autoridade

O Agente Concierge pode, dentro de suas ferramentas autorizadas:

- **interpretar** intenções do usuário
- **consultar** dados públicos do cardápio e disponibilidade
- **recomendar** produtos, horários e estabelecimentos
- **preparar** rascunhos de pedidos e reservas
- **orquestrar** sequências de tools registradas

O Agente Concierge **NÃO É AUTORIDADE** sobre:

- identidade e autenticação
- autorização e permissões
- cálculo de preço e subtotal
- processamento de pagamento
- aplicação de comissão (0,5%)
- verificação de disponibilidade de estoque
- confirmação de pedido
- cancelamento de pedido
- emissão de reembolso
- liquidação e repasse financeiro

Essas operações são executadas exclusivamente por código determinístico, validado e auditado.

### Art. 4º — PostgreSQL é a Autoridade Persistente

O banco de dados PostgreSQL (Neon) é a fonte de verdade do sistema.

O ORM, query builder ou driver de acesso ao banco é **detalhe de infraestrutura**:

- Regras de negócio NUNCA residem em schemas de ORM.
- Validações de domínio NUNCA residem em constraints exclusivamente do ORM.
- A camada de acesso ao banco pode ser substituída sem alteração das regras de negócio.
- O schema SQL é a documentação autoritativa das entidades persistidas.

**Estado atual do projeto (Setembro/2026):** O runtime de `apps/web` utiliza Drizzle ORM com `@neondatabase/serverless`. O pacote `@concierge/database` com Prisma existe como infraestrutura legada de geração de schema e tipos, mas não é consumido diretamente pelo código de aplicação em runtime. Esta dualidade é um débito técnico reconhecido e documentado no ADR-009.

### Art. 5º — Regra Contra Overengineering

Segurança, LGPD e governança não autorizam complexidade desnecessária.

Toda nova abstração, dependência ou camada deve possuir justificativa técnica documentada.

**NÃO introduzir sem necessidade demonstrada:**
- microserviços
- filas de mensagens ou event bus
- múltiplos bancos de dados
- múltiplos ORMs ou drivers simultâneos
- abstrações artificiais que aumentem a superfície de manutenção
- infraestrutura prematura para escalas não atingidas

**Objetivo:** Máxima segurança e governança com a menor complexidade operacional razoável.

---

## CAPÍTULO II — INTEGRIDADE FINANCEIRA & COMISSÃO

**ALÍQUOTA OFICIAL:** A taxa da plataforma Concierge / Ostras.ai é de **0,5%** sobre o valor bruto dos pedidos originados pelo ecossistema. Esta alíquota não pode ser alterada sem decisão formal registrada como ADR.

### FIN-001 — Integer Money

Todos os valores monetários são representados e calculados como inteiros em centavos (`cents: number`).

```typescript
// CORRETO
const totalCents = Math.round(value * 100);

// PROIBIDO
const total = 10.5 + 2.3; // float aritmético
```

### FIN-002 — No Floating Point

É terminantemente proibido usar `float` ou `double` para cálculos monetários em qualquer camada da aplicação.

Exibição visual divide por 100 com 2 casas decimais. O dado persistido e calculado nunca é float.

### FIN-003 — Deterministic Financial Calculation

Todos os cálculos de subtotal, frete, desconto, comissão (0,5%) e total são realizados exclusivamente no servidor por funções determinísticas em `@concierge/core`.

O cliente nunca envia o preço final. Envia itens selecionados. O servidor recalcula tudo.

### FIN-004 — Immutable Ledger

Registros financeiros no ledger são append-only. Nenhuma linha pode ser atualizada ou deletada.

Correções exigem lançamentos de estorno ou compensação com referência ao lançamento original.

### FIN-005 — Reversal Instead of Mutation

Cancelamentos, estornos e ajustes financeiros são registrados como novos lançamentos com referência ao original. A operação de UPDATE ou DELETE em entradas financeiras é proibida.

### FIN-006 — Order Financial Snapshot

Ao confirmar um pedido, o sistema congela um snapshot integral: nome do produto, preço unitário, opcionais selecionados, taxa de entrega e taxa da plataforma vigentes no instante da compra.

Alterações posteriores no cardápio ou taxas do restaurante não afetam pedidos já registrados.

### FIN-007 — Idempotent Payment Processing

Todo processamento de pagamento (recebimento de webhook, confirmação de status) deve ser idempotente.

A mesma notificação de pagamento processada duas vezes não pode gerar dois lançamentos no ledger.

Implementar via tabela de idempotência (`webhook_events`) com chave única por evento externo.

### FIN-008 — Provider Verification

Notificações de gateways de pagamento (Mercado Pago, Asaas) são verificadas criptograficamente (HMAC-SHA256 ou equivalente do provider) antes de qualquer processamento.

Nunca confiar em um webhook apenas porque ele possui um ID aparentemente válido.

---

## CAPÍTULO III — MULTI-TENANCY & AUTORIZAÇÃO

### Princípio Central

> **Nenhuma operação sobre recurso pertencente a um restaurante pode ocorrer sem contexto explícito de tenant (restaurantId) validado server-side e autorização correspondente verificada para o usuário autenticado.**

### Proteção contra IDOR / BOLA

**Obscuridade de identificador NÃO constitui autorização.**

Conhecer um publicId de pedido não garante direito de alteração, acesso privilegiado ou informações internas. O publicId é apenas um token de rastreamento público — toda operação sensível exige verificação adicional de sessão ou ownership.

### Proteções Mandatórias

1. **Anti-IDOR:** Toda query sobre entidade tenant-scoped inclui restaurantId na cláusula WHERE.
2. **Anti-BOLA:** A autorização verifica que o objeto pertence ao tenant do usuário autenticado.
3. **Anti-Privilege Escalation:** Verificação server-side de role para cada operação sensível.
4. **Anti-Cross-Tenant:** Impossibilidade estrutural de consultar dados de outro restaurante.

### Identificadores Públicos

- IDs internos de banco (uuid) nunca são expostos em URLs públicas como mecanismo de segurança.
- Pedidos utilizam publicId opaco gerado via nanoid seguro (ord_xxxxx).
- O publicId não é segredo — é conveniente para tracking público, mas não autoriza operações privilegiadas.

### Hierarquia de Roles

```
SUPERADMIN > MASTER > GERENTE > PEDIDOS > CLIENTE
```

Cada role acessa apenas os recursos documentados para sua camada. A verificação ocorre sempre server-side.

---

## CAPÍTULO IV — PRIVACIDADE & LGPD

### Princípio: Privacy by Design

> **A arquitetura do Concierge está preparada para atendimento aos requisitos aplicáveis da LGPD, sujeita às validações jurídicas, contratuais e operacionais necessárias.**

Não declarar conformidade plena sem validação jurídica especializada.

### Pilares de Privacidade

1. **Finalidade:** Dados coletados servem a propósito específico e declarado.
2. **Necessidade e Minimização:** Coletar apenas o estritamente necessário. CPF não é coletado no MVP.
3. **Controle de Acesso:** Dados pessoais acessíveis apenas pelo restaurante titular e pelo próprio titular.
4. **Retenção:** Definida por finalidade e obrigações legais. Marcar como A VALIDAR onde não definido.
5. **Descarte:** Dados pessoais anonimizados ou excluídos após encerramento da finalidade.
6. **Auditabilidade:** Operações relevantes sobre dados pessoais registradas em audit_logs.
7. **Segurança:** Dados em trânsito e em repouso protegidos por TLS e controles de acesso.
8. **Subprocessadores:** Mapeados em docs/DATA_PROCESSORS.md.
9. **Transferências Internacionais:** Exigem avaliação de adequabilidade — A VALIDAR juridicamente.

### Proteção Explícita: Dados para LLMs

**Dados PERSONAL, SENSITIVE, FINANCIAL e SECRET nunca são enviados a modelos de linguagem externos sem:**
- anonimização ou mascaramento prévio
- avaliação de necessidade estrita para a resposta
- base legal documentada para o processamento

### Classificação de Dados (7 Classes)

| Classe | Exemplos | Frontend? | LLM? | Logs? | Retenção |
|--------|----------|-----------|------|-------|----------|
| PUBLIC | Cardápio, nome, horários | Sim | Sim | Sim | Indefinida |
| INTERNAL | IDs técnicos, métricas | Não | Não | Sim | 12 meses |
| PERSONAL | Nome, telefone, endereço | Titular apenas | Não | Mascarado | A VALIDAR |
| SENSITIVE | Biometria, saúde | Não coletado | Não | Não | N/A |
| FINANCIAL | Valor, comissão, chave Pix | Resumo público | Não | Não | A VALIDAR |
| SECRET | DATABASE_URL, API Keys | Nunca | Nunca | Nunca | Rotação imediata |
| AI_CONFIDENTIAL | System prompts, regras internas | Não | Internamente | Não | Ciclo de versão |

---

## CAPÍTULO V — PADRÕES DE CÓDIGO & ENGENHARIA

### Tipagem Estrita

- Uso de `any` é proibido. Usar `unknown`, `never`, genéricos ou schemas tipados.
- Erros de typecheck bloqueiam qualquer deploy.

### Validação em Todas as Fronteiras

Toda entrada de dados externos (Server Actions, rotas de API, webhooks, payloads de LLM) é validada por schemas Zod antes do processamento.

### Tratamento Explícito de Erros

- Preferência pelo padrão `Result<T, E>` em operações de domínio.
- Mensagens de erro ao usuário final não expõem stack traces, queries SQL ou detalhes de infraestrutura.

### Server Actions Seguras

Server Actions do Next.js validam autenticação e autorização do usuário no início da execução antes de invocar qualquer serviço de banco de dados.

---

## CAPÍTULO VI — PROTOCOLO OBRIGATÓRIO PARA AGENTES DE DESENVOLVIMENTO

Qualquer agente de IA que modifique código neste repositório executa obrigatoriamente:

```
1.  Understand       — Compreender o pedido e requisitos mandatórios desta Constituição
2.  Inspect          — Inspecionar arquivos relevantes antes de gerar código
3.  Plan             — Definir estratégia passo a passo
4.  Architecture     — Registrar como ADR se houver decisão arquitetural nova
    Decision
5.  Implement        — Escrever código limpo, documentado e tipado
6.  Test             — Executar build, typecheck, lint e testes disponíveis
7.  Security Review  — Verificar impactos de segurança, multi-tenancy, IDOR e secrets
8.  Data/Privacy     — Verificar impacto em dados pessoais e LGPD
    Review            (Condicional: executar quando houver impacto em dados pessoais)
9.  Financial Review — Verificar impacto em cálculos, ledger e comissão de 0,5%
                       (Condicional: executar quando houver impacto financeiro)
10. Deploy           — Somente após autorização explícita do responsável pelo projeto
11. Verify           — Confirmar comportamento esperado em produção
```

### Vedações Absolutas aos Agentes de Desenvolvimento

Nenhum agente pode:

- Remover regra constitucional sem ADR aprovado
- Desabilitar validação de segurança ou autenticação
- Alterar alíquota de comissão (0,5%) sem decisão formal
- Alterar schema de banco sem avaliação de migração e plano de rollback
- Modificar configuração de produção sem autorização explícita
- Expor segredos, chaves ou tokens em qualquer saída textual ou log
- Ignorar erros de typecheck, lint ou testes
- Introduzir dependência sem justificativa documentada
- Executar operação destrutiva (DROP, DELETE em massa, rotação de chave) sem confirmação explícita
- Fazer commit ou push sem consentimento prévio do usuário

---

*Concierge / Ostras.ai — Constituição do Projeto v2.0 — Setembro de 2026*
