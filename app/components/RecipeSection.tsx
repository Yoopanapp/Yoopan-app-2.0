// app/components/RecipeSection.tsx
'use client';

import { useCart } from '../context/CartContext';
import { useState } from 'react';
import Link from 'next/link';

// On reprend tes recettes (ou on importe RECIPES_DATA si tu l'as fait)
const TOP_RECIPES = [
  {
    id: 'pasta-bolo',
    title: 'Spaghetti Bolo',
    subtitle: 'Le classique express',
    emoji: '🍝',
    ingredients: ['pâtes', 'sauce', 'viande', 'fromage'],
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-100 dark:border-orange-800',
    btn: 'bg-orange-500 hover:bg-orange-600'
  },
  {
    id: 'ptit-dej',
    title: 'Réveil Matin',
    subtitle: 'Pour bien démarrer',
    emoji: '☕',
    ingredients: ['café', 'lait', 'jus', 'biscuit'],
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-800',
    btn: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'apero',
    title: 'Apéro Time',
    subtitle: 'Entre amis',
    emoji: '🥜',
    ingredients: ['chips', 'saucisson', 'bière', 'cacahuète'],
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-100 dark:border-emerald-800',
    btn: 'bg-emerald-500 hover:bg-emerald-600'
  }
];

export default function RecipeSection({ allProducts }: { allProducts: any[] }) {
  const { addToCart } = useCart();
  const [addedRecipe, setAddedRecipe] = useState<string | null>(null);

  const handleAddRecipe = (recipe: typeof TOP_RECIPES[0]) => {
    let count = 0;
    recipe.ingredients.forEach(keyword => {
      const match = allProducts.find(p => 
        p.nom.toLowerCase().includes(keyword) && p.image && p.image.length > 0
      );
      if (match) {
        addToCart({
          ean: match.ean, nom: match.nom, image: match.image, offers: match.offers || [], nutriscore: match.nutriscore, categorie: match.categorie
        });
        count++;
      }
    });

    if (count > 0) {
      setAddedRecipe(recipe.id);
      setTimeout(() => setAddedRecipe(null), 2000);
    } else {
      alert("Ingrédients introuvables.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 mb-16">
      {/* EN-TÊTE DE SECTION AVEC LE LIEN */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex items-center gap-3">
            <span className="text-2xl">👨‍🍳</span>
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Inspiration du jour</h2>
                <p className="text-xs text-slate-400">3 idées pour cuisiner ce soir</p>
            </div>
        </div>
        
        {/* LE fameux bouton vers la page dédiée */}
        <Link href="/recipes" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
            Voir les 50 recettes →
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TOP_RECIPES.map((recipe) => (
          <div key={recipe.id} className={`relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${recipe.bg} ${recipe.border}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{recipe.title}</h3>
                    <p className="text-slate-500 text-sm">{recipe.subtitle}</p>
                </div>
                <div className="text-4xl">{recipe.emoji}</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {recipe.ingredients.map(ing => (
                    <span key={ing} className="text-[10px] uppercase font-bold px-2 py-1 bg-white/60 dark:bg-black/20 text-slate-600 dark:text-slate-300 rounded-md border border-white/50 dark:border-white/10">
                        {ing}
                    </span>
                ))}
            </div>

            <button 
                onClick={() => handleAddRecipe(recipe)}
                className={`w-full py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${recipe.btn}`}
            >
                {addedRecipe === recipe.id ? '✅ Ajouté !' : 'Ajouter au panier +'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}