// app/components/FilterBar.tsx (Version originale)
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const FILTERS = [
  { id: 'all', label: 'Tout', emoji: '🛒' },
  { id: 'bio', label: 'Bio', emoji: '🌿' },
  { id: 'boissons', label: 'Boissons', emoji: '🥤' },
  { id: 'frais', label: 'Frais', emoji: '❄️' },
  { id: 'epicerie', label: 'Épicerie', emoji: '🍝' },
  { id: 'sante', label: 'Nutri-Score A/B', emoji: '🍏' },
];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';

  const handleFilter = (filterId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filterId === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filterId);
    }
    
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    // J'ai remis le mb-8 ici
    <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in">
      {FILTERS.map((f) => {
        const isActive = currentFilter === f.id;
        return (
          <button
            key={f.id}
            onClick={() => handleFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2 shadow-sm ${
              isActive
                ? 'bg-slate-900 text-white scale-105 shadow-md dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}