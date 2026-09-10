# PALADAR — CONSTITUIÇÃO DO PROJETO E REGRAS DE OURO

**Versão:** 1.0  
**Status:** NORMA FUNDAMENTAL DO PROJETO  
**Aplicação:** Todo agente de IA, desenvolvedor, automação, CLI, IDE ou ferramenta que modificar este projeto.

---

# PREÂMBULO

O PALADAR é uma plataforma web de pedidos para restaurantes, lanchonetes, pizzarias, hamburguerias e estabelecimentos semelhantes.

O projeto possui uma característica fundamental:

> **SIMPLICIDADE PARA O CLIENTE NÃO SIGNIFICA SIMPLICIDADE IRRESPONSÁVEL NA ENGENHARIA.**

A interface deve ser simples.
A arquitetura deve ser rigorosa.
O código deve ser seguro.
Os dados devem ser íntegros.
As regras de negócio devem possuir uma única fonte de verdade.
Nenhum agente está autorizado a sacrificar segurança, integridade, rastreabilidade ou arquitetura em nome de velocidade.

---

# ARTIGO 1 — HIERARQUIA DAS REGRAS

Toda decisão de implementação deverá obedecer à seguinte hierarquia:

1. Segurança.
2. Integridade dos dados.
3. LGPD e privacidade.
4. Isolamento multi-tenant.
5. Regras de negócio.
6. Arquitetura.
7. Contratos de API.
8. Testes.
9. UX.
10. Performance.
11. Conveniência de implementação.

Uma regra de nível inferior nunca poderá violar uma regra de nível superior.

---

# ARTIGO 2 — REGRA SUPREMA: NÃO QUEBRAR O QUE JÁ FUNCIONA

Antes de modificar qualquer componente:
* localizar sua implementação;
* entender sua finalidade;
* identificar consumidores;
* identificar dependências;
* identificar contratos;
* verificar testes;
* verificar impacto.

---

# ARTIGO 7 — SINGLE SOURCE OF TRUTH

Toda regra de negócio deve possuir uma única fonte de verdade.
É proibido duplicar regras em frontend, backend, banco ou componentes.
O frontend apenas apresenta. O servidor determina.

---

# ARTIGO 8 — SERVIDOR É A AUTORIDADE

Nunca confiar no navegador para: preço, subtotal, desconto, taxa, total, estoque, comissão, pontos, permissões, status ou autorização.

---

# ARTIGO 9 — DINHEIRO

Valores monetários nunca devem utilizar `float` para cálculos financeiros.
Preferência: integer em centavos ou tipo `numeric`/`decimal` do PostgreSQL.

---

# ARTIGO 10 — PEDIDO É HISTÓRICO IMUTÁVEL

Depois de finalizado, o pedido preserva snapshot integral dos dados utilizados no momento da compra.

---

# ARTIGO 13 & 14 — MULTI-TENANCY OBRIGATÓRIO E ZERO IDOR/BOLA

`restaurant_id` em todos os dados de estabelecimentos.
Identificadores públicos seguros (`public_id`), nunca expor IDs sequenciais previsíveis como chave de autorização.

---

# ARTIGO 15 A 19 — RBAC NO SERVIDOR

MASTER, GERENTE, PEDIDOS, CLIENTE.
Permissões verificadas server-side com validação de titularidade do tenant.

---

# ARTIGO 20 — LGPD BY DESIGN

Minimização de dados, sem CPF no MVP, sem retenção indefinida sem base legal.

---

# ARTIGO 40 — COMISSÃO PALADAR

0,5% sobre o valor dos pedidos originados pela plataforma.
Base é o valor do pedido auditável.

---

# PROTOCOLO OPERACIONAL OBRIGATÓRIO DO AGY

1. ENTENDER
2. INSPECIONAR
3. MAPEAR
4. CLASSIFICAR (SAFE, SAFE WITH PRECONDITION, RISKY, BLOCKED)
5. PLANEJAR
6. IMPLEMENTAR
7. VALIDAR (lint, typecheck, tests, build)
8. AUDITAR
9. REPORTAR (formato obrigatório)
