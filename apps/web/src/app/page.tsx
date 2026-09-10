"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Send,
  Utensils,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";

export default function HomePage() {
  const [inputPrompt, setInputPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "concierge"; text: string; time: string }>
  >([
    {
      role: "concierge",
      text: "Olá! Sou o seu Concierge inteligente do Ostras.ai. Posso te ajudar a encontrar os melhores pratos da região, fazer pedidos com entrega rápida ou reservar uma mesa especial. Como posso te servir hoje?",
      time: "Agora",
    },
  ]);

  const quickPrompts = [
    "🍕 Quero pedir uma pizza meio a meio",
    "🍔 Qual o melhor smash burger aberto agora?",
    "📅 Reservar uma mesa para 4 pessoas hoje à noite",
    "📦 Rastrear meu pedido delivery",
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMsg = { role: "user" as const, text, time: "Agora" };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");

    setTimeout(() => {
      let reply = "Estou verificando os melhores estabelecimentos disponíveis...";
      const lower = text.toLowerCase();

      if (lower.includes("pizza")) {
        reply = "Excelente escolha! A 'Pizzaria Demo' está com forno a lenha a todo vapor e entrega média em 35 minutos. Você pode montar sua pizza com até 4 sabores diretamente no cardápio digital!";
      } else if (lower.includes("burger")) {
        reply = "Temos opções sensacionais de artesanais e smash burgers com frete fixo promocional. Deseja ver o cardápio ou consultar os mais pedidos?";
      } else if (lower.includes("reserva") || lower.includes("mesa")) {
        reply = "Posso registrar a sua solicitação de reserva imediatamente. Qual seria o horário de sua preferência e nome para confirmação?";
      } else if (lower.includes("rastrear") || lower.includes("pedido")) {
        reply = "Para rastrear seu pedido com segurança total, você pode informar o seu código (ex: pld_abc123) ou acessar diretamente a página de acompanhamento!";
      }

      setChatMessages((prev) => [
        ...prev,
        { role: "concierge", text: reply, time: "Agora" },
      ]);
    }, 600);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center font-black text-slate-950 shadow-md shadow-emerald-900/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-xl text-white">CONCIERGE</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  Ostras.ai
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Marketplace Inteligente de Gastronomia & Serviços
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/r/pizzaria-demo"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
            >
              Cardápio Demo
            </Link>
            <Link
              href="/gestao"
              className="text-xs font-semibold text-white px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
            >
              Painel do Lojista
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
          <Sparkles className="w-4 h-4" /> Inteligência Artificial + Pedidos Próprios + Taxa Justa (0,5%)
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-4">
          Descubra, peça e reserve com o seu <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Concierge Pessoal
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          O primeiro ecossistema marketplace conversacional onde clientes realizam pedidos e reservas
          com facilidade incomparável, e os estabelecimentos preservam sua margem pagando apenas <strong>0,5%</strong> de comissão.
        </p>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 px-3.5 py-2 rounded-full border border-slate-800 transition flex items-center gap-1.5"
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Interactive AI Chat Box */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-white">Concierge Ativo</p>
                <p className="text-xs text-slate-400">Conectado ao catálogo ao vivo</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">Gemini 2.0 / Next-Gen Core</span>
          </div>

          {/* Messages list */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1 mb-4">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "concierge" && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-sm"
                      : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-sm"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Pergunte sobre restaurantes, monte seu pedido ou solicite uma reserva..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl font-bold flex items-center justify-center transition shadow-lg shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-2">Descoberta Personalizada</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O agente Concierge entende intenções naturais em linguagem humana, sugerindo pratos, combinações e estabelecimentos perfeitos para a ocasião.
          </p>
        </div>

        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-2">Módulo de Pedidos Seguro</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Validação severa no servidor de árvores de opções, cálculos em centavos inteiros e garantia de privacidade sem vazamento de dados internos.
          </p>
        </div>

        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-2">Reservas & Atendimento Omnichannel</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Agendamento de mesas e suporte integrado tanto no portal Web quanto diretamente no WhatsApp via Evolution API.
          </p>
        </div>
      </section>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Concierge / Ostras.ai. Arquitetura Monorepo & Domínio Limpo.</p>
      </footer>
    </main>
  );
}
