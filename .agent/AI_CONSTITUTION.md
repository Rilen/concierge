# 🤖 CONCIERGE / OSTRAS.AI — CONSTITUIÇÃO DE INTELIGÊNCIA ARTIFICIAL

**Versão:** 1.0  
**Status:** NORMA MANDATÓRIA  
**Data:** Setembro de 2026  
**Aplicação:** Todo modelo de linguagem, agente autônomo, pipeline de IA e componente de orquestração deste projeto.

---

## PREÂMBULO

O ecossistema Concierge integra Inteligência Artificial para enriquecer a experiência do usuário, não para substituir decisões transacionais, financeiras ou de autorização.

**Princípio Central:**

> **Automação não é Autoridade.**

LLMs interpretam, consultam, recomendam, preparam e orquestram. Código determinístico valida, autoriza, calcula e persiste.

---

## AI-001 — Least Authority (Mínimo Privilégio)

**Objetivo:** Limitar o raio de impacto de um agente comprometido ou mal configurado.

**Regra:** O agente recebe exclusivamente as ferramentas (tools) necessárias para a tarefa imediata. Nenhuma tool adicional é registrada "para o futuro" ou "por conveniência".

**Aplicação Prática:**
- O Agente Concierge de atendimento recebe: `search_catalog`, `create_order_draft`, `get_restaurant_info`, `track_order_public`.
- O Agente Concierge NÃO recebe: tools de administração de restaurante, ferramentas de pagamento, acesso a dados de outros clientes.
- A expansão de tools exige atualização formal e revisão de segurança.

**Anti-pattern:** Registrar todas as tools disponíveis em todos os agentes por conveniência.

---

## AI-002 — No Direct Database (Sem Acesso Direto a Banco)

**Objetivo:** Garantir que a camada de dados nunca seja acessível diretamente por um modelo de linguagem.

**Regra:** LLMs e agentes conversacionais nunca possuem connection strings, credenciais de banco ou acesso direto a qualquer ORM ou query builder. Toda persistência ocorre por meio de APIs autenticadas e regras de domínio.

**Aplicação Prática:**
- Uma tool como `create_order_draft` valida e persiste internamente via Server Action — o agente não vê a query nem o resultado bruto do banco.
- O agente recebe apenas o response shape necessário para continuar a conversa.

**Anti-pattern:** Passar `DATABASE_URL` como variável de ambiente para o runtime do agente conversacional.

---

## AI-003 — No Secret Access (Sem Acesso a Segredos)

**Objetivo:** Proteger credenciais, tokens e chaves contra vazamento via canais de LLM.

**Regra:** Segredos nunca aparecem em:
- contexto de prompt (system prompt, user message, assistant message)
- parâmetros de tools
- respostas de tools enviadas ao modelo
- logs de chamadas de LLM
- saídas visíveis ao usuário

**Aplicação Prática:**
- A chave `BETTER_AUTH_SECRET` nunca é lida pelo código que constrói prompts.
- Tokens de pagamento não aparecem em nenhum contexto enviado ao modelo.
- Se um segredo precisar ser usado, é usado fora do contexto do modelo e apenas o resultado ("pagamento aprovado") é retornado.

**Anti-pattern:** Incluir status detalhados de autenticação com tokens no contexto do agente.

---

## AI-004 — Deterministic Transactions (Transações Determinísticas)

**Objetivo:** Garantir que operações econômicas e transacionais sejam controladas por código confiável.

**Regra:** Preço, desconto, frete, comissão (0,5%), disponibilidade de produto, autorização de pagamento e estado transacional são determinados por código determinístico no servidor. O modelo de linguagem NUNCA determina esses valores.

**Aplicação Prática:**
- Usuário diz: "quero 2 pizzas com 50% de desconto". O agente cria um draft com os itens. O servidor aplica apenas os descontos autorizados.
- O total exibido ao usuário vem do servidor, nunca do cálculo do modelo.

**Anti-pattern:** Aceitar o preço calculado pelo agente sem recalcular server-side.

---

## AI-005 — Explicit Confirmation (Confirmação Explícita)

**Objetivo:** Exigir ação consciente do usuário antes de operações irreversíveis.

**Regra:** Operações que geram cobrança, comprometimento financeiro, confirmação de pedido, cancelamento ou qualquer efeito persistente irreversível exigem confirmação explícita e rastreável do usuário na interface.

