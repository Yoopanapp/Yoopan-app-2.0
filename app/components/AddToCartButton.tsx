'use client';

import { useCart } from '../context/CartContext';
import { useFlyToCart } from '../context/FlyToCartContext';
import { motion } from 'framer-motion';
import React from 'react';

// Icône Plus SVG inline pour éviter les dépendances externes comme Lucide
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5v14"/>
  </svg>
);

// On ajoute 'imgRef' (optionnel) dans les props attendues
export default function AddToCartButton({ 
  product, 
  imgRef 
}: { 
  product: any, 
  imgRef?: React.RefObject<HTMLDivElement | null> 
}) {
  const { addToCart } = useCart();
  const { triggerFly } = useFlyToCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Logique métier : Ajout au panier
    // On gère le cas où 'product' a des offres ou un prix direct
    const priceToUse = product.offers && product.offers.length > 0 ? product.offers[0].prix : product.prix;
    const storeToUse = product.offers && product.offers.length > 0 ? product.offers[0].magasin : product.magasin;

    addToCart({
        ...product,
        prix: priceToUse,
        magasin: storeToUse
    });

    // 2. Logique visuelle : Lancer l'image !
    // Si on a reçu une référence à l'image (imgRef), on déclenche l'animation
    if (imgRef && imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect();
        triggerFly(product.image || '/placeholder.png', rect);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.8 }} // L'effet "Rebond"
      onClick={handleAdd}
      className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-30"
      aria-label="Ajouter au panier"
    >
      <PlusIcon />
    </motion.button>
  );
}