'use client';

import { useFlyToCart } from '../context/FlyToCartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function FlyingOverlay() {
  const { flyingItems, removeFlyingItem, cartRef } = useFlyToCart();
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  // Calcul de la position du panier (Cible)
  useEffect(() => {
    const updatePos = () => {
      if (cartRef.current) {
        const rect = cartRef.current.getBoundingClientRect();
        // On vise le centre du panier
        setTargetPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      } else {
        // Fallback : coin haut droit si panier introuvable
        setTargetPos({ x: window.innerWidth - 50, y: 50 });
      }
    };

    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos); // Important si on scroll
    
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos);
    };
  }, [cartRef, flyingItems]); // Recalcul quand un objet vole

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {flyingItems.map((item) => (
          <motion.img
            key={item.id}
            src={item.src}
            initial={{
              position: 'fixed',
              left: item.startRect.left,
              top: item.startRect.top,
              width: item.startRect.width,
              height: item.startRect.height,
              opacity: 1,
              borderRadius: '1rem',
              zIndex: 9999,
            }}
            animate={{
              left: targetPos.x,
              top: targetPos.y,
              width: 20, // L'image devient toute petite
              height: 20,
              opacity: 0.5,
              scale: 0.2,
            }}
            // Animation fluide et naturelle
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            onAnimationComplete={() => removeFlyingItem(item.id)}
            className="object-cover shadow-2xl border-2 border-white"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}