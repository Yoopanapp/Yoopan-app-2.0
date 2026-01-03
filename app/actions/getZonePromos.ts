'use server';

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache'; // <--- L'ARMÉE SECRÈTE POUR LA VITESSE

// Helper distance (reste inchangé)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 1. LA LOGIQUE LOURDE (On l'isole dans une fonction)
async function getZonePromosLogic(storeId: string) {
  if (!storeId) return [];

  const cleanStoreId = storeId.length === 4 ? `0${storeId}` : storeId;

  // Récupérer le magasin central
  const centerStore = await prisma.store.findFirst({
    where: { OR: [{ id: cleanStoreId }, { noPL: cleanStoreId }] },
    select: { id: true, lat: true, lng: true }
  });

  if (!centerStore || !centerStore.lat || !centerStore.lng) return [];

  // Trouver les 5 magasins de la zone
  const allStores = await prisma.store.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    select: { id: true, lat: true, lng: true, nom: true }
  });

  const zoneStores = allStores
    .map(s => ({ ...s, dist: getDistanceFromLatLonInKm(centerStore.lat!, centerStore.lng!, s.lat!, s.lng!) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);
  
  const zoneStoreIds = zoneStores.map(s => s.id);

  // Récupérer les produits
  const products = await prisma.product.findMany({
    where: {
      prices: { some: { storeId: { in: zoneStoreIds } } }
    },
    select: {
        id: true,
        nom: true,
        image: true,
        category: { select: { nom: true } },
        prices: {
            where: { storeId: { in: zoneStoreIds } },
            select: {
                valeur: true,
                promo: true,
                updatedAt: true,
                storeId: true,
                store: { select: { nom: true } }
            }
        }
    }
  });

  // Calculer les promos
  const promos = products.map(product => {
    if (!product.prices || product.prices.length === 0) return null;

    const sortedPrices = product.prices.sort((a, b) => a.valeur - b.valeur);
    const bestPrice = sortedPrices[0];
    const worstPrice = sortedPrices[sortedPrices.length - 1];

    let finalOldPrice = 0;
    let finalPrice = bestPrice.valeur;

    if (bestPrice.promo && bestPrice.promo > bestPrice.valeur) {
        finalOldPrice = bestPrice.promo;
    } 
    else if (sortedPrices.length > 1 && worstPrice.valeur > bestPrice.valeur) {
        finalOldPrice = worstPrice.valeur;
    }
    else {
        return null;
    }

    const diff = finalOldPrice - finalPrice;
    const percent = Math.round((diff / finalOldPrice) * 100);

    if (percent < 10) return null;

    const winningStoreDist = zoneStores.find(s => s.id === bestPrice.storeId)?.dist || 0;

    return {
      ean: product.id,
      nom: product.nom,
      image: product.image,
      category: product.category?.nom || "Autres",
      price: finalPrice,
      oldPrice: finalOldPrice,
      updatedAt: bestPrice.updatedAt,
      storeName: bestPrice.store?.nom || "Magasin",
      storeDist: winningStoreDist,
      percent: percent,
    };
  })
  .filter(Boolean)
  .sort((a: any, b: any) => b.percent - a.percent);

  return promos;
}

// 2. LA VERSION CACHÉE (Celle qu'on exporte vraiment)
// Next.js va exécuter la logique UNE fois, puis s'en souvenir pendant 1 heure (3600s).
export const getZonePromos = unstable_cache(
  async (storeId: string) => getZonePromosLogic(storeId),
  ['zone-promos-data'], // Clé unique pour le cache
  { revalidate: 3600, tags: ['promos'] } 
);