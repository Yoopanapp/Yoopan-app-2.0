// app/context/CartContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 1. MISE À JOUR DU TYPE
export type CartItem = {
  ean: string;
  nom: string;
  image: string;
  offers: { magasin: string; prix: number }[];
  quantity: number;
  nutriscore: string | null;
  categorie: string | null; // <--- NOUVEAU CHAMP CRITIQUE
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (ean: string) => void;
  updateQuantity: (ean: string, delta: number) => void;
  isInCart: (ean: string) => boolean;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('yoopan_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Nettoyage et validation des données existantes
        const cleanItems = parsed.map((item: any) => ({
          ...item,
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          offers: item.offers || [],
          nutriscore: item.nutriscore || null,
          categorie: item.categorie || 'Divers' // Valeur par défaut si absente
        })).filter((i: any) => i.ean && i.nom);

        setItems(cleanItems);
      } catch (e) {
        console.error("Panier corrompu", e);
        localStorage.removeItem('yoopan_cart');
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('yoopan_cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.ean === product.ean);
      if (existing) {
        return prev.map((p) =>
          p.ean === product.ean ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (ean: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.ean === ean) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (ean: string) => {
    setItems((prev) => prev.filter((item) => item.ean !== ean));
  };

  const clearCart = () => setItems([]);

  const isInCart = (ean: string) => items.some((item) => item.ean === ean);

  if (!isInitialized) return null;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, isInCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}