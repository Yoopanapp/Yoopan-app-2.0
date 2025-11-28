import { PrismaClient } from '@prisma/client'; // Utilise PrismaClient directement si ton lib/prisma pose souci
import { Logo } from '@/app/components/logo';
import ProductImage from '@/app/components/ProductImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReportPriceButton from '@/app/components/ReportPriceButton';

// On instancie Prisma ici pour être sûr
const prisma = new PrismaClient();

function getStoreStyle(magasin: string) {
  const m = magasin.toLowerCase();
  if (m.includes('leclerc')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (m.includes('carrefour')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (m.includes('auchan')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (m.includes('inter')) return 'bg-red-50 text-red-700 border-red-200';
  if (m.includes('monoprix')) return 'bg-gray-100 text-gray-800 border-gray-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
}

export default async function ProductPage({ params }: { params: Promise<{ ean: string }> }) {
  const { ean } = await params;

  // 1. NOUVELLE REQUÊTE : On cherche UN produit (findUnique) et on inclut ses PRIX
  const product = await prisma.product.findUnique({
    where: { ean: ean },
    include: {
      prices: {
        orderBy: { valeur: 'asc' }, // On trie les prix ici
      },
    },
  });

  // Si produit introuvable ou aucun prix
  if (!product || !product.prices || product.prices.length === 0) {
    notFound();
  }

  // 2. ADAPTATION DES DONNÉES (Mapping)
  // On transforme les données Prisma (valeur) vers le format attendu par ton UI (prix)
  const offers = product.prices.map(p => ({
    id: p.id,
    magasin: p.magasin,
    prix: p.valeur, // On renomme 'valeur' en 'prix' pour ton code
  }));

  const bestPrice = offers[0].prix;
  const worstPrice = offers[offers.length - 1].prix;
  const savings = worstPrice - bestPrice;
  const savingsPercent = worstPrice > 0 ? Math.round((savings / worstPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white font-sans pb-20">
      
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm hidden sm:inline">← Retour</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
             <Logo className="w-8 h-8" />
             <span className="font-bold text-xl">Yoo<span className="text-blue-600">Pan</span></span>
          </Link>
          <div className="w-20"></div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
              <div className="w-full h-80 relative">
                <ProductImage src={product.image || ''} alt={product.nom} />
              </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider w-fit mb-4">
              {product.categorie || 'Rayon'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
              {product.nom}
            </h1>
            <p className="text-slate-400 font-mono text-sm mb-8">EAN: {product.ean}</p>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-[1.02]">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <p className="text-blue-200 text-sm font-medium mb-1">Meilleure offre actuelle</p>
                   <div className="text-4xl font-bold">{bestPrice.toFixed(2)} €</div>
                 </div>
                 <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold">
                    -{savingsPercent}%
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm">🏆</div>
                 <div>
                   <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Disponible chez</p>
                   <p className="font-bold text-lg">{offers[0].magasin}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            📊 Comparatif des prix
            <span className="text-sm font-normal text-slate-400 ml-2">({offers.length} enseignes)</span>
          </h2>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            {offers.map((offer, index) => {
              const isBest = index === 0;
              return (
                <div key={offer.id} className={`p-5 flex items-center gap-4 ${index !== offers.length - 1 ? 'border-b border-slate-50 dark:border-slate-700' : ''} hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}>
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${isBest ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>{index + 1}</div>
                  <div className="w-32 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getStoreStyle(offer.magasin)}`}>{offer.magasin}</span>
                  </div>
                  <div className="flex-1 hidden sm:block h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isBest ? 'bg-emerald-500' : 'bg-blue-400'}`} style={{ width: `${(bestPrice / offer.prix) * 100}%` }}></div>
                  </div>
                  <div className="text-right w-28">
                    <div className={`font-bold text-lg ${isBest ? 'text-emerald-600' : 'text-slate-700 dark:text-white'}`}>{offer.prix.toFixed(2)} €</div>
                    {/* BOUTON SIGNALEMENT */}
                    <ReportPriceButton store={offer.magasin} currentPrice={offer.prix} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}