// app/components/RecipeCard.tsx
'use client';

import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function RecipeCard({ recipe, allProducts }: { recipe: any, allProducts: any[] }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    let count = 0;
    recipe.ingredients.forEach((keyword: string) => {
      const match = allProducts.find(p => 
        p.nom.toLowerCase().includes(keyword) && p.image
      );
      if (match) {
        addToCart({
          ean: match.ean, nom: match.nom, image: match.image, offers: match.offers || [], nutriscore: match.nutriscore, categorie: match.categorie
        });
        count++;
      }
    });

    if (count > 0) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      alert("Ingrédients introuvables dans le stock actuel.");
    }
  };

  return (
    <div className="group relative h-80 rounded-[2rem] overflow-hidden shadow-lg cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      {/* Image */}
      <div className="absolute inset-0">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
      </div>

      {/* Contenu */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col h-full justify-end">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-2xl font-bold leading-tight">{recipe.title}</h3>
            </div>
            <p className="text-slate-300 text-sm mb-4">{recipe.subtitle}</p>
            
            {/* Badges Info */}
            <div className="flex gap-3 mb-4 text-xs font-bold">
                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">⏱️ {recipe.time}</span>
                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">💪 {recipe.difficulty}</span>
            </div>

            {/* Ingrédients (Visible au survol ou tout le temps) */}
            <div className="flex flex-wrap gap-1 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-0 group-hover:h-auto">
                {recipe.ingredients.map((ing: string) => (
                    <span key={ing} className="text-[10px] uppercase font-bold px-2 py-1 bg-white/20 rounded-md border border-white/30">{ing}</span>
                ))}
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                    added ? 'bg-green-500 text-white' : `bg-gradient-to-r ${recipe.color} hover:brightness-110`
                }`}
            >
                {added ? '✅ Tout est dans le panier !' : `Ajouter les ${recipe.ingredients.length} ingrédients`}
            </button>
        </div>
      </div>
    </div>
  );
}