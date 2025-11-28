import { prisma } from '@/lib/prisma';
import SearchBar from './components/SearchBar';
import { Logo } from './components/logo';
import Footer from './components/Footer';
import MagicCart from './components/MagicCart';
import RecipeSection from './components/RecipeSection';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import ThemeToggle from './components/ThemeToggle';
import Link from 'next/link';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Types pour l'interface utilisateur
// MISE A JOUR : Ajout de lat et lng optionnels
type Offer = { 
  id: number; 
  magasin: string; 
  prix: number; 
  lat?: number; 
  lng?: number; 
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
  savings: number; 
  savingsPercent: number; 
  prix?: number;
  magasin?: string;
};

function Feature({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default async function Home(props: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  
  const searchParams = await props.searchParams;
  const query = searchParams.q || '';
  const filter = searchParams.filter || 'all';

  let whereClause: Prisma.ProductWhereInput = {};

  if (query) whereClause.nom = { contains: query, mode: 'insensitive' };
  if (filter === 'bio') whereClause.OR = [{ nom: { contains: 'bio', mode: 'insensitive' } }, { categorie: { contains: 'bio', mode: 'insensitive' } }];
  else if (filter === 'boissons') whereClause.categorie = { contains: 'Boissons', mode: 'insensitive' };
  else if (filter === 'frais') whereClause.OR = [{ categorie: { contains: 'Frais', mode: 'insensitive' } }, { categorie: { contains: 'Produits laitiers', mode: 'insensitive' } }, { categorie: { contains: 'Viandes', mode: 'insensitive' } }];
  else if (filter === 'epicerie') whereClause.OR = [{ categorie: { contains: 'Épicerie', mode: 'insensitive' } }, { categorie: { contains: 'Conserves', mode: 'insensitive' } }];
  else if (filter === 'sante') whereClause.nutriscore = { in: ['a', 'b', 'A', 'B'] };

  // 1. Récupération des données avec la relation PRICES ET STORE
  const rawProducts = await prisma.product.findMany({
    where: whereClause,
    include: {
      prices: {
        include: {
          store: true, // On récupère les infos du magasin lié (nom, lat, lng)
        },
        orderBy: { valeur: 'asc' }
      }
    },
    take: 100,
    orderBy: { id: 'asc' }
  });

  // 2. Transformation : Prisma (Nested) -> UI (GroupedProduct)
  const groupedProducts: GroupedProduct[] = rawProducts.map(product => {
      const prices = product.prices || [];
      const bestPrice = prices.length > 0 ? prices[0].valeur : 0;
      const worstPrice = prices.length > 0 ? prices[prices.length - 1].valeur : 0;
      const savings = worstPrice - bestPrice;
      const savingsPercent = worstPrice > 0 ? Math.round((savings / worstPrice) * 100) : 0;

      // On transforme les prix Prisma en Offres UI
      const offers: Offer[] = prices.map(p => ({
          id: p.id,
          magasin: p.store ? p.store.nom : "Magasin Inconnu",
          prix: p.valeur,
          // MISE A JOUR : On passe les coordonnées GPS
          lat: p.store ? p.store.lat : undefined,
          lng: p.store ? p.store.lng : undefined
      }));

      return {
          ean: product.ean,
          nom: product.nom,
          image: product.image,
          categorie: product.categorie,
          nutriscore: product.nutriscore || 'E',
          offers: offers,
          bestPrice: bestPrice,
          worstPrice: worstPrice,
          savings: savings,
          savingsPercent: savingsPercent,
          prix: bestPrice, 
          magasin: prices.length > 0 && prices[0].store ? prices[0].store.nom : 'Indisponible'
      };
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white font-sans relative flex flex-col transition-colors duration-300">
      
      <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <Link href="/" className="flex items-center gap-3 group">
          <Logo className="w-10 h-10 transition-transform group-hover:scale-110" />
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Yoo<span className="text-blue-600">Pan</span>
          </span>
        </Link>

        <div className="hidden md:flex gap-4 items-center">
            <Link href="/recipes" className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors mr-2">
                <span>📖</span> Recettes
            </Link>

            <Link href="/favorites" className="flex items-center gap-2 group mr-4 hover:scale-105 transition-transform" title="Mes Favoris">
              <span className="text-2xl group-hover:animate-pulse">❤️</span>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-600 hidden sm:inline">Mes Favoris</span>
            </Link>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <ThemeToggle />
            <Link href="/profile" className="ml-4 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-blue-600 px-5 py-2 rounded-full transition-colors shadow-lg">Mon Profil</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-50/50 via-purple-50/30 to-transparent pointer-events-none -z-10"></div>
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute top-[50px] right-[-100px] w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 drop-shadow-sm">
            Vos courses, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">au vrai prix.</span>
          </h1>
          <div className="relative max-w-2xl mx-auto mb-8 z-20"><SearchBar /></div>
          <FilterBar />
        </div>
      </div>

      {!query && filter === 'all' && (
        <RecipeSection allProducts={groupedProducts} />
      )}

      {!query && (
        <div className="py-12 px-6 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <Feature icon="📍" title="Géolocalisé" desc="Prix des magasins réellement autour de vous (Vigneux)." />
            <Feature icon="🛡️" title="100% Indépendant" desc="Transparence totale, aucune affiliation cachée." />
            <Feature icon="💰" title="Économies Réelles" desc="Nos utilisateurs économisent jusqu'à 20%." />
          </div>
        </div>
      )}

      <div id="market" className="max-w-7xl mx-auto px-4 sm:px-6 flex-grow pt-8">
        <div className="flex items-end justify-between mb-8 px-2 border-b border-slate-200 dark:border-slate-800 pb-4">
           <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
               {query ? `Résultats pour "${query}"` : filter !== 'all' ? `Rayon : ${filter}` : 'Les immanquables'}
             </h2>
             <p className="text-slate-500 text-sm mt-1">{groupedProducts.length} produits trouvés à proximité.</p>
           </div>
        </div>

        {groupedProducts.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-white">Aucun produit trouvé</h3>
            <p className="text-slate-500 mt-2">Essayez un autre filtre ou une autre recherche.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {groupedProducts.map((product) => (
            <ProductCard 
                key={product.ean} 
                // as any pour éviter les conflits mineurs temporaires
                product={product as any} 
            />
          ))}
        </div>
      </div>

      <Footer />
      <MagicCart />
    </main>
  );
}