'use client';

import Link from 'next/link';
import { useRef, useState, useMemo } from 'react';
import ProductImage from './ProductImage';
import NutriScore from './NutriScore';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { useFlyToCart } from '../context/FlyToCartContext';
import { useUserLocation } from '../context/UserLocationContext';
import { Heart, Plus, Minus, TrendingDown, AlertCircle, MapPin, BarChart3 } from 'lucide-react';

// Type aligné avec les données envoyées par page.tsx
type ProductType = {
  ean: string;
  nom: string;
  image: string | null;
  categorie: string | null;
  nutriscore: string | null;
  offers: { magasin: string; prix: number; lat?: number; lng?: number; }[];
  savingsPercent: number;
  averagePrice?: number; // <--- On récupère la moyenne
  prix?: number;      
  magasin?: string;
  isNationalPrice?: boolean;
};

export default function ProductCard({ product }: { product: ProductType }) {
  // 1. Hooks (Le Cerveau)
  const { isFavorite, toggleFavorite, diet } = useUser();
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { triggerFly } = useFlyToCart();
  const { calculateDistance } = useUserLocation();
  
  const imageRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 2. État du Panier
  const cartItem = items.find(i => i.ean === product.ean);
  const quantity = cartItem ? cartItem.quantity : 0;

  // 3. Calculs Intelligents
  const isFav = isFavorite(product.ean);
  
  // Vérification Régime
  const isCompatible = useMemo(() => {
    if (!diet || diet === 'aucun') return true;
    const cat = (product.categorie || '').toLowerCase();
    const name = product.nom.toLowerCase();
    
    if (diet === 'vegetarien') {
      return !(cat.includes('viande') || cat.includes('poisson') || name.includes('poulet') || name.includes('boeuf') || name.includes('jambon'));
    }
    if (diet === 'vegan') {
      return !(cat.includes('viande') || cat.includes('lait') || cat.includes('fromage') || cat.includes('miel') || name.includes('oeuf'));
    }
    return true;
  }, [diet, product]);

  // Distance vers le magasin
  const currentOffer = product.offers.find(o => o.magasin === product.magasin) || product.offers[0];
  const distance = (currentOffer?.lat && currentOffer?.lng) 
    ? calculateDistance(currentOffer.lat, currentOffer.lng) 
    : null;

  // 4. LOGIQUE MOYENNE NATIONALE
  const priceDiff = (product.prix && product.averagePrice) 
    ? product.prix - product.averagePrice 
    : 0;
  // On considère que c'est "bon" si c'est moins cher ou égal à la moyenne
  const isCheaperThanAvg = priceDiff <= 0;

  // --- ACTIONS ---

  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10); 
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    vibrate();
    
    addToCart({
      ean: product.ean,
      nom: product.nom,
      image: product.image || '',
      offers: product.offers,
      nutriscore: product.nutriscore,
      categorie: product.categorie
    });

    if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const imgElement = imageRef.current.querySelector('img');
        const src = imgElement ? imgElement.src : (product.image || '');
        triggerFly(src, rect);
    }
  };

  const handleUpdateQty = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    vibrate();

    if (quantity === 1 && delta === -1) {
      removeFromCart(product.ean);
    } else {
      updateQuantity(product.ean, delta);
    }
  };

  return (
    <div 
      className="group relative flex flex-col h-full bg-white dark:bg-slate-800 rounded-[2rem] p-3 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 border border-slate-100 dark:border-slate-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* --- ZONE IMAGE --- */}
      <div ref={imageRef} className="relative aspect-square mb-3 overflow-visible rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center p-4">
            
            <Link href={`/product/${product.ean}`} className="absolute inset-0 z-10" aria-label={`Voir ${product.nom}`} />

            {/* Bouton Favori */}
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.ean); vibrate(); }}
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-700/90 shadow-sm hover:scale-110 transition-transform active:scale-95 backdrop-blur-sm"
            >
              <Heart size={16} className={isFav ? "fill-red-500 text-red-500" : "text-slate-300"} />
            </button>

            {/* Badges (Promo / Incompatible) */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 items-start">
                {product.savingsPercent > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 animate-fade-in">
                    <TrendingDown size={10} /> -{product.savingsPercent}%
                  </span>
                )}
                {!isCompatible && (
                   <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 border border-red-500/50 animate-pulse">
                     <AlertCircle size={10} className="text-red-400" /> {diet}
                   </span>
                )}
            </div>

            {/* L'image */}
            <div className="w-full h-full relative z-0 transition-transform duration-500 group-hover:scale-110 will-change-transform">
                <ProductImage src={product.image || ''} alt={product.nom} />
            </div>
      </div>

      {/* --- ZONE INFOS --- */}
      <div className="px-1 flex-1 flex flex-col">
          
          {/* Header Info */}
          <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest truncate max-w-[70%]">
                 {product.categorie || 'Rayon'}
              </div>
              <NutriScore score={product.nutriscore} />
          </div>
          
          {/* Titre */}
          <Link href={`/product/${product.ean}`} className="block group/link">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-1 line-clamp-2 group-hover/link:text-blue-600 transition-colors">
                {product.nom}
            </h3>
          </Link>

          {/* Spacer */}
          <div className="flex-grow"></div>

          {/* --- PRIX & ACTIONS --- */}
          <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex items-end justify-between">
            
            {/* Bloc Prix */}
            <div className="flex flex-col">
                {product.prix && product.prix > 0 ? (
                    <>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-xl font-black ${product.isNationalPrice ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                {product.prix.toFixed(2)}€
                            </span>
                            {product.isNationalPrice && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 font-medium" title="Prix moyen national (non vérifié dans ce magasin)">
                                    Estimé
                                </span>
                            )}
                        </div>
                        
                        {/* --- NOUVEAU : INDICATEUR MOYENNE --- */}
                        {product.averagePrice && product.averagePrice > 0 && !product.isNationalPrice && (
                            <div className={`text-[9px] font-medium flex items-center gap-1 mb-1 ${isCheaperThanAvg ? 'text-emerald-500' : 'text-red-400'}`}>
                                <BarChart3 size={10} />
                                {isCheaperThanAvg ? 'Sous' : 'Au-dessus'} la moyenne ({product.averagePrice.toFixed(2)}€)
                            </div>
                        )}

                        <div className="flex items-center gap-1 mt-0.5 max-w-[120px]">
                            {distance ? (
                                <span className="text-[9px] font-bold text-blue-500 whitespace-nowrap flex items-center gap-0.5">
                                   <MapPin size={8} /> {distance}
                                </span>
                            ) : null}
                            <span className="text-[10px] text-slate-400 truncate">
                                {product.magasin ? product.magasin.replace('Leclerc ', '') : 'Magasin'}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300 italic">Indisponible</span>
                        <span className="text-[9px] text-slate-300">ici</span>
                    </div>
                )}
            </div>

            {/* Bloc Bouton (Add vs Counter) */}
            <div className="relative z-20">
                {quantity > 0 ? (
                    // MODE COMPTEUR (Si dans le panier)
                    <div className="flex items-center bg-slate-900 dark:bg-blue-600 rounded-full h-9 shadow-lg shadow-blue-900/20 p-1 animate-fade-in select-none">
                        <button 
                            onClick={(e) => handleUpdateQty(-1, e)}
                            className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors active:scale-90"
                        >
                            <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="font-bold text-white text-sm w-5 text-center leading-none">{quantity}</span>
                        <button 
                            onClick={(e) => handleUpdateQty(1, e)}
                            className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors active:scale-90"
                        >
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>
                ) : (
                    // MODE AJOUT (Si pas dans le panier)
                    <button 
                        onClick={handleAdd}
                        disabled={!product.prix}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
                            !product.prix 
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:rotate-90'
                        }`}
                        aria-label="Ajouter au panier"
                    >
                        <Plus size={24} />
                    </button>
                )}
            </div>

          </div>
      </div>
    </div>
  );
}