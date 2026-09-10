# 🔐 CONCIERGE / OSTRAS.AI — POLÍTICA DE SEGURANÇA

**Versão:** 1.0  
**Status:** NORMA MANDATÓRIA  
**Data:** Setembro de 2026  
**Aplicação:** Toda decisão de implementação, integração e operação do sistema.

---

## SEC-001 — Zero Trust

**Objetivo:** Nenhuma requisição, usuário, serviço ou rede é confiável por padrão.

**Regra:** Toda requisição — interna ou externa — é autenticada e autorizada explicitamente antes de processar qualquer dado.

**Aplicação Prática:**
- Server Actions validam sessão antes de qualquer operação.
- APIs internas não confiam em headers de identidade sem verificação.
- O middleware de autenticação é executado antes de qualquer rota protegida.
- Chamadas entre serviços internos são autenticadas.

**Anti-pattern:** Assumir que uma requisição vinda de dentro do mesmo projeto Vercel é segura sem autenticação.

---

## SEC-002 — Least Privilege (Menor Privilégio)

**Objetivo:** Cada componente, usuário e serviço acessa apenas o necessário para sua função.

**Regra:** Papéis (roles) são atribuídos com o menor conjunto de permissões necessárias. Privilégios adicionais exigem justificativa e são temporários quando possível.

**Hierarquia de Roles:**
```
SUPERADMIN > MASTER > GERENTE > PEDIDOS > CLIENTE
```

**Aplicação Prática:**
- Operador de pedidos (PEDIDOS) não acessa configurações financeiras do restaurante.
- A connection string do banco está disponível apenas para os processos que executam queries.
- A chave de API do Gemini está disponível apenas para o módulo de IA.
- Tokens de webhook são específicos por integração, não compartilhados.

**Anti-pattern:** Compartilhar uma chave de API master entre todos os módulos do sistema.

---

## SEC-003 — Defense in Depth (Defesa em Profundidade)

**Objetivo:** Múltiplas camadas de proteção independentes. A falha de uma não compromete o sistema.

**Camadas de Defesa:**
```
Rede/CDN (Vercel WAF)
  ↓
Middleware Next.js (autenticação de sessão)
  ↓
Server Action / Route Handler (autorização + tenant)
  ↓
Domain Validator (Zod schema)
  ↓
Database Query (cláusula de tenant obrigatória)
  ↓
Database Constraint (FK, UNIQUE, NOT NULL)
```

**Anti-pattern:** Validar dados apenas no frontend e assumir que o backend pode confiar nessa validação.

---

## SEC-004 — Fail Closed (Falha Segura)

**Objetivo:** Em caso de erro, timeout, estado indefinido ou incerteza, o sistema nega o acesso.

**Regra:** O comportamento padrão em caso de falha é rejeitar, nunca permitir.

**Aplicação Prática:**
- Se a verificação de autenticação falhar por timeout, a requisição é rejeitada com 401.
- Se a leitura do papel do usuário falhar, a operação privilegiada é negada.
- Se a verificação de assinatura de webhook falhar, o webhook é rejeitado com 400.
- Se a validação Zod falhar, a operação é abortada — não há fallback silencioso.

**Anti-pattern:** Capturar exceções de autenticação e prosseguir com a operação como fallback.

---

## SEC-005 — Secrets Never Logged (Segredos Nunca em Logs)

**Objetivo:** Prevenir vazamento de credenciais por canais de observabilidade.

**Regra:** Segredos, tokens, chaves de API, senhas, connection strings e variáveis de ambiente classificadas como SECRET jamais aparecem em:
- logs de aplicação (console.log, console.error)
- stack traces enviados a serviços de monitoramento
- respostas de API (mesmo em desenvolvimento)
- output de build
- relatórios de erro

**Aplicação Prática:**
- Erros de banco logam a mensagem sanitizada, não a connection string.
- Falhas de autenticação logam o evento e timestamp, não o token inválido.
- Variáveis de ambiente com SECRET não são serializadas em objetos de contexto.

