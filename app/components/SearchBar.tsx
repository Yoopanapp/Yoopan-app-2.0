// app/components/SearchBar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false });

export default function SearchBar() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  
  const [term, setTerm] = useState(searchParams.get('q') || '');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    // On ne lance le timer que si le terme a changé
    const timeoutId = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';
      
      // CORRECTION ANTI-BOUCLE :
      // On ne met à jour l'URL que si la valeur locale (term) est différente de l'URL (currentQ)
      if (term !== currentQ) {
        const params = new URLSearchParams(searchParams.toString()); // Clone propre
        if (term) {
          params.set('q', term);
        } else {
          params.delete('q');
        }
        replace(`/?${params.toString()}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [term, replace, searchParams]); // searchParams est nécessaire, mais la condition if() protège la boucle

  return (
    <>
      <div className="w-full max-w-2xl mx-auto relative group z-20">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative flex items-center bg-white ring-1 ring-gray-900/5 rounded-full shadow-xl">
          <div className="pl-6 text-gray-400">
            {term ? <span className="animate-pulse text-blue-600">⚡</span> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 5.196 5.196Z" /></svg>}
          </div>

          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full bg-transparent px-4 py-4 text-gray-800 placeholder:text-gray-400 font-medium rounded-full focus:outline-none"
            style={{ fontSize: '16px' }} 
          />

          <div className="flex items-center pr-2 gap-2">
            {term && (
              <button 
                onClick={() => { setTerm(''); const params = new URLSearchParams(searchParams.toString()); params.delete('q'); replace(`/?${params.toString()}`, { scroll: false }); }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >✕</button>
            )}
            <button onClick={() => setShowScanner(true)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" /></svg>
            </button>
          </div>
        </div>
      </div>
      {showScanner && <BarcodeScanner onClose={() => setShowScanner(false)} />}
    </>
  );
}