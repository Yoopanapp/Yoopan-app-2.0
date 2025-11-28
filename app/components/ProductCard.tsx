'use client';

import Link from 'next/link';
import { useRef } from 'react';
import ProductImage from './ProductImage';
import AddToCartButton from './AddToCartButton';
import NutriScore from './NutriScore';
import { useUser } from '../context/UserContext';
// 1. IMPORT DU CONTEXTE GPS
import { useUserLocation } from '../context/UserLocationContext';

type ProductType = {
  ean: string;
  nom: string;
  image: string | null;
  categorie: string | null;
  nutriscore: string | null;
  offers: { magasin: string; prix: number; lat?: number; lng?: number; }[];
  savingsPercent: number;
  prix?: number;      
  magasin?: string;   
};

export default function ProductCard({ product }: { product: ProductType }) {
  const { isFavorite, toggleFavorite, diet } = useUser();
  // 2. ON RÉCUPÈRE LA FONCTION DE CALCUL CENTRALISÉE
  const { calculateDistance } = useUserLocation();
  
  const fav = isFavorite(product.ean);
  const imageRef = useRef<HTMLDivElement>(null);

  // Détection régime
  const isCompatible = () => {
    if (!diet || diet === 'aucun') return true;
    const cat = (product.categorie || '').toLowerCase();
    const name = product.nom.toLowerCase();
    if (diet === 'vegetarien') {
      if (cat.includes('viande') || cat.includes('charcuterie') || cat.includes('poisson')) return false;
      if (name.includes('poulet') || name.includes('boeuf') || name.includes('jambon') || name.includes('dinde')) return false;
    }
    if (diet === 'vegan') {
      if (cat.includes('viande') || cat.includes('lait') || cat.includes('fromage') || cat.includes('oeuf') || cat.includes('miel')) return false;
    }
    return true;
  };
  const compatible = isCompatible();

  // Gestion robuste des offres
  const offersToDisplay = product.offers || [];
  if (offersToDisplay.length === 0 && product.prix) {
      offersToDisplay.push({ magasin: product.magasin || 'Magasin', prix: product.prix });
  }

  return (
    <div className="relative group flex flex-col h-full">
      
      {/* ZONE IMAGE */}
      <div ref={imageRef} className="relative aspect-square rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 mb-3 overflow-visible">
            <Link href={`/product/${product.ean}`} className="absolute inset-0 z-10 rounded-[2rem]" aria-label={`Voir ${product.nom}`} />

            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.ean); }}
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-700/90 shadow-sm hover:scale-110 transition-transform cursor-pointer"
            >
              <span className={fav ? 'grayscale-0' : 'grayscale opacity-40'}>{fav ? '❤️' : '🤍'}</span>
            </button>

            <div className="absolute bottom-3 right-3 z-20">
              <AddToCartButton product={product} imgRef={imageRef} />
            </div>

            {product.savingsPercent > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm pointer-events-none">
                -{product.savingsPercent}%
              </span>
            )}

            {!compatible && (
               <div className="absolute inset-0 z-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center backdrop-blur-[1px] rounded-[2rem] pointer-events-none">
                 <div className="text-center border-2 border-red-500 px-2 py-1 rounded-lg transform -rotate-12 bg-white dark:bg-slate-900 shadow-lg">
                     <p className="font-bold text-red-600 text-[10px] uppercase">Incompatible {diet}</p>
                 </div>
               </div>
            )}

            <div className="w-full h-full p-6 flex items-center justify-center pointer-events-none">
                <ProductImage src={product.image || ''} alt={product.nom} />
            </div>
      </div>

      {/* ZONE INFOS */}
      <div className="px-2 relative flex-1 flex flex-col">
          <Link href={`/product/${product.ean}`} className="absolute inset-0 z-10" />
          
          <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[70%]">
                 {product.categorie || 'Rayon'}
              </div>
              <NutriScore score={product.nutriscore} />
          </div>
          
          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.nom}
          </h3>
          
          {/* Prix & Distance */}
          <div className="space-y-1 mt-auto">
            {offersToDisplay.slice(0, 2).map((offer, index) => {
              const isBest = index === 0;
              
              // 3. UTILISATION DE LA FONCTION DU CONTEXTE
              const distance = (offer.lat && offer.lng) 
                ? calculateDistance(offer.lat, offer.lng) 
                : null;

              return (
                <div key={`${offer.magasin}-${index}`} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 overflow-hidden max-w-[75%]">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isBest ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    
                    <div className="flex flex-col leading-none">
                        <span className={`truncate ${isBest ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                            {offer.magasin.replace(' Vigneux-sur-Seine', '')}
                        </span>
                        {distance && (
                            <span className="text-[9px] text-slate-400 font-normal">
                                📍 {distance}
                            </span>
                        )}
                    </div>
                  </div>
                  <span className={`font-bold ${isBest ? 'text-emerald-600' : 'text-slate-400'}`}>{offer.prix.toFixed(2)} €</span>
                </div>
              );
            })}
          </div>
      </div>
    </div>
  );
}