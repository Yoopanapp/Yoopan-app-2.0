import { Skeleton } from "./Skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col p-4 h-[380px] rounded-xl border transition-colors
      /* MODE JOUR : Fond blanc, bordure gris clair */
      bg-white border-gray-200
      /* MODE NUIT : Fond bleu nuit, bordure ardoise */
      dark:bg-[#0F172A] dark:border-slate-800"
    >
      {/* Zone Image */}
      <div className="w-full h-40 mb-4 flex justify-center items-center rounded-lg p-4
        bg-gray-50 dark:bg-slate-900/50">
        <Skeleton className="h-full w-2/3" />
      </div>

      {/* Zone Informations */}
      <div className="space-y-3 flex-1">
        {/* Badges */}
        <div className="flex gap-2">
           <Skeleton className="h-5 w-8 rounded-sm" />
           <Skeleton className="h-5 w-16 rounded-sm" />
        </div>

        {/* Titre */}
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-3/4" />
        
        {/* Prix et Magasin */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end border-t pt-3 mt-4
          border-gray-100 dark:border-slate-800">
          <div className="flex flex-col gap-1">
             <Skeleton className="h-3 w-12" />
             <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      
      {/* Bouton */}
      <div className="mt-2">
         <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}