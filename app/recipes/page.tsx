'use client';

import { useState, useMemo, useEffect } from 'react';
import { Logo } from '../components/logo';
import Link from 'next/link';
import Footer from '../components/Footer';
import MagicCart from '../components/MagicCart';
import { Search, Clock, ChefHat, Flame, ArrowLeft, ShoppingBasket, Loader2, Check, X, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFlyToCart } from '../context/FlyToCartContext';
import ThemeToggle from '../components/ThemeToggle';
import { useSearchParams } from 'next/navigation';
import { matchRecipeIngredients, IngredientMatch } from '../actions/matchIngredients';
import { getZonePromos } from '../actions/getZonePromos';
import storesData from '../data/leclerc_stores.json';

// --- DATA RECETTES ---
const RECIPES = [
  { id: '1', title: 'Pâtes Carbonara', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80', time: '15 min', difficulty: 'Facile', calories: '650 kcal', tags: ['Pas cher', 'Étudiant'], ingredients: [ { term: 'Spaghetti', qty: 1 }, { term: 'Lardons', qty: 1 }, { term: 'Crème Fraîche', qty: 1 }, { term: 'Oeufs Plein Air', qty: 1 } ] },
  { id: '2', title: 'Bowl Saumon', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', time: '20 min', difficulty: 'Moyen', calories: '450 kcal', tags: ['Healthy', 'Frais'], ingredients: [ { term: 'Riz Basmati', qty: 1 }, { term: 'Saumon Fumé', qty: 2 }, { term: 'Avocat', qty: 2 } ] },
  { id: '3', title: 'Burger Maison', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', time: '25 min', difficulty: 'Facile', calories: '800 kcal', tags: ['Plaisir'], ingredients: [ { term: 'Pain Burger', qty: 1 }, { term: 'Steak Haché', qty: 2 }, { term: 'Cheddar Tranches', qty: 1 } ] }
];

const CATEGORIES = ['Tout', 'Pas cher', 'Rapide', 'Healthy', 'Végétarien', 'Dessert'];

const FRONT_BLACKLIST = [
  'Pizza', 'Burger', 'Sandwich', 'Box', 'Salade', 'Taboulé', 'Plat', 'Micro-ondes',
  'Bébé', 'Blédichef', 'Nestlé', 'Chat', 'Chien', 'Croquette', 'Terrine', 'Litière',
  'Soin', 'Visage', 'Corps', 'Main', 'Douche', 'Shampoing', 'Savon', 'Masque',
  'Glace', 'Bâtonnet', 'Sorbet', 'Biscuit', 'Gâteau', 'Bonbon', 'Confiserie'
];

const getStoreName = (id: string | null) => {
    if (!id) return "Mon Magasin";
    const cleanId = id.length === 4 ? `0${id}` : id;
    const store = (storesData as any[]).find(s => s.id === cleanId || s.noPR === cleanId || s.noPL === cleanId);
    return store ? (store.nom || store.name || "Mon Magasin") : "Mon Magasin";
};

export default function RecipesPage() {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [search, setSearch] = useState('');
  const { addToCart } = useCart();
  const { triggerFly } = useFlyToCart();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matches, setMatches] = useState<IngredientMatch[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({}); 
  const [currentRecipeImg, setCurrentRecipeImg] = useState('');
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});

  const [promoRecipeIds, setPromoRecipeIds] = useState<string[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  
  // NOUVEAU : On stocke les données brutes des promos pour les réutiliser
  const [zonePromosData, setZonePromosData] = useState<any[]>([]);

  const searchParams = useSearchParams();
  const currentStoreId = searchParams.get('storeId');
  const currentStoreName = useMemo(() => getStoreName(currentStoreId), [currentStoreId]);

  useEffect(() => {
    if (currentStoreId) {
        setLoadingPromos(true);
        getZonePromos(currentStoreId).then((promos) => {
            setZonePromosData(promos); // On sauvegarde les promos ici !
            
            const idsWithPromo: string[] = [];
            RECIPES.forEach(recipe => {
                const hasPromo = recipe.ingredients.some(ing => 
                    promos.some((p: any) => 
                        p.nom.toLowerCase().includes(ing.term.toLowerCase()) && 
                        // On garde la détection souple ici pour la bannière
                        (p.percent >= 10 || (p.oldPrice && p.oldPrice > p.price)) &&
                        !FRONT_BLACKLIST.some(bad => p.nom.toLowerCase().includes(bad.toLowerCase()))
                    )
                );
                if (hasPromo) idsWithPromo.push(recipe.id);
            });
            setPromoRecipeIds(idsWithPromo);
        }).catch(console.error).finally(() => setLoadingPromos(false));
    } else { setLoadingPromos(false); }
  }, [currentStoreId]);

  const filteredRecipes = RECIPES.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Tout' || recipe.tags.includes(activeCategory);
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
      const aHasPromo = promoRecipeIds.includes(a.id);
      const bHasPromo = promoRecipeIds.includes(b.id);
      if (aHasPromo && !bHasPromo) return -1;
      if (!aHasPromo && bHasPromo) return 1;
      return 0;
  });

  const openRecipeModal = async (recipe: any) => {
    if (!currentStoreId) { alert("Veuillez d'abord sélectionner un magasin sur l'accueil !"); return; }
    
    setIsModalOpen(true);
    setLoadingMatches(true);
    setCurrentRecipeImg(recipe.image);
    setMatches([]); 
    setExpandedIngredients({});

    try {
        // 1. On lance la recherche standard côté serveur
        const results = await matchRecipeIngredients(recipe.ingredients, currentStoreId);
        
        // 2. INJECTION INTELLIGENTE : On force les promos connues dans la liste
        const augmentedResults = results.map(group => {
            // Chercher dans nos promos locales si un produit correspond à cet ingrédient
            const localPromos = zonePromosData.filter((p: any) => 
                p.nom.toLowerCase().includes(group.term.toLowerCase()) && 
                !FRONT_BLACKLIST.some(bad => p.nom.toLowerCase().includes(bad.toLowerCase()))
            );

            // Transformer ces promos au format de la modale
            const formattedPromos = localPromos.map((p: any) => ({
                ean: p.ean,
                nom: p.nom,
                image: p.image,
                brand: p.nom.split(' ')[0], // Estimation marque
                prix: p.price,
                promo: p.oldPrice || (p.price * 1.2), // Si pas d'ancien prix, on simule pour l'affichage visuel
                hasPromo: true // ON FORCE LE DRAPEAU
            }));

            // Fusionner : Promos injectées + Résultats serveur (sans doublons)
            const allMatches = [...formattedPromos, ...group.matches];
            const uniqueMatches = Array.from(new Map(allMatches.map(item => [item.ean, item])).values());

            // Re-trier pour être sûr que les promos injectées sont en haut
            uniqueMatches.sort((a, b) => (b.hasPromo ? 1 : 0) - (a.hasPromo ? 1 : 0));

            return {
                ...group,
                matches: uniqueMatches
            };
        });

        setMatches(augmentedResults);
        
        // Sélection par défaut
        const defaults: Record<string, string> = {};
        augmentedResults.forEach(m => { if (m.matches.length > 0) defaults[m.term] = m.matches[0].ean; });
        setSelectedProducts(defaults);

    } catch (e) {
        console.error(e);
        alert("Erreur lors de la recherche.");
        setIsModalOpen(false);
    } finally {
        setLoadingMatches(false);
    }
  };

  const toggleExpand = (term: string) => {
      setExpandedIngredients(prev => ({ ...prev, [term]: !prev[term] }));
  };

  const confirmAddToCart = () => {
    matches.forEach(match => {
        const selectedEan = selectedProducts[match.term];
        const product = match.matches.find(p => p.ean === selectedEan);
        if (product) {
            addToCart({
                ean: product.ean, nom: product.nom, image: product.image || currentRecipeImg,
                categorie: 'Ingrédient Recette', offers: [{ magasin: currentStoreName, prix: product.prix }], nutriscore: 'A'
            });
        }
    });
    setIsModalOpen(false);
    const firstImg = document.getElementById('modal-img');
    if (firstImg) triggerFly(firstImg.getAttribute('src') || '', firstImg.getBoundingClientRect());
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white font-sans pb-20 transition-colors duration-300">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors text-sm">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 transition-colors"><ArrowLeft size={18} /></div>
            <span className="hidden sm:inline">Accueil</span>
          </Link>
          <div className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-black text-xl tracking-tight">Cuisiner</span></div>
          <div className="w-20 flex justify-end"><ThemeToggle /></div>
        </div>
      </nav>

      {/* --- MODALE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-black">Choisissez vos produits</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {loadingMatches ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            <p className="text-slate-500 font-bold">Recherche des meilleurs prix...</p>
                        </div>
                    ) : (
                        matches.map((match, idx) => {
                            const isExpanded = expandedIngredients[match.term];
                            const visibleProducts = isExpanded ? match.matches : match.matches.slice(0, 3);
                            const hasMore = match.matches.length > 3;

                            return (
                                <div key={idx} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">{match.term}</span>
                                        <span className="text-sm text-slate-400">({match.qty}x)</span>
                                    </div>

                                    {match.matches.length > 0 ? (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {visibleProducts.map((prod) => (
                                                    <div 
                                                        key={prod.ean} 
                                                        onClick={() => setSelectedProducts(prev => ({ ...prev, [match.term]: prod.ean }))}
                                                        className={`relative p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                                                            selectedProducts[match.term] === prod.ean 
                                                            ? 'border-blue-500 ring-2 ring-blue-500/20' 
                                                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                                        } ${
                                                            prod.hasPromo ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' : 'bg-white dark:bg-slate-900'
                                                        }`}
                                                    >
                                                        {prod.hasPromo && (
                                                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse z-10">
                                                                <Tag size={10} className="fill-current" /> PROMO
                                                            </div>
                                                        )}

                                                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                                                            {prod.image && <img src={prod.image} alt={prod.nom} className="w-full h-full object-contain" />}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] leading-tight font-bold line-clamp-2 text-slate-800 dark:text-slate-200 mb-1" title={prod.nom}>
                                                                {prod.nom}
                                                            </p>
                                                            
                                                            <div className="flex items-baseline gap-2">
                                                                {prod.hasPromo ? (
                                                                    <>
                                                                        <p className="text-sm font-black text-emerald-600">{prod.prix.toFixed(2)}€</p>
                                                                        {prod.promo && (
                                                                            <p className="text-[10px] text-slate-400 line-through decoration-red-500/50">{prod.promo.toFixed(2)}€</p>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <p className="text-sm font-black text-blue-600 dark:text-blue-400">{prod.prix.toFixed(2)}€</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                                                            selectedProducts[match.term] === prod.ean 
                                                            ? 'bg-blue-500 border-blue-500 text-white' 
                                                            : 'border-slate-300 dark:border-slate-600'
                                                        }`}>
                                                            {selectedProducts[match.term] === prod.ean && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {hasMore && (
                                                <div className="text-center">
                                                    <button onClick={() => toggleExpand(match.term)} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 w-full py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                        {isExpanded ? (<>Moins de choix <ChevronUp size={14} /></>) : (<>Voir les {match.matches.length - 3} autres produits <ChevronDown size={14} /></>)}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 text-sm font-bold flex items-center gap-2">
                                            <X size={16} /> Aucun produit trouvé.
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Total estimé</p>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {matches.reduce((acc, m) => {
                                const selected = m.matches.find(p => p.ean === selectedProducts[m.term]);
                                return acc + (selected ? selected.prix * m.qty : 0);
                            }, 0).toFixed(2)} €
                        </p>
                    </div>
                    <button onClick={confirmAddToCart} disabled={loadingMatches} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2">
                        <ShoppingBasket size={20} /> Tout ajouter
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- RESTE (Main Content) --- */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white">Inspiration du jour <span className="text-blue-600">🥘</span></h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
                {currentStoreId ? `Cuisinez malin avec les produits de ${currentStoreName}.` : "Sélectionnez un magasin pour voir les prix réels."}
            </p>
            <div className="relative max-w-md mx-auto group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input type="text" placeholder="Pâtes, Salade, Gâteau..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-blue-900/5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${activeCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg scale-105' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                    {cat}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((recipe, idx) => {
                const hasPromo = promoRecipeIds.includes(recipe.id);
                return (
                    <div key={recipe.id} className="recipe-card group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="relative h-64 overflow-hidden">
                            <img id={isModalOpen && currentRecipeImg === recipe.image ? "modal-img" : ""} src={recipe.image} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"><Clock size={12} /> {recipe.time}</div>
                                {hasPromo && <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1"><Flame size={12} className="fill-current" /> Ingrédients en Promo</div>}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-24">
                                <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{recipe.title}</h3>
                                <div className="flex items-center gap-3 text-white/80 text-xs font-bold">
                                    <span className="flex items-center gap-1"><ChefHat size={12} /> {recipe.difficulty}</span>
                                    <span className="flex items-center gap-1"><Flame size={12} /> {recipe.calories}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex flex-wrap gap-2 mb-6">{recipe.tags.map(tag => (<span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold rounded-md tracking-wider">{tag}</span>))}</div>
                            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-400">{recipe.ingredients.length} ingrédients</div>
                                <button onClick={() => openRecipeModal(recipe)} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group/btn ${hasPromo ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}><ShoppingBasket size={20} className="group-hover/btn:rotate-[-10deg] transition-transform" /></button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </main>
      <Footer />
      <MagicCart />
    </div>
  );
}