**Anti-pattern:** `console.log(process.env)` em qualquer arquivo de aplicação.

---

## SEC-006 — Tenant Isolation (Isolamento de Tenant)

**Objetivo:** Garantir que dados de um restaurante nunca sejam acessados por outro.

**Regra:** Toda query sobre entidade tenant-scoped inclui `restaurantId` na cláusula WHERE.

**Aplicação Prática:**

```typescript
// PROIBIDO — sem contexto de tenant
const orders = await db.select().from(orders);

// CORRETO — com contexto de tenant obrigatório
const orders = await db
  .select()
  .from(orders)
  .where(eq(orders.restaurantId, tenantId));
```

**Entidades Tenant-Scoped:**
categories, products, productOptionGroups, productOptions, customers, orders, orderItems, payments, deliveryZones, deliveryDrivers, loyaltyAccounts, stockItems, restaurantSettings, paymentSettings, auditLogs

**Anti-pattern:** Buscar pedido apenas por publicId sem validar o restaurantId do solicitante.

---

## SEC-007 — Server-side Authorization (Autorização no Servidor)

**Objetivo:** Permissões são verificadas exclusivamente no servidor com base em sessão válida.

**Regra:** O cliente nunca dita papéis, permissões ou identidade. A sessão do usuário é verificada no servidor a cada operação sensível.

**Aplicação Prática:**
- `requireRestaurantRole(restaurantId, ['GERENTE', 'PEDIDOS'])` é chamado no início de cada Server Action protegida.
- O papel (role) não é lido de cookies ou headers fornecidos pelo cliente.
- Mesmo que o frontend esconda um botão, a Server Action valida a permissão independentemente.

**Anti-pattern:** Verificar `if (user.role === 'ADMIN')` somente no frontend e não na Server Action.

---

## SEC-008 — Input Is Untrusted (Entradas São Não Confiáveis)

**Objetivo:** Toda entrada externa é potencialmente maliciosa até ser validada.

**Regra:** Dados provenientes de clientes HTTP, webhooks, payloads de IA, mensagens de WhatsApp e formulários são validados por schemas Zod antes de qualquer processamento.

**Aplicação Prática:**
- Parâmetros de URL são sanitizados antes de queries.
- Campos de texto livre são escapados antes de qualquer interpolação.
- JSON de webhook é validado contra schema esperado antes do processamento.

**Anti-pattern:** Usar `req.body.restaurantId` diretamente em queries sem validação.

---

## SEC-009 — AI Output Is Untrusted (Saída de IA é Não Confiável)

**Objetivo:** Impedir que saídas de modelos de linguagem causem injeção, XSS ou dados incorretos.

**Regra:**
- Texto gerado por LLMs é sanitizado antes da renderização em HTML.
- JSON estruturado de tool calls é validado via Zod antes do uso.
- O modelo nunca é consultado como fonte de verdade para dados do banco.
- Respostas de LLM que contradizem dados do banco são descartadas em favor do banco.

**Anti-pattern:** `dangerouslySetInnerHTML={{ __html: agentResponse.text }}` sem sanitização.

---

## SEC-010 — Webhook Authentication (Autenticação de Webhooks)

**Objetivo:** Garantir que webhooks recebidos são autênticos e provenientes do provedor declarado.

**Regra:** Todo webhook recebido de provedores externos (Mercado Pago, Asaas, Evolution API) é verificado criptograficamente antes de qualquer processamento.

**Fluxo Obrigatório:**
```
Receber webhook
  ↓
Verificar assinatura HMAC-SHA256 (ou mecanismo equivalente do provedor)
  ↓
Rejeitar com 401 se inválido
  ↓
Verificar idempotency_key na tabela webhook_events
  ↓
Rejeitar com 200 (silencioso) se já processado
  ↓
Validar schema do payload via Zod
  ↓
Processar com transação atômica
  ↓
Registrar em webhook_events com status PROCESSED
```

