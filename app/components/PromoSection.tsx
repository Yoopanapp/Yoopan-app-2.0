import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import { getZonePromos } from '../actions/getZonePromos';

// Ce composant est maintenant ASYNC (Serveur)
// Il reçoit le storeId directement en prop, plus besoin de 'use client' ni de useEffect
export default async function PromoSection({ storeId }: { storeId: string }) {
  
  if (!storeId) return null;

  // Récupération des données côté serveur (rapide et direct)
  // On ne garde que les 4 premières pour l'accueil
  const allPromos = await getZonePromos(storeId);
  const promos = allPromos.slice(0, 4);

  if (promos.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
                    <Flame size={24} className="fill-current animate-pulse" />
                </span>
                Immanquables du moment
            </h2>
            <Link href={`/promos?storeId=${storeId}`} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={18} />
            </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {promos.map((deal: any) => (
                <Link key={deal.ean} href={`/product/${deal.ean}`} className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div className="relative h-40 mb-3 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow-sm rotate-3">
                            -{deal.percent}%
                        </div>
                        {deal.image && (
                            <img src={deal.image} alt={deal.nom} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm mb-1">{deal.nom}</h3>
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 line-through">{deal.oldPrice.toFixed(2)}€</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white">{deal.price.toFixed(2)}€</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ArrowRight size={16} />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </div>
  );
}