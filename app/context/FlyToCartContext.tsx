'use client';

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

type FlyingItem = {
  id: number;
  src: string;
  startRect: DOMRect;
};

type FlyToCartContextType = {
  triggerFly: (src: string, startRect: DOMRect) => void;
  flyingItems: FlyingItem[];
  removeFlyingItem: (id: number) => void;
  cartRef: React.RefObject<HTMLDivElement | null>;
};

const FlyToCartContext = createContext<FlyToCartContextType | undefined>(undefined);

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  // Cette référence servira à localiser le panier sur l'écran
  const cartRef = useRef<HTMLDivElement>(null);

  const triggerFly = (src: string, startRect: DOMRect) => {
    const newItem = { id: Date.now(), src, startRect };
    setFlyingItems((prev) => [...prev, newItem]);
  };

  const removeFlyingItem = (id: number) => {
    setFlyingItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <FlyToCartContext.Provider value={{ triggerFly, flyingItems, removeFlyingItem, cartRef }}>
      {children}
    </FlyToCartContext.Provider>
  );
}

export const useFlyToCart = () => {
  const context = useContext(FlyToCartContext);
  if (!context) throw new Error('useFlyToCart must be used within a FlyToCartProvider');
  return context;
};