**Anti-pattern:** Processar webhook que possui um orderId aparentemente válido sem verificar a assinatura.

---

## SEC-011 — Idempotency (Idempotência)

**Objetivo:** Garantir que operações repetidas não causem efeitos duplicados.

**Regra:** Toda operação que modifica estado financeiro, de pedido ou de pagamento implementa deduplicação via chave de idempotência.

**Aplicação Prática:**
- Webhook de pagamento confirmado: chave = `{provider}:{event_id}` na tabela `webhook_events`.
- Criação de pedido via chamada duplicada: chave de idempotência no header HTTP.
- O mesmo webhook processado duas vezes retorna sucesso sem re-executar a lógica.

**Anti-pattern:** Processar o mesmo evento de pagamento duas vezes e lançar dois créditos no ledger.

---

## SEC-012 — Auditability (Auditabilidade)

**Objetivo:** Garantir rastreabilidade de operações relevantes para segurança e compliance.

**Regra:** Toda operação administrativa, alteração de status de pedido, operação financeira e evento de autenticação relevante é registrada em `audit_logs`.

**Dados Obrigatórios no Audit Log:**
- `restaurantId` (quando aplicável)
- `userId` do ator (ou 'SYSTEM' / 'CLIENT')
- `action` (ex: ORDER_STATUS_CHANGED, PAYMENT_CONFIRMED)
- `entity` e `entityId`
- `metadata` (JSON serializado, sanitizado de dados sensíveis)
- `createdAt`

**Proibido em Audit Logs:** segredos, senhas, tokens de pagamento, dados sensíveis desnecessários.

---

## SEC-013 — Dependency Security (Segurança de Dependências)

**Objetivo:** Manter o inventário de dependências seguro e atualizado.

**Regra:**
- `pnpm audit` é executado regularmente e antes de qualquer release significativo.
- Dependências com vulnerabilidades críticas ou altas são atualizadas antes do deploy.
- Versões de dependências são fixadas no `pnpm-lock.yaml`.
- Novas dependências exigem justificativa documentada antes da adição.

**Anti-pattern:** Adicionar pacotes npm sem verificar vulnerabilidades conhecidas ou licenças.

---

## SEC-014 — Supply Chain Security (Segurança da Cadeia de Suprimentos)

**Objetivo:** Reduzir riscos de dependências maliciosas ou comprometidas.

**Regra:**
- Preferência por pacotes amplamente utilizados, com mantenedores conhecidos.
- O campo `packageManager` no `package.json` raiz fixa a versão exata do pnpm.
- Scripts de postinstall de dependências são revisados antes da adição de novos pacotes.
- Variáveis de ambiente não são lidas por scripts de build de dependências de terceiros.

**Anti-pattern:** Instalar dependências de repositórios fork desconhecidos sem justificativa.

---

## SEC-015 — Incident Response (Resposta a Incidentes)

**Objetivo:** Garantir resposta rápida, organizada e documentada a incidentes de segurança.

**Regra:** Todo incidente de segurança segue o fluxo documentado em `.agent/INCIDENT_RESPONSE.md`.

**Classificação de Severidade:**

| Nível | Descrição | Exemplo | Tempo de Resposta |
|-------|-----------|---------|-------------------|
| CRITICAL | Exposição ativa de dados ou comprometimento de conta | Vazamento de DATABASE_URL, cross-tenant ativo | Imediato (< 1h) |
| HIGH | Vulnerabilidade confirmada não explorada | IDOR descoberto em teste, secret em log | < 24h |
| MEDIUM | Configuração incorreta sem exposição imediata | Permissão mais ampla que necessário | < 72h |
| LOW | Melhoria de hardening sem risco imediato | Falta de rate limiting em rota pública | Próximo sprint |

---

*Concierge / Ostras.ai — Política de Segurança v1.0 — Setembro de 2026*
