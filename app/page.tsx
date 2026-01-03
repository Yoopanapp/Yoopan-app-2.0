import { prisma } from '@/lib/prisma';
import SearchBar from './components/SearchBar';
import { Logo } from './components/logo';
import Footer from './components/Footer';
import MagicCart from './components/MagicCart';
// import RecipeSection from './components/RecipeSection'; // RETIRÉ
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import ThemeToggle from './components/ThemeToggle';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import StoreSelector from './components/StoreSelector';

// --- IMPORTS INTELLIGENTS ---
import { Suspense } from 'react';
import PromoSection from './components/PromoSection';
import PromoSectionSkeleton from './components/PromoSectionSkeleton';
import AuthButton from './components/AuthButton'; 

export const dynamic = 'force-dynamic';

// --- UTILITAIRES ---
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// --- TYPES ---
type Offer = { 
  id: string; 
  magasin: string; 
  prix: number; 
  lat?: number;
  lng?: number;
  isMyStore?: boolean;
  distance?: number;
};

type GroupedProduct = { 
  ean: string; 
  nom: string; 
  image: string | null; 
  categorie: string | null; 
  nutriscore: string | null;
  offers: Offer[]; 
  bestPrice: number; 
  worstPrice: number; 
  averagePrice: number;
  savings: number; 
  savingsPercent: number; 
  prix?: number; 
  magasin?: string;
  isNationalPrice?: boolean; 
};

function Feature({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="text-4xl mb-4 bg-slate-50 dark:bg-slate-700 w-16 h-16 flex items-center justify-center rounded-full">{icon}</div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{desc}</p>
    </div>
  );
}

