import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, MapPin, TrendingUp, Info } from 'lucide-react';
import { notFound } from 'next/navigation';
import MagicCart from '@/app/components/MagicCart'; // Adapte le chemin si besoin

export default async function ProductPage({ params }: { params: Promise<{ ean: string }> }) {
  const { ean } = await params;

  // 1. Récupérer le produit et ses prix
  const product = await prisma.product.findUnique({
    where: { id: ean },
    include: {
      prices: {
        include: { store: true },
        orderBy: { valeur: 'asc' } // Le moins cher en premier
      },
      category: true
    }
  });

  if (!product) return notFound();

  // 2. Calculs simples
  const bestPrice = product.prices[0];
  const worstPrice = product.prices[product.prices.length - 1];
  const ecart = worstPrice ? worstPrice.valeur - bestPrice.valeur : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20 font-sans">
      
      {/* NAVBAR SIMPLE */}
      <nav className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="text-slate-700 dark:text-white" />
        </Link>
        <h1 className="font-bold text-lg truncate flex-1 text-slate-900 dark:text-white">Détail Produit</h1>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        
        {/* CARTE PRINCIPALE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8 flex flex-col md:flex-row gap-8 mb-8 animate-fade-in-up">
            
            {/* Image */}
            <div className="w-full md:w-1/3 flex items-center justify-center bg-white p-4 rounded-2xl">
                <img src={product.image || ''} alt={product.nom} className="max-h-64 object-contain" />
            </div>

            {/* Infos */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">
                        {product.category?.nom || 'Produit'}
                    </span>
                    {/* NUTRISCORE (Simulé ici, à connecter à OpenFoodFacts si tu veux) */}
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase border border-green-200">
                        Nutri-Score A
                    </span>
                </div>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{product.nom}</h1>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 mb-1">Meilleur prix trouvé :</p>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {bestPrice?.valeur.toFixed(2)}€
                        </span>
                        {ecart > 0 && (
                             <span className="text-sm text-green-600 font-bold mb-1.5">
                                 Économisez {ecart.toFixed(2)}€ par rapport au plus cher
                             </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-blue-600 font-medium">
                        <MapPin size={14} /> Chez {bestPrice?.store?.nom}
                    </div>
                </div>
            </div>
        </div>

        {/* LISTE DES PRIX (TABLEAU) */}
        <h2 className="text-xl font-bold mb-4 px-2 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Comparatif des prix
        </h2>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {product.prices.map((price, idx) => (
                <div key={price.id} className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${idx !== product.prices.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-400 text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {idx + 1}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">{price.store?.nom}</p>
                            {price.promo && price.promo > price.valeur && (
                                <span className="text-[10px] text-red-500 font-bold bg-red-100 px-1.5 py-0.5 rounded">PROMO</span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-black text-lg ${idx === 0 ? 'text-green-600' : 'text-slate-900 dark:text-slate-400'}`}>
                            {price.valeur.toFixed(2)}€
                        </p>
                        {price.promo && price.promo > price.valeur && (
                            <p className="text-xs text-slate-400 line-through">{price.promo.toFixed(2)}€</p>
                        )}
                    </div>
                </div>
            ))}
        </div>

      </div>
      <MagicCart />
    </div>
  );
}