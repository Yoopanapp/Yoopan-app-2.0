'use client';

import { useState } from 'react';

// Icône SVG Panier (Fallback)
const ShoppingCartIcon = ({ size = 24, strokeWidth = 1.5, className }: { size?: number, strokeWidth?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

export default function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  // Si pas d'URL ou erreur de chargement -> Afficher Panier Gris
  if (!src || error) {
    return (
      <div className="w-full h-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-300 dark:text-slate-600 rounded-xl">
        <ShoppingCartIcon size={48} strokeWidth={1.5} />
      </div>
    );
  }

  // Utilisation de la balise <img> standard pour éviter les problèmes de config Next.js
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain p-4 transition-transform duration-300 hover:scale-110"
        onError={() => setError(true)}
      />
    </div>
  );
}