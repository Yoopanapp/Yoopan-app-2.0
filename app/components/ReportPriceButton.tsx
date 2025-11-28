'use client';

import { useUser } from '../context/UserContext';
import { AlertTriangle, PlusCircle } from 'lucide-react';

interface ReportPriceButtonProps {
  store: string;
  currentPrice: number;
  label?: string; // Optionnel : Si présent, le bouton change de look
}

export default function ReportPriceButton({ store, currentPrice, label }: ReportPriceButtonProps) {
  const { addXp } = useUser();

  const handleReport = () => {
    // Message différent selon le contexte
    const promptMessage = label 
        ? `Entrez le prix constaté chez ${store} :` 
        : `Nouveau prix constaté chez ${store} (actuel: ${currentPrice}€) :`;

    const newPrice = prompt(promptMessage);
    
    if (newPrice) {
      // Simulation d'envoi API
      addXp(50); 
      alert(`Merci ! ${label ? "Prix ajouté" : "Signalement pris en compte"}. Vous gagnez +50 XP ! 🎉`);
    }
  };

  // CAS 1 : Bouton "Ajouter un prix" (Gros bouton bleu)
  if (label) {
    return (
      <button 
        onClick={handleReport}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 mx-auto"
      >
        <PlusCircle className="w-5 h-5" />
        {label}
      </button>
    );
  }

  // CAS 2 : Lien "Signaler erreur" (Ton code original, discret)
  return (
    <button 
      onClick={handleReport}
      className="text-[10px] text-slate-400 underline hover:text-red-500 mt-1 flex items-center gap-1 ml-auto transition-colors"
    >
      <AlertTriangle className="w-3 h-3" />
      Signaler erreur ?
    </button>
  );
}