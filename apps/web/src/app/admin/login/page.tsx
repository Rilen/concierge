"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail, AlertCircle, Utensils } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/gestao";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        setErrorMsg(res.error.message || "Credenciais inválidas. Verifique seu e-mail e senha.");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
    } catch (err) {
      setErrorMsg((err as Error).message || "Erro inesperado ao realizar login.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 shadow-md">
      {/* Logo / Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Utensils className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">PALADAR</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Painel de Gestão e Administração
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-neutral-700 mb-1">
            E-mail
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-neutral-700 mb-1">
            Senha
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            <span>Entrar no Painel</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-neutral-100 text-[11px] text-neutral-400 text-center space-y-1">
        <p>Acesso restrito para administradores, gerentes e operadores.</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 shadow-md text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