export default async function Home(props: { searchParams: Promise<{ q?: string; filter?: string; storeId?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || '';
  const filter = searchParams.filter || 'all';
  const rawStoreId = searchParams.storeId; 

  // --- LOGIQUE METIER ---
  let targetStoreIds: string[] = [];
  let selectedStoreData: { id: string, lat: number | null, lng: number | null, nom: string } | null = null;

  if (rawStoreId) {
    const possibleIds = [rawStoreId];
    if (rawStoreId.length === 5) possibleIds.push(`0${rawStoreId}`);

    const store = await prisma.store.findFirst({
      where: {
        OR: [
          { id: { in: possibleIds } },
          { noPL: { in: possibleIds } },
          { noPR: { in: possibleIds } } 
        ]
      },
      select: { id: true, lat: true, lng: true, nom: true }
    });

    if (store) {
        selectedStoreData = store;
        if (store.lat && store.lng) {
            const allStores = await prisma.store.findMany({
                where: { lat: { not: null }, lng: { not: null } },
                select: { id: true, lat: true, lng: true }
            });
            targetStoreIds = allStores
                .map(s => ({
                    id: s.id,
                    dist: getDistanceFromLatLonInKm(store.lat!, store.lng!, s.lat!, s.lng!)
                }))
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 4) 
                .map(s => s.id);
        } else {
            targetStoreIds = [store.id];
        }
    }
  }

  // --- REQUÊTES ---
  let whereClause: Prisma.ProductWhereInput = {};
  if (query) whereClause.nom = { contains: query, mode: 'insensitive' };
  
  if (filter === 'bio') whereClause.OR = [{ nom: { contains: 'bio', mode: 'insensitive' } }, { category: { nom: { contains: 'bio', mode: 'insensitive' } } }];
  else if (filter === 'boissons') whereClause.category = { nom: { contains: 'Boissons', mode: 'insensitive' } };
  else if (filter === 'frais') whereClause.category = { nom: { in: ['Frais', 'Produits laitiers', 'Viandes', 'Charcuterie'], mode: 'insensitive' } };
  else if (filter === 'epicerie') whereClause.category = { nom: { in: ['Épicerie', 'Conserves', 'Epicerie salée', 'Epicerie sucrée'], mode: 'insensitive' } };

  if (rawStoreId && targetStoreIds.length === 0) {
      whereClause.id = "BLOCK_RESULTS_BECAUSE_STORE_NOT_FOUND";
  } else if (rawStoreId && targetStoreIds.length > 0) {
      whereClause.prices = { some: { storeId: { in: targetStoreIds } } };
  }

  const rawProducts = await prisma.product.findMany({
    where: whereClause,
    include: { 
      category: true,
      prices: { 
        include: { store: true }, 
        orderBy: { valeur: 'asc' } 
      } 
    },
    take: 50,
    orderBy: { nom: 'asc' }
  });

  const groupedProducts: GroupedProduct[] = rawProducts.map(product => {
      const allPrices = product.prices || [];
      
      const leclercPrices = allPrices.filter(p => p.store && p.store.nom.toLowerCase().includes('leclerc'));
      const averagePrice = leclercPrices.length > 0 
        ? leclercPrices.reduce((sum, p) => sum + p.valeur, 0) / leclercPrices.length
        : 0;

      let localPrices = allPrices;
      if (rawStoreId && targetStoreIds.length > 0) {
          localPrices = allPrices.filter(p => targetStoreIds.includes(p.storeId));
      }

      const isAvailable = localPrices.length > 0;
      const bestPrice = isAvailable ? localPrices[0].valeur : 0;
      const worstPrice = isAvailable ? localPrices[localPrices.length - 1].valeur : 0;
      
      const offers: Offer[] = localPrices.map(p => {
          let dist = 0;
          if (selectedStoreData && selectedStoreData.lat && selectedStoreData.lng && p.store?.lat && p.store?.lng) {
             dist = getDistanceFromLatLonInKm(selectedStoreData.lat, selectedStoreData.lng, p.store.lat, p.store.lng);
          }
          return {
            id: p.id, magasin: p.store ? p.store.nom : "Magasin Inconnu", prix: p.valeur,
            lat: (p.store && p.store.lat !== null) ? p.store.lat : undefined, 
            lng: (p.store && p.store.lng !== null) ? p.store.lng : undefined,
            isMyStore: selectedStoreData ? (p.storeId === selectedStoreData.id) : false, 
            distance: dist
          };
      });

      let displayStoreName = 'Indisponible';
      if (isAvailable) {
          if (selectedStoreData && localPrices[0].storeId === selectedStoreData.id) displayStoreName = localPrices[0].store?.nom || 'Mon Magasin';
          else displayStoreName = localPrices[0].store?.nom || 'Voisin';
      }

      return {
          ean: product.id, nom: product.nom, image: product.image, categorie: product.category ? product.category.nom : 'Non catégorisé', nutriscore: 'E',
          offers: offers, 
          bestPrice: bestPrice, 
          worstPrice: worstPrice,
          averagePrice: averagePrice, 
          savings: worstPrice - bestPrice, 
          savingsPercent: worstPrice > 0 ? Math.round(((worstPrice - bestPrice) / worstPrice) * 100) : 0,
          prix: bestPrice, 
          magasin: displayStoreName, 
          isNationalPrice: false
      };
  });

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 font-sans relative flex flex-col selection:bg-blue-100 transition-colors duration-300">
      
      {/* FOND ANIMÉ */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen dark:bg-blue-900/10 animate-pulse" />
          <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen dark:bg-purple-900/10 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* --- HEADER FIXE (Sticky) --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-4">
            
            {/* GAUCHE: Logo */}
            <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center gap-2 group">
                    <Logo className="w-8 h-8 transition-transform group-hover:rotate-12" />
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter hidden sm:inline">
                        Yoo<span className="text-blue-600">Pan</span>
                    </span>
                </Link>
            </div>

            {/* CENTRE: Sélecteur de magasin */}
            <div className="flex-1 flex justify-center">
                <StoreSelector />
            </div>

            {/* DROITE: Menus */}
            <div className="flex-shrink-0 flex items-center gap-3">
                <Link href="/favorites" className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors">
                    <span>❤️</span> Favoris
                </Link>
                
                <Link href="/recipes" className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors mr-2">
                   <span>📖</span> Recettes
                </Link>
                
                <div className="hidden sm:block">
                   <ThemeToggle />
                </div>
                
                {/* --- ICI : LE NOUVEAU BOUTON DE CONNEXION --- */}
                <AuthButton />

            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 pt-28 pb-12 lg:pt-36 lg:pb-16 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            🚀 Le comparateur E.Leclerc n°1
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Vos courses,<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-300% animate-gradient">
              au vrai prix.
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            Comparez instantanément les prix de votre magasin avec ses voisins. 
            Économisez jusqu'à <span className="font-bold text-slate-800 dark:text-white">20%</span> sur votre ticket de caisse sans changer vos habitudes.
          </p>

          <div className="relative max-w-2xl mx-auto mb-8 z-20 flex gap-2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex-1 shadow-2xl shadow-blue-900/5 rounded-2xl">
                 <SearchBar />
              </div>
              
              {/* BOUTON SCANNER */}
              <Link href="/scan" className="w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all" title="Scanner un produit">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75z" />
                 </svg>
              </Link>
          </div>
          
          <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <FilterBar />
          </div>
        </div>
      </div>

      {/* --- SECTION PROMOS ASYNCHRONE --- */}
      {/* S'affiche UNIQUEMENT si un magasin est sélectionné */}
      {rawStoreId && (
          <Suspense fallback={<PromoSectionSkeleton />}>
              <PromoSection storeId={rawStoreId} />
          </Suspense>
      )}

      {/* --- SECTION "INSPIRATION" SUPPRIMÉE ICI --- */}

      {!query && (
        <div className="py-12 px-6 border-t border-slate-100 dark:border-slate-800 relative z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature icon="📍" title="Comparaison Locale" desc="Nous comparons votre magasin avec ses 3 voisins les plus proches." />
            <Feature icon="📊" title="Moyenne Nationale" desc="Comparez le prix de votre magasin avec la moyenne de tous les Leclerc." />
            <Feature icon="💰" title="Économies" desc="Choisissez le moins cher de votre zone géographique." />
          </div>
        </div>
      )}

      {/* --- GRILLE DE PRODUITS --- */}
      <div id="market" className="max-w-7xl mx-auto px-4 sm:px-6 flex-grow pt-8 relative z-10">
        <div className="flex items-end justify-between mb-8 px-2 border-b border-slate-200 dark:border-slate-800 pb-4">
           <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
               {query ? `Résultats pour "${query}"` : filter !== 'all' ? `Rayon : ${filter}` : 'Les immanquables'}
             </h2>
             {selectedStoreData && (
                 <p className="text-blue-600 text-sm mt-1 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Zone : {selectedStoreData.nom} + 3 voisins
                 </p>
             )}
           </div>
           <div className="text-right text-sm text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
               {groupedProducts.length} produits trouvés
           </div>
        </div>

        {groupedProducts.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
             <div className="text-6xl mb-4">🔍</div>
             <h3 className="text-xl font-bold text-slate-700 dark:text-white">Aucun produit disponible</h3>
             <p className="text-slate-500 mt-2">
                {rawStoreId && targetStoreIds.length === 0 
                  ? "Impossible de trouver ce magasin. Vérifiez l'ID." 
                  : "Ces produits ne sont pas vendus dans votre zone."}
             </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {groupedProducts.map((product) => (<ProductCard key={product.ean} product={product as any} />))}
        </div>
      </div>

      <Footer />
      <MagicCart />
    </main>
  );
}