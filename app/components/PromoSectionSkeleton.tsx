export default function PromoSectionSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        {/* Titre Skeleton */}
        <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Grille Cartes Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 h-[280px] flex flex-col animate-pulse">
                    <div className="w-full h-40 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
                    <div className="mt-auto flex justify-between items-end">
                        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}