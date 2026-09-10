# 🚨 CONCIERGE / OSTRAS.AI — PLANO DE RESPOSTA A INCIDENTES

**Versão:** 1.0  
**Status:** NORMA MANDATÓRIA  
**Data:** Setembro de 2026

---

## FLUXO GERAL

```
Detection
  ↓
Containment
  ↓
Assessment
  ↓
Classification
  ↓
Notification Decision
  ↓
Recovery
  ↓
Postmortem
  ↓
Preventive Action
```

---

## CLASSIFICAÇÃO DE SEVERIDADE

| Nível | Critério | Exemplo | Tempo de Resposta |
|-------|----------|---------|-------------------|
| **CRITICAL** | Dados comprometidos ou sistema exposto ativamente | Vazamento de DATABASE_URL, cross-tenant ativo | Imediato (< 1h) |
| **HIGH** | Vulnerabilidade confirmada, exploração potencial | IDOR em produção, secret em log | < 24h |
| **MEDIUM** | Exposição limitada, sem comprometimento confirmado | Permissão excessiva, configuração incorreta | < 72h |
| **LOW** | Melhoria de hardening sem risco imediato | Falta de rate limiting, header de segurança ausente | Próximo sprint |

---

## CENÁRIO 1: VAZAMENTO DE SECRET (CRITICAL)

**Exemplos:** DATABASE_URL exposta em log, BETTER_AUTH_SECRET em repositório, API Key em saída pública.

### Detection
- Alert de scan de secrets no repositório (ex: GitHub Secret Scanning)
- Review manual de logs identifica conteúdo sensível
- Reporte de terceiro

### Containment (< 1h)
1. Revogar e regenerar o secret imediatamente no provedor (Neon, Gemini, Better Auth)
2. Atualizar variável de ambiente na Vercel com o novo valor
3. Invalidar todas as sessões ativas se BETTER_AUTH_SECRET foi comprometido
4. Se DATABASE_URL foi exposta: alterar a senha do usuário do banco no Neon
5. Verificar se houve acesso não autorizado nos logs do período de exposição

### Assessment
- Determinar janela de exposição (quando foi exposto até quando foi revogado)
- Identificar quais sistemas ou pessoas tiveram acesso ao secret
- Verificar logs de acesso ao banco no período para queries suspeitas

### Classification
- CRITICAL se houve acesso ao banco ou dados durante a janela
- HIGH se exposição foi breve e sem evidências de acesso

### Notification Decision
- Se dados pessoais foram acessados: avaliar obrigação de comunicação à ANPD e aos titulares (A VALIDAR juridicamente)
- Comunicar internamente os responsáveis técnicos imediatamente

### Recovery
- Confirmar rotação de todos os segredos afetados
- Redeploy da aplicação com novos secrets
- Verificar integridade dos dados (nenhuma alteração inesperada)

### Postmortem (< 72h após contenção)
- Documentar: o que foi exposto, por quanto tempo, como foi detectado, impacto

### Preventive Action
- Adicionar lint rule para detectar process.env em código de aplicação
- Implementar secret scanning automatizado no CI/CD
- Revisar SEC-005 na implementação

---

## CENÁRIO 2: ACESSO CROSS-TENANT (CRITICAL)

**Exemplo:** Restaurante A acessa, visualiza ou modifica dados do Restaurante B.

### Detection
- Log de auditoria mostra query de restaurantId diferente do usuário autenticado
- Reporte de usuário
- Alerta de monitoramento de queries anômalas

### Containment (< 1h)
1. Identificar a rota ou Server Action afetada
2. Desabilitar ou bloquear a funcionalidade específica com hotfix emergencial
3. Revogar sessões de usuários potencialmente afetados
4. Bloquear novas requisições à rota comprometida até o fix

### Assessment
- Identificar quais dados foram acessados e por quem
- Determinar se houve modificação de dados (não apenas leitura)
- Mapear todos os restaurantes potencialmente expostos

### Classification
- CRITICAL sempre — violação de isolamento de tenant é por definição crítica

### Notification Decision
- Comunicar os restaurantes afetados sobre a exposição (A VALIDAR juridicamente)
- Se dados pessoais de clientes foram expostos: avaliar notificação à ANPD

### Recovery
- Corrigir a query para incluir restaurantId corretamente
- Revisar todas as queries similares na codebase
- Auditoria forense completa do período de exposição

### Postmortem
- Documentar a query incorreta, quando foi introduzida, quais dados foram expostos

### Preventive Action
- Adicionar testes de integração para isolamento de tenant por entidade
- Review obrigatório de multi-tenancy no protocolo de agentes (etapa 7)

