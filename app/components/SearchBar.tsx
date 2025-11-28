'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, ScanLine, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// On charge le scanner dynamiquement pour éviter les erreurs "window not defined" côté serveur
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false });

export default function SearchBar() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  
  const [term, setTerm] = useState(searchParams.get('q') || '');
  const [showScanner, setShowScanner] = useState(false);

  // --- LOGIQUE DE RECHERCHE (Debounce) ---
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';
      
      if (term !== currentQ) {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
          params.set('q', term);
        } else {
          params.delete('q');
        }
        replace(`/?${params.toString()}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [term, replace, searchParams]);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto relative group z-20">
        {/* Effet de lueur (Glow) */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative flex items-center bg-white dark:bg-slate-800 ring-1 ring-gray-900/5 rounded-full shadow-xl">
          
          {/* Icône Loupe */}
          <div className="pl-6 text-gray-400">
            {term ? (
              <span className="animate-pulse text-blue-600">⚡</span>
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          {/* Champ Input */}
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Rechercher un produit (Nutella, Pâtes...)"
            className="w-full bg-transparent px-4 py-4 text-gray-800 dark:text-white placeholder:text-gray-400 font-medium rounded-full focus:outline-none text-base"
          />

          {/* Boutons à droite */}
          <div className="flex items-center pr-3 gap-2">
            
            {/* Bouton Effacer (si texte) */}
            {term && (
              <button 
                onClick={() => { 
                    setTerm(''); 
                    const params = new URLSearchParams(searchParams.toString()); 
                    params.delete('q'); 
                    replace(`/?${params.toString()}`, { scroll: false }); 
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* BOUTON SCANNER (Déclencheur) */}
            <button 
                onClick={() => setShowScanner(true)} 
                className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 hover:text-blue-600 rounded-full transition-colors flex items-center justify-center"
                title="Scanner un code-barres"
            >
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALE DU SCANNER --- */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md relative">
                {/* Bouton Fermer la modale (au cas où) */}
                <button 
                    onClick={() => setShowScanner(false)}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full z-[110]"
                >
                    <X className="w-8 h-8" />
                </button>

                {/* Le Composant Scanner */}
                <BarcodeScanner onClose={() => setShowScanner(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}