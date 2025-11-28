// app/components/NutriScore.tsx
export default function NutriScore({ score }: { score?: string | null }) {
  if (!score) return null;

  const s = score.toLowerCase();
  
  // Couleurs officielles du Nutri-Score
  let colorClass = 'bg-slate-200 text-slate-500';
  if (s === 'a') colorClass = 'bg-[#038141] text-white border-[#038141]'; // Vert foncé
  if (s === 'b') colorClass = 'bg-[#85BB2F] text-white border-[#85BB2F]'; // Vert clair
  if (s === 'c') colorClass = 'bg-[#FECB02] text-slate-900 border-[#FECB02]'; // Jaune
  if (s === 'd') colorClass = 'bg-[#EE8100] text-white border-[#EE8100]'; // Orange
  if (s === 'e') colorClass = 'bg-[#E63E11] text-white border-[#E63E11]'; // Rouge

  return (
    <div 
      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-black uppercase shadow-sm border ${colorClass}`} 
      title={`Nutri-Score ${s.toUpperCase()}`}
    >
      {s}
    </div>
  );
}