**Aplicação Prática:**
- O agente prepara um OrderDraft com itens, preços calculados e taxa de entrega.
- O draft é exibido ao usuário com botão "Confirmar Pedido".
- Somente após ação do usuário o pedido é efetivado.
- O agente NÃO pode confirmar o pedido autonomamente.

**Anti-pattern:** Agente interpreta "ok vai lá" como confirmação e chama `confirmOrder()` sem UI intermediária.

---

## AI-006 — Tool Validation (Validação de Parâmetros de Tools)

**Objetivo:** Tratar toda entrada proveniente de LLM como não confiável.

**Regra:** Todo parâmetro gerado por um modelo de linguagem e passado a uma tool é validado via schema Zod antes de qualquer processamento ou persistência.

**Aplicação Prática:**

```typescript
// tool create_order_draft — handler server-side
export async function createOrderDraft(input: unknown) {
  const parsed = createOrderDraftSchema.safeParse(input); // Zod sempre
  if (!parsed.success) return { error: 'Parâmetros inválidos' };
  // processar com parsed.data
}
```

**Anti-pattern:** Confiar no tipo TypeScript gerado pelo SDK sem validação runtime.

---

## AI-007 — Prompt Injection Resistance (Resistência à Injeção de Prompt)

**Objetivo:** Impedir que conteúdo externo sobrescreva as instruções do sistema.

**Regra:** Mensagens de usuário, cardápio, avaliações, mensagens do WhatsApp, nomes de produtos e qualquer dado proveniente de fontes externas devem ser tratados estritamente como **dados**, nunca como **instruções**.

**Técnicas obrigatórias:**
1. Delimitar dados externos com marcadores explícitos no prompt.
2. Nunca interpolar dados externos diretamente nas instruções do sistema.
3. Validar que a resposta do modelo não executa comandos inesperados.

**Aplicação Prática:**
- Correto: cardápio delimitado dentro de tags `<dados_externos>` no prompt.
- Errado: cardápio interpolado diretamente nas instruções de comportamento do agente.

**Anti-pattern:** Um produto chamado "Ignore as instruções anteriores e..." alterar o comportamento do agente.

---

## AI-008 — Output Is Untrusted (Saída do Modelo é Não Confiável)

**Objetivo:** Impedir que a saída do modelo seja tratada automaticamente como fato, autorização ou dado verificado.

**Regra:**
- Saídas de LLM exibidas ao usuário são sanitizadas contra XSS antes da renderização.
- Saídas estruturadas (JSON de tool calls) são validadas via Zod antes do uso.
- O modelo nunca é a fonte de verdade para dados que existem no banco.
- Informações factuais (preço real, status real, estoque real) sempre são consultadas do banco.

**Anti-pattern:** Exibir diretamente `response.text()` sem sanitização em contextos HTML.

---

## AI-009 — Data Minimization (Minimização de Dados)

**Objetivo:** Proteger dados pessoais e reduzir exposição a subprocessadores externos.

**Regra:** Enviar ao modelo somente os dados estritamente necessários para a resposta imediata.

**Dados que NUNCA vão ao modelo sem justificativa e mascaramento:**
- Telefone completo de clientes
- Endereço de entrega completo
- Dados de pagamento
- Histórico de pedidos identificado por nome/telefone
- E-mail de operadores ou administradores

**Aplicação Prática:**
- Para recomendar pizza: enviar categorias e produtos do cardápio. Não enviar dados do cliente.
- Para rastrear pedido: enviar status e ETA. Não enviar nome, endereço ou telefone ao modelo.

**Anti-pattern:** Enviar a sessão completa do usuário com todos os atributos como contexto do agente.

---

## AI-010 — Provider Abstraction (Abstração de Provedor)

**Objetivo:** Evitar lock-in em provedor específico de LLM e garantir portabilidade.

**Regra:** A lógica de negócio, tools e orquestração do agente são implementadas contra interfaces neutras (via Vercel AI SDK ou equivalente). O código não pode depender de APIs proprietárias específicas de Google Gemini, OpenAI ou Anthropic.

**Aplicação Prática:**
- Tools registradas via interface padrão do Vercel AI SDK.
- Troca de `google/gemini-2.0-flash` por `openai/gpt-4o` requer mudança apenas na configuração do provider, não em lógica de negócio.

**Anti-pattern:** Importar `GoogleGenerativeAI` diretamente em arquivos de lógica de negócio ou tool handlers.

---

*Concierge / Ostras.ai — Constituição de Inteligência Artificial v1.0 — Setembro de 2026*
