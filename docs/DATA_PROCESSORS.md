# 🗂️ CONCIERGE / OSTRAS.AI — REGISTRO DE SUBPROCESSADORES DE DADOS

**Versão:** 1.0  
**Status:** DOCUMENTO VIVO — Atualizar ao adicionar ou remover fornecedores  
**Data:** Setembro de 2026  
**Base Legal:** LGPD Art. 37 — Inventário de atividades de tratamento e subprocessadores

> Este documento mapeia todos os fornecedores que recebem ou processam dados do ecossistema Concierge / Ostras.ai. Informações marcadas como `A VALIDAR` requerem verificação contratual, técnica ou jurídica antes de uso em produção com dados reais de titulares brasileiros.

---

## 1. VERCEL INC.

| Campo | Detalhe |
|-------|---------|
| **Fornecedor** | Vercel Inc. |
| **Finalidade** | Hospedagem da aplicação web, execução de Serverless Functions, CDN global |
| **Categorias de Dados** | Dados de aplicação, logs de requisições, variáveis de ambiente (secrets), dados de usuários em trânsito |
| **Dados Enviados** | Todo tráfego HTTP processado pela aplicação Next.js |
| **Localização** | EUA (Washington D.C., iad1) + CDN global |
| **Retenção** | A VALIDAR — logs de deploy e runtime retidos por período definido pela Vercel |
| **Base Contratual** | Termos de Serviço Vercel + DPA |
| **DPA Disponível** | A VALIDAR — verificar se DPA foi assinado para proteção de dados pessoais |
| **Transferência Internacional** | Sim — dados em trânsito processados nos EUA |
| **Status** | Em uso em produção — DPA e adequabilidade A VALIDAR |

---

## 2. NEON INC. (PostgreSQL Serverless)

| Campo | Detalhe |
|-------|---------|
| **Fornecedor** | Neon Inc. |
| **Finalidade** | Armazenamento principal do banco de dados PostgreSQL (todos os dados do sistema) |
| **Categorias de Dados** | PERSONAL (clientes), FINANCIAL (pedidos, pagamentos), INTERNAL (configurações), PUBLIC (cardápio) |
| **Dados Enviados** | Todos os dados persistidos pelo sistema |
| **Localização** | AWS us-east-1 (Norte da Virgínia, EUA) |
| **Retenção** | Conforme configuração de backups do projeto Neon + dados persistidos pela aplicação |
| **Base Contratual** | Termos de Serviço Neon + DPA |
| **DPA Disponível** | A VALIDAR |
| **Transferência Internacional** | Sim — dados residem nos EUA |
| **Status** | Em uso em produção — DPA A VALIDAR |

---

## 3. GOOGLE LLC (Gemini API)

| Campo | Detalhe |
|-------|---------|
| **Fornecedor** | Google LLC |
| **Finalidade** | Inferência de modelos de linguagem (Google Gemini) para o Agente Concierge |
| **Categorias de Dados** | AI_CONFIDENTIAL (system prompts), PUBLIC (cardápio) — conforme AI-009, dados PERSONAL não devem ser enviados |
| **Dados Enviados** | Prompts de sistema + conteúdo do cardápio + mensagens do usuário (minimizados conforme AI-009) |
| **Localização** | EUA (servidores Google Cloud) |
| **Retenção** | A VALIDAR — verificar se dados de API são usados para treinamento de modelos |
| **Base Contratual** | Google Cloud Terms of Service + Google AI API Terms |
| **DPA Disponível** | A VALIDAR — verificar Google Cloud DPA |
| **Transferência Internacional** | Sim — dados processados nos EUA |
| **Status** | Integração planejada — não ativada em produção. DPA A VALIDAR antes de ativação |

---

## 4. OPENAI INC.

| Campo | Detalhe |
|-------|---------|
| **Fornecedor** | OpenAI Inc. |
| **Finalidade** | Inferência de modelos de linguagem (GPT) — provedor alternativo para o Agente Concierge |
| **Categorias de Dados** | AI_CONFIDENTIAL (system prompts), PUBLIC — conforme AI-009 |
| **Dados Enviados** | Prompts minimizados conforme AI-009 |
| **Localização** | EUA (servidores OpenAI / Microsoft Azure) |
| **Retenção** | A VALIDAR — OpenAI API: dados de API não usados para treinamento (Enterprise, verificar) |
| **Base Contratual** | OpenAI Terms of Service + API Data Usage Policy |
| **DPA Disponível** | A VALIDAR |
| **Transferência Internacional** | Sim |
| **Status** | Não ativado em produção. DPA A VALIDAR antes de ativação |