---

## CENÁRIO 3: VAZAMENTO DE DADOS PESSOAIS (HIGH/CRITICAL)

**Exemplo:** Dados de clientes (nome, telefone, endereço) expostos publicamente ou para terceiros não autorizados.

### Containment
1. Identificar e bloquear a rota de exposição
2. Preservar evidências (logs) sem alteração
3. Verificar extensão da exposição (quantos registros, por quanto tempo)

### Assessment e Classification
- CRITICAL se exposição massiva (> 100 titulares) ou dados sensíveis
- HIGH se exposição limitada e controlada

### Notification Decision
- **Obrigação LGPD Art. 48:** Notificar à ANPD incidentes que possam acarretar risco ou dano relevante aos titulares em prazo razoável — A VALIDAR juridicamente o critério de "relevante"
- Comunicar titulares afetados se o risco for relevante — A VALIDAR

### Preventive Action
- Revisar sanitizador `sanitizeOrderForTracking`
- Implementar testes de saída de dados públicos que verificam ausência de dados pessoais não autorizados

---

## CENÁRIO 4: PROMPT INJECTION (HIGH)

**Exemplo:** Conteúdo malicioso em mensagem de usuário, nome de produto ou avaliação altera o comportamento do agente Concierge.

### Containment
1. Identificar o vetor de injeção (mensagem, cardápio, avaliação)
2. Remover ou neutralizar o conteúdo malicioso da base de dados
3. Desabilitar temporariamente a funcionalidade afetada se necessário

### Assessment
- Determinar quais ações não autorizadas o agente executou
- Verificar se algum dado foi modificado como resultado
- Avaliar se outros usuários foram afetados

### Recovery
- Corrigir o prompt para isolar corretamente dados externos como conteúdo delimitado
- Implementar validação adicional de saída do modelo

### Preventive Action
- Revisar implementação de AI-007 (Prompt Injection Resistance)
- Adicionar testes de segurança de IA com tentativas de injeção conhecidas

---

## CENÁRIO 5: COMPROMETIMENTO DE WEBHOOK (HIGH)

**Exemplo:** Webhook de pagamento forjado confirma pedido sem pagamento real.

### Containment
1. Desabilitar o endpoint de webhook afetado
2. Identificar quais pedidos foram fraudulentamente confirmados
3. Revogar a chave de assinatura do webhook no provedor e regenerar

### Assessment
- Calcular impacto financeiro (pedidos confirmados sem pagamento)
- Verificar se houve acesso a outros dados além de status de pagamento

### Recovery
- Reverter status de pedidos fraudulentos (anotação no ledger, não mutação)
- Reconstruir o fluxo correto de webhooks com verificação HMAC
- Implementar tabela de idempotência antes de reativar o endpoint

---

## CENÁRIO 6: COMPROMETIMENTO DE CONTA ADMINISTRATIVA (CRITICAL)

**Exemplo:** Conta SUPERADMIN ou MASTER comprometida por credential stuffing ou phishing.

### Containment (< 1h)
1. Invalidar todas as sessões do usuário comprometido
2. Revogar acesso à conta na interface administrativa
3. Auditar todas as ações realizadas pela conta no período de comprometimento
4. Bloquear o IP de origem suspeito se identificável

### Recovery
- Redefinir credenciais via canal seguro
- Habilitar 2FA se não estava ativo
- Revisar e reverter alterações não autorizadas

### Preventive Action
- Implementar alertas para logins de localização incomum
- Exigir 2FA para roles SUPERADMIN e MASTER
- Implementar limite de tentativas de login

---

## CENÁRIO 7: VAZAMENTO PARA LLM (MEDIUM/HIGH)

**Exemplo:** Dados pessoais de clientes (telefone, endereço) enviados acidentalmente ao contexto de um modelo de linguagem externo.

### Containment
1. Identificar quais dados e quantos registros foram incluídos no contexto
2. Corrigir o código que constrói o prompt para excluir os dados
3. Avaliar se o provedor de LLM possui política de não-retenção de dados de API

### Assessment
- Verificar política de dados do provedor (Google Gemini, OpenAI, Anthropic) — A VALIDAR
- Determinar se os dados podem ter sido usados para treinamento

### Notification Decision
- A VALIDAR juridicamente se o envio acidental a um subprocessador configura incidente notificável à ANPD

### Preventive Action
- Revisar e reforçar AI-009 (Data Minimization)
- Implementar revisão de saída de dados em calls de LLM em staging

---

*Concierge / Ostras.ai — Plano de Resposta a Incidentes v1.0 — Setembro de 2026*
