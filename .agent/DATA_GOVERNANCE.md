# 📊 CONCIERGE / OSTRAS.AI — GOVERNANÇA DE DADOS

**Versão:** 1.0  
**Status:** NORMA MANDATÓRIA  
**Data:** Setembro de 2026  
**Base:** Arquitetura preparada para atendimento aos requisitos aplicáveis da LGPD, sujeita às validações jurídicas, contratuais e operacionais necessárias.

> Não declarar conformidade plena com a LGPD sem validação jurídica especializada.

---

## 1. INVENTÁRIO E CLASSIFICAÇÃO DE DADOS

### 1.1 Classificação Oficial (7 Níveis)

| Classe | Descrição Geral | Exemplos no Projeto |
|--------|----------------|---------------------|
| **PUBLIC** | Dados disponíveis publicamente sem restrição | Cardápio, nome do restaurante, horários de funcionamento, fotos de produtos |
| **INTERNAL** | Dados operacionais internos, sem dados pessoais | IDs técnicos de instâncias, métricas de performance agregadas, configurações de infraestrutura |
| **PERSONAL** | Dados pessoais identificáveis (LGPD Art. 5º, I) | Nome do cliente, telefone, endereço de entrega, e-mail de usuário |
| **SENSITIVE** | Dados pessoais sensíveis (LGPD Art. 5º, II) | *Não coletados no MVP atual* |
| **FINANCIAL** | Dados transacionais e financeiros | Valor do pedido, comissão de 0,5%, status de pagamento, chave Pix |
| **SECRET** | Credenciais, tokens de API, chaves criptográficas | DATABASE_URL, BETTER_AUTH_SECRET, API Keys de LLM e gateways |
| **AI_CONFIDENTIAL** | Dados confidenciais de operação de IA | System prompts, regras de recomendação, estrutura de tools |

### 1.2 Matriz de Controles por Classe

| Classe | Frontend? | LLM? | Logs? | Banco? | Retenção |
|--------|-----------|------|-------|--------|----------|
| PUBLIC | Sim | Sim | Sim | Sim | Indefinida |
| INTERNAL | Não | Não | Sim (sem PII) | Sim | 12 meses |
| PERSONAL | Apenas do titular | Não sem mascaramento | Mascarado | Sim, tenant-scoped | A VALIDAR |
| SENSITIVE | Não | Não | Não | Não coletado | N/A |
| FINANCIAL | Resumo público apenas | Não | Não | Sim, imutável | A VALIDAR (fiscal) |
| SECRET | Nunca | Nunca | Nunca | Apenas hash/referência | Rotação imediata se exposto |
| AI_CONFIDENTIAL | Não | Internamente apenas | Não | Versionado | Ciclo de versão |

---

## 2. FINALIDADE E BASE LEGAL

| Dado | Finalidade | Base Legal Proposta | Status |
|------|-----------|--------------------|---------| 
| Nome e telefone do cliente | Entrega do pedido e contato pós-venda | Execução de contrato (Art. 7º, V) | A VALIDAR |
| Endereço de entrega | Cálculo de frete e entrega física | Execução de contrato (Art. 7º, V) | A VALIDAR |
| E-mail de operadores | Autenticação e comunicações operacionais | Legítimo interesse ou consentimento | A VALIDAR |
| Histórico de pedidos | Fidelização, suporte e obrigações fiscais | Legítimo interesse / Obrigação legal | A VALIDAR |
| Dados de pagamento (status) | Confirmação de pagamento e conciliação | Execução de contrato | A VALIDAR |
| Logs de auditoria | Segurança, rastreabilidade e compliance | Legítimo interesse / Obrigação legal | A VALIDAR |

---

## 3. MINIMIZAÇÃO DE DADOS

**Princípio:** Coletar o mínimo necessário para a finalidade declarada.

**Regras Atuais:**
- CPF não é coletado no MVP de pedidos.
- Senha de cliente não é armazenada diretamente — gerenciado pelo Better Auth com hash seguro.
- Endereço completo é coletado apenas para pedidos de delivery. Pedidos de retirada (pickup) não exigem endereço.
- Telefone é coletado para contato operacional — não para marketing sem consentimento.

---

## 4. FLUXO DE DADOS: PEDIDOS

```
Cliente preenche formulário de checkout
  ↓
[PERSONAL] Nome, telefone, endereço → Server Action (TLS)
  ↓
Servidor recalcula preço, frete e comissão (nunca confia no cliente)
  ↓
[FINANCIAL] Dados do pedido persistidos em orders (PostgreSQL/Neon)
  ↓
[PERSONAL] Dados do cliente persistidos em customers (tenant-scoped)
  ↓
[PUBLIC] publicId gerado e compartilhado com o cliente para tracking
  ↓
Sanitizador remove platformFee, changedBy e dados internos antes do tracking público
```