---

## 5. ANTHROPIC PBC

| Campo | Detalhe |
|-------|---------|
| **Fornecedor** | Anthropic PBC |
| **Finalidade** | Inferência de modelos de linguagem (Claude) — provedor alternativo |
| **Categorias de Dados** | AI_CONFIDENTIAL, PUBLIC — conforme AI-009 |
| **Dados Enviados** | Prompts minimizados conforme AI-009 |
| **Localização** | EUA |
| **Retenção** | A VALIDAR |
| **Base Contratual** | Anthropic Terms of Service |
| **DPA Disponível** | A VALIDAR |
| **Transferência Internacional** | Sim |
| **Status** | Não ativado em produção. DPA A VALIDAR antes de ativação |

---

## 6. EVOLUTION API

| Campo | Detalhe |
|-------|---------|
| **Fornecedor** | Evolution API (open-source — instância gerenciada por responsabilidade do operador) |
| **Finalidade** | Gateway de integração com WhatsApp Business API (canal de atendimento futuro) |
| **Categorias de Dados** | PERSONAL (número de telefone, mensagens de texto) |
| **Dados Enviados** | Mensagens de entrada e saída do WhatsApp, número de telefone do usuário |
| **Localização** | A VALIDAR — depende de onde a instância está hospedada |
| **Retenção** | A VALIDAR — política de retenção da instância Evolution API |
| **Base Contratual** | A VALIDAR — open-source, responsabilidade do operador |
| **DPA Disponível** | Não aplicável (open-source) — responsabilidade de configuração e isolamento é do operador |
| **Transferência Internacional** | A VALIDAR — depende da hospedagem da instância |
| **Status** | Não implementado. Avaliação de hospedagem e isolamento A VALIDAR antes de ativação |

---

## 7. MERCADO PAGO

| Campo | Detalhe |
|-------|---------|
| **Fornecedor** | Mercado Pago S.A. (MercadoLibre Group) |
| **Finalidade** | Processamento de pagamentos Pix, cartão e outros métodos |
| **Categorias de Dados** | FINANCIAL (valores, status de pagamento), PERSONAL (dados de identificação para KYC se aplicável) |
| **Dados Enviados** | Dados do pedido, valor, método de pagamento, dados do comprador para confirmação |
| **Localização** | Brasil (operação local) + infraestrutura regional |
| **Retenção** | A VALIDAR — obrigações legais de dados financeiros no Brasil |
| **Base Contratual** | Termos e Condições Mercado Pago + contrato de credenciamento |
| **DPA Disponível** | A VALIDAR |
| **Transferência Internacional** | A VALIDAR — verificar infraestrutura de processamento |
| **Status** | Integração planejada. Credenciamento e contratos A VALIDAR |

---

## 8. ASAAS

| Campo | Detalhe |
|-------|---------|
| **Fornecedor** | Asaas Gestão Financeira S.A. |
| **Finalidade** | Gateway de pagamento alternativo — Pix, boleto, cartão |
| **Categorias de Dados** | FINANCIAL (valores, status), PERSONAL (dados do pagador conforme exigência regulatória) |
| **Dados Enviados** | Dados da cobrança, valor, método, dados do pagador |
| **Localização** | Brasil |
| **Retenção** | A VALIDAR — obrigações BACEN e fiscais |
| **Base Contratual** | Termos Asaas + contrato de subcredenciamento |
| **DPA Disponível** | A VALIDAR |
| **Transferência Internacional** | A VALIDAR |
| **Status** | Integração planejada. Contratos A VALIDAR |

---

## REVISÃO E ATUALIZAÇÃO

Este documento deve ser revisado:
- Ao adicionar qualquer novo fornecedor ou integração
- Ao renovar contratos com fornecedores existentes
- Anualmente como parte da revisão de governança
- Após qualquer incidente envolvendo um subprocessador

Itens marcados como `A VALIDAR` devem ser resolvidos antes do uso em produção com dados reais de titulares brasileiros.

---

*Concierge / Ostras.ai — Registro de Subprocessadores v1.0 — Setembro de 2026*
