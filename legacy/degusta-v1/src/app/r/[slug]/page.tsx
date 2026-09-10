import { notFound } from "next/navigation";
import Link from "next/link";
import { getRestaurantBySlug } from "@/services/restaurant.service";
import { getFullMenuByRestaurant } from "@/services/menu.service";
import { CartFloatingBar } from "@/components/cart-floating-bar";
import { Clock, MapPin, Phone, ShoppingBag } from "lucide-react";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const menu = await getFullMenuByRestaurant(restaurant.id);
  const isOpen = restaurant.status === "OPEN";

  return (
    <main className="max-w-xl mx-auto px-4 pt-4 pb-28">
      {/* Restaurant Header */}
      <header className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-100 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
              <MapPin className="w-4 h-4 shrink-0 text-neutral-400" />
              <span>{restaurant.address}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
              <Phone className="w-4 h-4 shrink-0 text-neutral-400" />
              <span>{restaurant.phone}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOpen
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {isOpen ? "Aberto" : "Fechado"}
            </span>
          </div>
        </div>

        {/* Operational Badges */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-100 text-xs text-neutral-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>
              {restaurant.estimatedTimeMin}–{restaurant.estimatedTimeMax} min
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-neutral-400" />
            <span>Entrega: R$ {Number(restaurant.fixedDeliveryFee).toFixed(2).replace(".", ",")}</span>
          </div>
        </div>

        {!isOpen && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <strong>Estamos fechados no momento.</strong>
            <br />
            Horário de funcionamento: {restaurant.openingHours}. Você pode explorar nosso cardápio livremente!
          </div>
        )}
      </header>

      {/* Category Navigation */}
      <nav className="sticky top-2 z-10 bg-neutral-50/95 backdrop-blur-xs py-2 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          {menu.map((category) => (
            <a
              key={category.id}
              href={`#cat-${category.id}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-900 transition-colors shrink-0 shadow-xs"
            >
              {category.name}
            </a>
          ))}
        </div>
      </nav>

      {/* Menu Categories and Products */}
      <div className="space-y-8">
        {menu.map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-14">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-neutral-900">{category.name}</h2>
              {category.description && (
                <p className="text-xs text-neutral-500 mt-0.5">{category.description}</p>
              )}
            </div>

            <div className="space-y-3">
              {category.products.map((product) => {
                const hasOptions = product.optionGroups && product.optionGroups.length > 0;
                const formattedPrice = `R$ ${Number(product.price).toFixed(2).replace(".", ",")}`;

                return (
                  <Link
                    key={product.id}
                    href={`/r/${slug}/produto/${product.id}`}
                    className="block bg-white rounded-xl p-4 border border-neutral-100 shadow-xs hover:border-neutral-300 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-900">
                            {formattedPrice}
                          </span>
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-900 text-white group-hover:bg-emerald-600 transition-colors">
                            {hasOptions ? "Opções" : "+ Adicionar"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Bottom Cart Bar */}
      <CartFloatingBar slug={slug} />
    </main>
  );
}
