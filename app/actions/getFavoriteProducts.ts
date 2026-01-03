// app/actions/getFavoriteProducts.ts
'use server';

import { prisma } from '@/lib/prisma';

// --- UTILITAIRES (Copiés de la page d'accueil) ---
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function getFavoriteProducts(eans: string[], storeId?: string | null) {
  if (!eans || eans.length === 0) return [];

  // 1. Logique de Localisation (Idem Accueil)
  let targetStoreIds: string[] = [];
  let selectedStoreData: { id: string, lat: number | null, lng: number | null, nom: string } | null = null;

  if (storeId) {
    // Normalisation de l'ID (gestion des 0 manquants)
    const possibleIds = [storeId];
    if (storeId.length === 5) possibleIds.push(`0${storeId}`);

    const store = await prisma.store.findFirst({
      where: {
        OR: [
          { id: { in: possibleIds } },
          { noPL: { in: possibleIds } },
          { noPR: { in: possibleIds } } 
        ]
      },
      select: { id: true, lat: true, lng: true, nom: true }
    });

    if (store) {
        selectedStoreData = store;
        // Si le magasin a des coordonnées, on cherche les voisins
        if (store.lat && store.lng) {
            const allStores = await prisma.store.findMany({
                where: { lat: { not: null }, lng: { not: null } },
                select: { id: true, lat: true, lng: true }
            });
            targetStoreIds = allStores
                .map(s => ({
                    id: s.id,
                    dist: getDistanceFromLatLonInKm(store.lat!, store.lng!, s.lat!, s.lng!)
                }))
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 4) // Le magasin + 3 voisins
                .map(s => s.id);
        } else {
            targetStoreIds = [store.id];
        }
    }
  }

  // 2. Récupération des produits avec filtre sur les prix
  const products = await prisma.product.findMany({
    where: {
      id: { in: eans }
    },
    include: {
      category: true,
      prices: {
        // Si on a une zone ciblée, on ne prend que les prix de cette zone
        where: targetStoreIds.length > 0 ? { storeId: { in: targetStoreIds } } : undefined,
        include: { store: true },
        orderBy: { valeur: 'asc' }
      }
    }
  });

  // 3. Formatage pour le Frontend
  return products.map(product => {
    const allPrices = product.prices || [];
    
    // Moyenne Nationale (pour l'indicateur)
    // Note: Idéalement il faudrait une autre requête pour la vraie moyenne nationale, 
    // ici on fait avec ce qu'on a récupéré ou on met 0 si pas assez de données.
    const averagePrice = 0; // On désactive temporairement si on filtre trop, ou on garde la logique si pas de filtre.

    const hasOffers = allPrices.length > 0;
    const bestPrice = hasOffers ? allPrices[0].valeur : 0;
    const worstPrice = hasOffers ? allPrices[allPrices.length - 1].valeur : 0;
    
    // Construction des offres avec distances
    const offers = allPrices.map(p => {
        let dist = 0;
        if (selectedStoreData && selectedStoreData.lat && selectedStoreData.lng && p.store?.lat && p.store?.lng) {
            dist = getDistanceFromLatLonInKm(selectedStoreData.lat, selectedStoreData.lng, p.store.lat, p.store.lng);
        }
        
        return {
            magasin: p.store ? p.store.nom : "Magasin Inconnu",
            prix: p.valeur,
            lat: p.store?.lat || undefined,
            lng: p.store?.lng || undefined,
            distance: dist,
            // Pour savoir si c'est "Mon Magasin"
            isMyStore: selectedStoreData ? (p.storeId === selectedStoreData.id) : false
        };
    });

    // Détermination du nom à afficher sur la carte
    let displayStoreName = 'Indisponible';
    if (hasOffers) {
        if (selectedStoreData && allPrices[0].storeId === selectedStoreData.id) {
            displayStoreName = allPrices[0].store?.nom || 'Mon Magasin';
        } else {
            displayStoreName = allPrices[0].store?.nom || 'Voisin';
        }
    }

    return {
      ean: product.id,
      nom: product.nom,
      image: product.image,
      categorie: product.category?.nom || 'Divers',
      nutriscore: 'E',
      offers: offers,
      savingsPercent: hasOffers && worstPrice > 0 ? Math.round(((worstPrice - bestPrice) / worstPrice) * 100) : 0,
      prix: bestPrice,
      averagePrice: averagePrice,
      magasin: displayStoreName,
      isNationalPrice: false
    };
  });
}