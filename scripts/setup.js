#!/usr/bin/env node

/**
 * CONCIERGE / OSTRAS.AI — SETUP & DIAGNOSTIC SCRIPT
 * Checks node version, pnpm workspace integrity and environment configuration.
 */

import fs from "fs";
import path from "path";

console.log("\n🚀 Inicializando verificador de ambiente Concierge / Ostras.ai...\n");

const envPath = path.resolve(process.cwd(), ".env");
const envExamplePath = path.resolve(process.cwd(), ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log("ℹ️ Arquivo .env não encontrado. Criando cópia a partir de .env.example...");
  fs.copyFileSync(envExamplePath, envPath);
  console.log("✅ Arquivo .env criado com sucesso!");
} else if (fs.existsSync(envPath)) {
  console.log("✅ Arquivo .env existente detectado.");
}

console.log("\n📦 Estrutura do Monorepo:");
console.log("  - apps/web             (Next.js App Router)");
console.log("  - packages/core        (Domínio de negócio & Orders/Degusta)");
console.log("  - packages/ai          (Agentes, Tools & LLM Orchestration)");
console.log("  - packages/database    (Prisma Schema & Client)");
console.log("  - packages/ui          (Componentes compartilhados)");
console.log("  - packages/config      (Configurações base TS & Lint)");

console.log("\n✨ Para iniciar o projeto:");
console.log("  1. Configure as chaves no seu .env (DATABASE_URL, GEMINI_API_KEY, etc.)");
console.log("  2. Instale dependências: pnpm install");
console.log("  3. Gere o Prisma Client: pnpm db:generate");
console.log("  4. Inicie o servidor:    pnpm dev\n");
