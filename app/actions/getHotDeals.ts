'use server';

import { prisma } from '@/lib/prisma';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// AJOUT DU PARAMÈTRE "LIMIT" (par défaut 6, mais on peut mettre 100)
export async function getHotDeals(storeId: string, limit: number = 6) {
  if (!storeId) return [];

  const cleanStoreId = storeId.length === 4 ? `0${storeId}` : storeId;

  const mainStore = await prisma.store.findFirst({
    where: { OR: [{ id: cleanStoreId }, { noPL: cleanStoreId }] },
    select: { id: true, lat: true, lng: true, nom: true }
  });

  if (!mainStore || !mainStore.lat || !mainStore.lng) return [];

  const allStores = await prisma.store.findMany({
    where: { lat: { not: null }, lng: { not: null }, id: { not: mainStore.id } },
    select: { id: true, lat: true, lng: true, nom: true }
  });

  const neighbors = allStores
    .map(s => ({ ...s, dist: getDistanceFromLatLonInKm(mainStore.lat!, mainStore.lng!, s.lat!, s.lng!) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);
  
  const neighborIds = neighbors.map(n => n.id);
  const allTargetIds = [mainStore.id, ...neighborIds];

  // ON ANALYSE PLUS DE PRODUITS (500 au lieu de 100) pour trouver plus de promos
  const products = await prisma.product.findMany({
    where: {
      prices: { some: { storeId: mainStore.id } }
    },
    include: {
      prices: {
        where: { storeId: { in: allTargetIds } },
        include: { store: { select: { nom: true } } }
      }
    },
    take: 500 
  });

  const deals = products.map(product => {
    const myPriceObj = product.prices.find(p => p.storeId === mainStore.id);
    if (!myPriceObj) return null;

    const myPrice = myPriceObj.valeur;
    const neighborPrices = product.prices.filter(p => p.storeId !== mainStore.id);
    if (neighborPrices.length === 0) return null;

    const worstNeighbor = neighborPrices.sort((a, b) => b.valeur - a.valeur)[0];
    
    if (myPrice < worstNeighbor.valeur) {
      const diff = worstNeighbor.valeur - myPrice;
      const percent = Math.round((diff / worstNeighbor.valeur) * 100);

      if (percent < 5) return null; // On garde tout ce qui est > 5%

      return {
        ean: product.id,
        nom: product.nom,
        image: product.image,
        myPrice: myPrice,
        neighborPrice: worstNeighbor.valeur,
        neighborName: worstNeighbor.store?.nom || "Concurrent",
        percent: percent,
        savings: diff.toFixed(2)
      };
    }
    return null;
  })
  .filter(Boolean)
  .sort((a: any, b: any) => b.percent - a.percent);

  // SI LIMIT EST 0 ou -1, ON RENVOIE TOUT, SINON ON COUPE
  return limit > 0 ? deals.slice(0, limit) : deals;
}