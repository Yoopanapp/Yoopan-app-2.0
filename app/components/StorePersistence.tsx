'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function StorePersistence() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const urlStoreId = searchParams.get('storeId');

  useEffect(() => {
    // CAS 1 : UTILISATEUR CONNECTÉ
    if (session) {
      if (urlStoreId) {
        // Si on est connecté et qu'il y a un magasin dans l'URL :
        // ON SAUVEGARDE (Cookie persistant 1 an)
        // Cela permet de retrouver le magasin même si on ferme le navigateur
        document.cookie = `leclerc_store=${urlStoreId}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } 
    
    // CAS 2 : INVITÉ (Pas de session)
    else {
      // Si on n'est PAS connecté :
      // ON NETTOIE TOUT ! On veut que ça fasse "comme la première fois"
      // Si l'utilisateur quitte la page ou revient plus tard sans lien précis, il n'aura plus de magasin.
      
      // On supprime le cookie en le mettant dans le passé
      document.cookie = "leclerc_store=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

  }, [session, urlStoreId]);

  return null; // Ce composant est invisible, il bosse en fond
}