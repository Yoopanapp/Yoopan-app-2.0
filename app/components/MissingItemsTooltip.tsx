// app/components/MissingItemsTooltip.tsx
import ProductImage from './ProductImage';

export default function MissingItemsTooltip({ items }: { items: { nom: string; image: string }[] }) {
  if (items.length === 0) return null;

  return (
    // CHANGEMENT ICI : Positionnement à GAUCHE (right-full) et centré verticalement (-translate-y-...)
    <div className="absolute right-full top-0 mr-2 hidden group-hover/tooltip:block z-50 w-72 -translate-y-1/4 animate-fade-in">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 relative">
        <p className="font-bold mb-3 text-slate-300 uppercase text-[10px] tracking-widest">Produits indisponibles :</p>
        <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
          {items.map((m, i) => (
            <div key={i + m.nom} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-md flex-shrink-0 overflow-hidden p-0.5 border border-slate-600">
                 <ProductImage src={m.image} alt={m.nom} />
              </div>
              <span className="text-xs font-medium leading-tight line-clamp-2">{m.nom}</span>
            </div>
          ))}
        </div>
        {/* Petite flèche sur la droite qui pointe vers la carte */}
        <div className="absolute top-6 -right-2 border-8 border-transparent border-l-slate-900"></div>
      </div>
    </div>
  );
}

