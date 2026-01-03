'use client';

import { useEffect, useState, Suspense } from 'react'; // Ajout de Suspense
import { useUser } from '../context/UserContext';
import { getFavoriteProducts } from '../actions/getFavoriteProducts'; 
import ProductCard from '../components/ProductCard';
import { Logo } from '../components/logo';
import Link from 'next/link';
import { Heart, Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import MagicCart from '../components/MagicCart';
import { useSearchParams } from 'next/navigation'; // <-- Import indispensable

function FavoritesContent() {
  const { favorites } = useUser();
  const searchParams = useSearchParams(); // <-- On récupère les params URL
  const currentStoreId = searchParams.get('storeId'); // <-- L'ID du magasin sélectionné

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (favorites.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // On passe l'ID du magasin à l'action serveur
        const data = await getFavoriteProducts(favorites, currentStoreId);
        setProducts(data);
      } catch (error) {
        console.error("Erreur chargement favoris:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [favorites, currentStoreId]); // <-- On recharge si le magasin change !

  return (
    <main className="max-w-7xl mx-auto px-6">
        
        {/* BANDEAU TITRE */}
        <div className="flex items-end gap-4 mb-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mt-8">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500">
                <Heart size={32} className="fill-current animate-pulse-slow" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">Vos produits préférés</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {favorites.length} article{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''} 
                    {currentStoreId ? ' (Prix locaux affichés)' : ' (Prix indicatifs)'}.
                </p>
            </div>
        </div>

        {/* ÉTAT CHARGEMENT */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold animate-pulse">Récupération des meilleurs prix locaux...</p>
            </div>
        ) : products.length > 0 ? (
            // GRILLE PRODUITS
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {products.map((product) => (
                    <ProductCard key={product.ean} product={product} />
                ))}
            </div>
        ) : (
            // EMPTY STATE (VIDE)
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm px-4">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-4xl grayscale opacity-50">💔</div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Aucun favori pour l'instant</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    Cliquez sur le petit cœur des produits pour les retrouver ici et surveiller leurs prix.
                </p>
                <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center gap-2">
                    <ShoppingBag size={20} />
                    Explorer le catalogue
                </Link>
            </div>
        )}

      </main>
  );
}

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white font-sans pb-20 transition-colors duration-300">
      
      {/* HEADER */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 transition-colors"><ArrowLeft size={18} /></div>
            <span className="font-bold text-sm hidden sm:inline">Retour</span>
          </Link>
          <div className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-black text-xl tracking-tight">Mes Favoris</span></div>
          <div className="w-20 flex justify-end"><ThemeToggle /></div>
        </div>
      </nav>

      {/* CONTENU AVEC SUSPENSE (Requis pour useSearchParams) */}
      <Suspense fallback={<div className="py-20 text-center text-slate-400">Chargement...</div>}>
        <FavoritesContent />
      </Suspense>

      <MagicCart />
    </div>
  );
}