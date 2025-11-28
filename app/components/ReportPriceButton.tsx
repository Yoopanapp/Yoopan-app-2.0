// app/components/ReportPriceButton.tsx
'use client';

import { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function ReportPriceButton({ store, currentPrice }: { store: string, currentPrice: number }) {
  const { addXp } = useUser();

  const handleReport = () => {
    const newPrice = prompt(`Nouveau prix constaté chez ${store} (actuel: ${currentPrice}€) :`);
    if (newPrice) {
      // Simulation
      addXp(50); 
      alert("Merci ! Signalement pris en compte. Vous gagnez +50 XP ! 🎉");
    }
  };

  return (
    <button 
      onClick={handleReport}
      className="text-[10px] text-slate-400 underline hover:text-blue-500 mt-1 block ml-auto"
    >
      Signaler erreur ?
    </button>
  );
}