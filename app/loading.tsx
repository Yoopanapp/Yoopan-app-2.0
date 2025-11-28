import React from "react";
import ProductCardSkeleton from "./components/ProductCardSkeleton";
import { Skeleton } from "./components/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 transition-colors">
      
      {/* 1. HERO SKELETON (Pour matcher ton design "Vos courses...") */}
      <div className="pt-32 pb-12 lg:pt-40 lg:pb-16 flex flex-col items-center px-6">
          {/* Titre (2 lignes) */}
          <Skeleton className="h-16 w-3/4 md:w-1/2 mb-4 bg-gray-200 dark:bg-slate-800" />
          <Skeleton className="h-16 w-1/2 mb-8 bg-gray-200 dark:bg-slate-800" />
          
          {/* SearchBar Skeleton */}
          <Skeleton className="h-14 w-full max-w-2xl rounded-full mb-8 bg-gray-200 dark:bg-slate-800" />
          
          {/* FilterBar Skeleton (Pills) */}
          <div className="flex gap-3 overflow-x-auto max-w-full pb-2">
             {[1,2,3,4,5].map(i => (
                <Skeleton key={i} className="h-10 w-24 rounded-full bg-gray-200 dark:bg-slate-800" />
             ))}
          </div>
      </div>

      {/* 2. MAIN CONTENT SKELETON */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Titre Section */}
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
             <Skeleton className="h-8 w-64 mb-2 bg-gray-200 dark:bg-slate-800" />
             <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-slate-800" />
        </div>

        {/* Grille Produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
           {Array.from({ length: 8 }).map((_, i) => (
             <ProductCardSkeleton key={i} />
           ))}
        </div>
      </div>
    </main>
  );
}