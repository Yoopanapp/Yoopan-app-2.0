// app/components/BarcodeScanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function BarcodeScanner({ onClose }: { onClose: () => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialisation du scanner
    // "reader" est l'ID de la div où la caméra va s'afficher
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, // Images par seconde
        qrbox: { width: 250, height: 150 }, // Zone de scan rectangulaire (pour codes barres)
        aspectRatio: 1.0
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // SUCCÈS : On a trouvé un code !
        console.log("Code trouvé : ", decodedText);
        scanner.clear(); // On arrête la caméra
        onClose(); // On ferme le popup
        // On redirige vers la page produit
        router.push(`/product/${decodedText}`);
      },
      (errorMessage) => {
        // Erreur de scan (c'est normal tant qu'on ne présente rien)
        // console.log(errorMessage); 
      }
    );

    return () => {
      try {
        scanner.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [router, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-md relative">
        
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full font-bold"
        >
          ✕
        </button>

        <h2 className="text-center font-bold text-slate-800 mb-4">Scannez un code-barres</h2>
        
        {/* C'est ici que la caméra s'affiche */}
        <div id="reader" className="overflow-hidden rounded-xl bg-slate-100 min-h-[300px]"></div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Placez le code-barres (EAN) dans le cadre.
        </p>
      </div>
    </div>
  );
}