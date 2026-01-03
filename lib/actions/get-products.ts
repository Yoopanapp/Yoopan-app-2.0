'use server'

import { prisma } from '@/lib/prisma'

// Type de retour pour ton UI (sécurité de typage)
export type ProductWithPrice = {
  id: string
  nom: string
  image: string | null
  category: string | null
  price: number | null
  promo: number | null
}

interface SearchParams {
  query: string
  storeId?: string // Optionnel: si l'utilisateur a choisi un magasin
  page?: number
}

export async function getProducts({ query, storeId, page = 1 }: SearchParams) {
  const ITEMS_PER_PAGE = 24
  const skip = (page - 1) * ITEMS_PER_PAGE

  try {
    // 1. Recherche des produits
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { nom: { contains: query, mode: 'insensitive' } },
          // On peut ajouter la recherche par EAN si query est un chiffre
          // { id: { equals: query } } 
        ]
      },
      include: {
        category: true,
        // Astuce CTO: On inclut les prix, mais filtrés par magasin si fourni
        prices: {
          where: storeId ? { storeId: storeId } : undefined,
          take: 1, // On ne prend qu'un prix pour l'affichage liste (optimisation)
          orderBy: { valeur: 'asc' } // Si pas de magasin, on affiche le moins cher de France
        }
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
    })

    // 2. Transformation des données pour le Frontend (DTO)
    // On aplatit la structure pour que tes composants UI soient contents
    const formattedProducts: ProductWithPrice[] = products.map((p) => {
      const currentPrice = p.prices[0] // Le prix pertinent (ou le moins cher)

      return {
        id: p.id,
        nom: p.nom,
        image: p.image,
        category: p.category?.nom || 'Inconnu',
        price: currentPrice?.valeur || null,
        promo: currentPrice?.promo || null,
      }
    })

    return { success: true, data: formattedProducts }

  } catch (error) {
    console.error("Erreur Database:", error)
    return { success: false, error: "Impossible de récupérer les produits." }
  }
}