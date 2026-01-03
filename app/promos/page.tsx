'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getZonePromos } from '../actions/getZonePromos';
import { Logo } from '../components/logo';
import Link from 'next/link';
import { 
  ArrowLeft, Tag, ShoppingCart, MapPin, Search, ChevronLeft, ChevronRight, Store, Heart, Share2,
  // Icônes Rayons & UI
  Beef, Apple, Milk, Coffee, Baby, SprayCan, Wine, Cookie, Utensils, Flame
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import MagicCart from '../components/MagicCart';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useFlyToCart } from '../context/FlyToCartContext';

// --- CONFIGURATION DES RAYONS (MAPPING) ---
const RAYONS_MAPPING: Record<string, string> = {
  'Viandes': 'Marché Frais', 'Poissons': 'Marché Frais', 'Fruits et Légumes': 'Marché Frais', 
  'Charcuterie': 'Marché Frais', 'Traiteur': 'Marché Frais', 'Saurisserie': 'Marché Frais',
  'Yaourts': 'Crèmerie', 'Fromages': 'Crèmerie', 'Lait': 'Crèmerie', 'Beurre': 'Crèmerie', 
  'Desserts lactés': 'Crèmerie', 'Oeufs': 'Crèmerie', 'Crème': 'Crèmerie',
  'Pâtes': 'Épicerie', 'Riz': 'Épicerie', 'Conserves': 'Épicerie', 'Huiles et Matières grasses': 'Épicerie',
  'Italiennes': 'Épicerie', 'Indiennes': 'Épicerie', 'Sauces': 'Épicerie', 'Condiments': 'Épicerie',
  'Plats cuisinés': 'Épicerie', 'Haricots et flageolets': 'Épicerie', 'Herbes et Epices': 'Épicerie',
  'Légumes secs': 'Épicerie', 'Soupes': 'Épicerie',
  'Biscuits': 'Sucré', 'Chocolat': 'Sucré', 'Confiserie': 'Sucré', 'Petit déjeuner': 'Sucré',
  'Café': 'Sucré', 'Thé': 'Sucré', 'Infusions': 'Sucré', 'Confitures': 'Sucré', 'Desserts': 'Sucré',
  'Eaux': 'Boissons', 'Jus': 'Boissons', 'Sodas': 'Boissons', 'Bières': 'Boissons', 
  'Vins': 'Boissons', 'Alcools': 'Boissons', 'Sirops': 'Boissons',
  'Bébé': 'Bébé', 'Couches': 'Bébé', 'Alimentation bébé': 'Bébé', 'Lait bébé': 'Bébé',
  'Hygiène': 'Hygiène & Maison', 'Beauté': 'Hygiène & Maison', 'Cheveux': 'Hygiène & Maison',
  'Lessive': 'Hygiène & Maison', 'Entretien': 'Hygiène & Maison', 'Papier toilette': 'Hygiène & Maison',
  'Incontinence': 'Hygiène & Maison', 'Insecticides': 'Hygiène & Maison', 'Mouchoirs': 'Hygiène & Maison'
};

const RAYONS_ICONS: Record<string, any> = {
  'Tout': Tag, 'Marché Frais': Beef, 'Crèmerie': Milk, 'Épicerie': Utensils,
  'Sucré': Cookie, 'Boissons': Wine, 'Bébé': Baby, 'Hygiène & Maison': SprayCan, 'Autres': ShoppingCart
};

const RAYON_ORDER = [
  'Tout', 'Marché Frais', 'Crèmerie', 'Épicerie', 'Sucré', 'Boissons', 'Bébé', 'Hygiène & Maison', 'Autres'
];

const getRayon = (subCategory: string) => {
  if (!subCategory) return 'Autres';
  return RAYONS_MAPPING[subCategory] || 'Autres';
};

const isRecent = (dateString: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays <= 3;
};

// --- COMPOSANT SKELETON (Pour le chargement pro) ---
function PromosSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-4 h-[450px] flex flex-col animate-pulse">
          <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-auto"></div>
          <div className="flex justify-between items-end mt-4">
            <div className="w-20 h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- COMPOSANT PRINCIPAL ---
function PromosContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');
  
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('percent-desc');
  const [selectedRayon, setSelectedRayon] = useState('Tout');
  const [selectedStore, setSelectedStore] = useState('Tout');
  
  // Favoris
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const itemsPerPage = 12;
  const { addToCart } = useCart();
  const { triggerFly } = useFlyToCart();

  useEffect(() => {
    if (storeId) {
      setLoading(true);
      getZonePromos(storeId)
        .then(data => setDeals(data as any[]))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [storeId]);

  useEffect(() => {
    const saved = localStorage.getItem('promos_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (ean: string) => {
    let newFavs;
    if (favorites.includes(ean)) newFavs = favorites.filter(id => id !== ean);
    else newFavs = [...favorites, ean];
    setFavorites(newFavs);
    localStorage.setItem('promos_favorites', JSON.stringify(newFavs));
  };

  const handleShare = async (deal: any) => {
    const text = `🔥 Regarde cette promo : ${deal.nom} à ${deal.price}€ (-${deal.percent}%) chez ${deal.storeName} !`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Super Promo',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Lien copié !'); // Tu peux remplacer par un toast sonner si tu l'as installé
    }
  };

  // --- LOGIQUE INTELLIGENTE ---
  const presentRayons = new Set(deals.map(d => getRayon(d.category)));
  const availableRayons = RAYON_ORDER.filter(r => r === 'Tout' || presentRayons.has(r));
  const availableStores = ['Tout', ...Array.from(new Set(deals.map(d => d.storeName)))].sort();

  let processedDeals = deals.filter(deal => {
    const matchesSearch = deal.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const productRayon = getRayon(deal.category);
    const matchesRayon = selectedRayon === 'Tout' || productRayon === selectedRayon;
    const matchesStore = selectedStore === 'Tout' || deal.storeName === selectedStore;
    const matchesFavorite = showFavoritesOnly ? favorites.includes(deal.ean) : true;
    return matchesSearch && matchesRayon && matchesStore && matchesFavorite;
  });

  processedDeals.sort((a, b) => {
      switch (sortBy) {
          case 'percent-desc': return b.percent - a.percent;
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          default: return 0;
      }
  });

  const totalPages = Math.ceil(processedDeals.length / itemsPerPage);
  const currentDeals = processedDeals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleRayonChange = (rayon: string) => { setSelectedRayon(rayon); setCurrentPage(1); };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setSortBy(e.target.value); setCurrentPage(1); };
  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setSelectedStore(e.target.value); setCurrentPage(1); };
  const paginate = (pageNumber: number) => { setCurrentPage(pageNumber); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleAdd = (e: React.MouseEvent, deal: any) => {
      const img = (e.currentTarget as HTMLElement).closest('.promo-card')?.querySelector('img');
      if (img) triggerFly(img.src, img.getBoundingClientRect());
      addToCart({
          ean: deal.ean, nom: deal.nom, image: deal.image, categorie: deal.category,
          offers: [{ magasin: deal.storeName, prix: deal.price }], nutriscore: 'A'
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* EN-TÊTE */}
        <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-full mb-4">
                <Tag size={32} className="fill-current animate-bounce" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                Promos de la Zone 📍
            </h1>
            
            {/* BARRE DE CONTRÔLE */}
            <div className="max-w-4xl mx-auto mt-8 flex flex-col md:flex-row gap-3 items-center">
                <div className="w-full md:flex-1 relative">
                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-yellow-400/30 outline-none transition-all shadow-sm" />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
                <div className="w-full md:w-48 relative">
                    <select value={selectedStore} onChange={handleStoreChange} className="w-full appearance-none pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-yellow-400/30 outline-none cursor-pointer shadow-sm">
                        <option value="Tout">🏪 Tous</option>
                        {availableStores.filter(s => s !== 'Tout').map(store => (<option key={store} value={store}>{store}</option>))}
                    </select>
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
                <div className="w-full md:w-48">
                    <select value={sortBy} onChange={handleSortChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-yellow-400/30 outline-none cursor-pointer shadow-sm">
                        <option value="percent-desc">🔥 Top Réduc</option>
                        <option value="price-asc">💶 Prix croissant</option>
                        <option value="price-desc">💎 Prix décroissant</option>
                    </select>
                </div>
                <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setCurrentPage(1); }} className={`w-full md:w-auto px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${showFavoritesOnly ? 'bg-red-500 text-white shadow-red-500/30 scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-red-300 hover:text-red-500'}`}>
                    <Heart size={18} className={showFavoritesOnly ? 'fill-current' : ''} />
                    <span className="md:hidden lg:inline">Favoris</span>
                </button>
            </div>

            {/* BARRE DE RAYONS */}
            {!loading && availableRayons.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2 py-6 mt-2">
                    {availableRayons.map(rayon => {
                        const Icon = RAYONS_ICONS[rayon] || Tag;
                        const isActive = selectedRayon === rayon;
                        return (
                            <button key={rayon} onClick={() => handleRayonChange(rayon)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md transform scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:scale-105'}`}>
                                <Icon size={16} /> {rayon}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>

        {/* GRILLE PRODUITS (Avec Skeleton si loading) */}
        {loading ? (
             <PromosSkeleton />
        ) : currentDeals.length > 0 ? (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {currentDeals.map((deal, idx) => {
                        const isFav = favorites.includes(deal.ean);
                        const isNew = isRecent(deal.updatedAt);
                        return (
                            <div key={deal.ean} className="promo-card relative group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                
                                {/* Badge -% */}
                                <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-sm font-black px-3 py-1 rounded-full shadow-lg rotate-3">
                                    -{deal.percent}%
                                </div>
                                
                                {/* Badge "Récent" */}
                                {isNew && (
                                    <div className="absolute top-14 right-14 z-10 bg-yellow-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse flex items-center gap-1">
                                        <Flame size={10} className="fill-slate-900" /> NEW
                                    </div>
                                )}

                                {/* Badge Catégorie */}
                                <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-black/50 backdrop-blur-md text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-white/10 shadow-sm">
                                    {deal.category}
                                </div>

                                {/* Boutons Flottants : Coeur et Partage */}
                                <div className="absolute top-14 right-4 z-20 flex flex-col gap-2">
                                    {/* Favoris */}
                                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(deal.ean); }} className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-100 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all group/fav">
                                        <Heart size={18} className={`transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover/fav:text-red-400'}`} />
                                    </button>
                                    {/* Partage */}
                                    <button onClick={(e) => { e.stopPropagation(); handleShare(deal); }} className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-100 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all group/share">
                                        <Share2 size={18} className="text-slate-400 group-hover/share:text-blue-500" />
                                    </button>
                                </div>

                                <div className="h-56 p-6 flex items-center justify-center bg-white dark:bg-slate-800">
                                    {deal.image && <img src={deal.image} alt={deal.nom} className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />}
                                </div>

                                <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-y border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                     <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 overflow-hidden">
                                        <MapPin size={14} className="shrink-0" />
                                        <span className="text-xs font-bold truncate uppercase tracking-tight">{deal.storeName}</span>
                                     </div>
                                     <span className="text-[10px] font-bold text-slate-400 shrink-0">{deal.storeDist.toFixed(1)} km</span>
                                </div>

                                <div className="p-6">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2 h-10 mb-3 leading-tight">{deal.nom}</h3>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 line-through font-medium mb-0.5">{deal.oldPrice.toFixed(2)}€</p>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{deal.price.toFixed(2)}€</p>
                                        </div>
                                        <button onClick={(e) => handleAdd(e, deal)} className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-900 flex items-center justify-center hover:scale-110 hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-yellow-400/30">
                                            <ShoppingCart size={22} className="fill-slate-900/20" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pb-10">
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={20} /></button>
                        <span className="px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 font-bold text-sm">Page {currentPage} / {totalPages}</span>
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={20} /></button>
                    </div>
                )}
            </>
        ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="text-6xl mb-4">🤷‍♂️</div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-white">{showFavoritesOnly ? "Aucun favori enregistré" : "Aucun produit trouvé"}</h3>
                <p className="text-slate-500 mt-2">{showFavoritesOnly ? "Cliquez sur le coeur pour ajouter des produits." : "Essayez d'autres filtres."}</p>
                {showFavoritesOnly && (<button onClick={() => setShowFavoritesOnly(false)} className="mt-4 text-blue-500 font-bold hover:underline">Voir toutes les promos</button>)}
            </div>
        )}
    </div>
  );
}

export default function PromosPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white font-sans pb-20 transition-colors duration-300">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 transition-colors"><ArrowLeft size={18} /></div>
            <span className="font-bold text-sm hidden sm:inline">Accueil</span>
          </Link>
          <div className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-black text-xl tracking-tight">Promos Zone</span></div>
          <div className="w-20 flex justify-end"><ThemeToggle /></div>
        </div>
      </nav>
      <Suspense fallback={<div className="py-20 text-center text-slate-400">Chargement...</div>}><PromosContent /></Suspense>
      <Footer /><MagicCart />
    </div>
  );
}