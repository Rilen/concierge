import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concierge / Ostras.ai — Assistente Inteligente de Gastronomia & Delivery",
  description: "Marketplace com agentes de IA para descoberta gastronômica, pedidos delivery e reservas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
