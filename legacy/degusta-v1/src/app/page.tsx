import Link from "next/link";
import { Utensils, ArrowRight, ShieldCheck, Smartphone, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white selection:bg-emerald-500 selection:text-neutral-900">
      {/* Navbar */}
      <nav className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 text-neutral-950 rounded-xl flex items-center justify-center font-bold">
            <Utensils className="w-4 h-4" />
          </div>
          <span className="font-black tracking-tight text-lg">PALADAR</span>
        </div>

        <Link
          href="/admin/login"
          className="text-xs font-semibold text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors"
        >
          Área do Restaurante
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-20 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
          <ShieldCheck className="w-3.5 h-3.5" /> O canal próprio de pedidos do seu estabelecimento
        </span>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
          Seu cardápio digital próprio. <br />
          <span className="text-emerald-400">Rápido, simples e sem taxas abusivas.</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Permita que seus clientes peçam em segundos pelo Instagram, WhatsApp ou QR Code.
          Taxa justa de apenas <strong>0,5%</strong> por pedido.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/r/pizzaria-demo"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Ver Cardápio Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/admin/login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-colors text-center"
          >
            Acessar Painel de Gestão
          </Link>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-800/40 p-6 rounded-3xl border border-neutral-800">
          <Smartphone className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-base font-bold mb-2">Zero Fricção no Celular</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            O cliente abre o link, escolhe, informa o endereço e pronto. Sem obrigação de criar conta ou instalar aplicativo.
          </p>
        </div>

        <div className="bg-neutral-800/40 p-6 rounded-3xl border border-neutral-800">
          <TrendingUp className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-base font-bold mb-2">Apenas 0,5% de Comissão</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Esqueça as taxas de 15% a 25% de marketplaces. No PALADAR, o faturamento do seu restaurante fica com você.
          </p>
        </div>

        <div className="bg-neutral-800/40 p-6 rounded-3xl border border-neutral-800">
          <Utensils className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-base font-bold mb-2">Operação de Cozinha Otimizada</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Painel ágil para recepcionar pedidos, confirmar, colocar em preparo e despachar para o cliente acompanhar ao vivo.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} PALADAR. O canal próprio de pedidos do restaurante.</p>
      </footer>
    </main>
  );
}