---

## 5. FLUXO DE DADOS: AGENTE CONCIERGE (IA)

```
Mensagem do usuário recebida
  ↓
[PERSONAL?] Verificar se contém dados pessoais
  ↓
Mascarar/minimizar antes de construir contexto para o modelo
  ↓
[AI_CONFIDENTIAL] System prompt + [PUBLIC] dados do cardápio → LLM externo
  ↓
Resposta do modelo processada e validada
  ↓
Tools de domain executadas server-side com dados do banco
  ↓
Resposta sanitizada exibida ao usuário
```

**ATENÇÃO:** Até a implementação formal do fluxo de minimização para LLMs, dados pessoais de clientes NÃO devem ser incluídos no contexto enviado a provedores externos.

---

## 6. FLUXO DE DADOS: PAGAMENTOS

```
Gateway (Mercado Pago / Asaas) dispara webhook
  ↓
SEC-010: Verificação de assinatura HMAC
  ↓
FIN-007: Verificação de idempotência
  ↓
[FINANCIAL] Atualização de status do pagamento
  ↓
FIN-004: Lançamento imutável no ledger
  ↓
[INTERNAL] Evento registrado em audit_logs
```

---

## 7. FLUXO DE DADOS: WHATSAPP (Futuro — P2)

> Aviso: Canal ainda não implementado. Política definida preventivamente.

```
Mensagem do WhatsApp recebida via Evolution API
  ↓
[PERSONAL] Número de telefone como identificador
  ↓
Verificação de autenticidade do webhook (HMAC)
  ↓
Associação com cliente existente ou criação de sessão anônima
  ↓
Fluxo do Agente Concierge (com minimização de dados para LLM)
  ↓
Mensagens NÃO são armazenadas permanentemente sem base legal definida
```

**A VALIDAR:** Política de retenção de mensagens do WhatsApp e contratos com Evolution API.

---

## 8. DIREITOS DOS TITULARES

| Direito (LGPD) | Status de Suporte Técnico |
|----------------|---------------------------|
| Acesso | A IMPLEMENTAR — sem interface de self-service |
| Retificação | Parcial — atualização de dados via suporte |
| Eliminação | A IMPLEMENTAR — sem fluxo automatizado |
| Portabilidade | A IMPLEMENTAR — sem export estruturado |
| Revogação de consentimento | A VALIDAR juridicamente |
| Oposição | A VALIDAR juridicamente |

---

## 9. RETENÇÃO E DESCARTE

| Dado | Retenção Proposta | Critério | Status |
|------|-------------------|----------|--------|
| Dados de pedidos | A VALIDAR | Obrigação fiscal / contratual | A VALIDAR |
| Dados de clientes | A VALIDAR | Ciclo de vida do relacionamento comercial | A VALIDAR |
| Logs de auditoria | 12 meses (proposta técnica) | Segurança e rastreabilidade | A VALIDAR |
| Sessões de usuário | Conforme expiresAt no banco | Encerramento de sessão | Implementado |
| Delivery tracking points | A VALIDAR | Operacional | A VALIDAR |

---

## 10. SUBPROCESSADORES

Detalhes em `docs/DATA_PROCESSORS.md`.

Lista atual de subprocessadores previstos:
- Vercel Inc. (hospedagem e serverless)
- Neon Inc. (banco de dados PostgreSQL)
- Google LLC / OpenAI / Anthropic (modelos de IA)
- Evolution API (gateway WhatsApp — futuro)
- Mercado Pago / Asaas (processamento de pagamentos — futuro)

---

## 11. TRANSFERÊNCIAS INTERNACIONAIS

Os seguintes subprocessadores envolvem transferência de dados para fora do Brasil:

| Subprocessador | País | Dados Transferidos | Adequabilidade/Garantias | Status |
|----------------|------|--------------------|--------------------------|--------|
| Vercel Inc. | EUA | Dados de aplicação, logs | A VALIDAR (DPA) | A VALIDAR |
| Neon Inc. | EUA (AWS us-east-1) | Todos os dados persistidos | A VALIDAR (DPA) | A VALIDAR |
| Google LLC (Gemini) | EUA | Prompts de IA (sem PII conforme AI-009) | A VALIDAR (DPA) | A VALIDAR |
| OpenAI Inc. | EUA | Prompts de IA (sem PII conforme AI-009) | A VALIDAR (DPA) | A VALIDAR |
| Anthropic PBC | EUA | Prompts de IA (sem PII conforme AI-009) | A VALIDAR (DPA) | A VALIDAR |

**Obrigação:** Antes de processar dados pessoais de cidadãos brasileiros com qualquer provedor estrangeiro, é necessário validar juridicamente as garantias adequadas (Art. 33 da LGPD).

---

*Concierge / Ostras.ai — Governança de Dados v1.0 — Setembro de 2026*
