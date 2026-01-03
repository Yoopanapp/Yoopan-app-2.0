'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import storesData from '../data/leclerc_stores.json'; 
import { Search, MapPin, X, ChevronDown, Loader2, Navigation, Store } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

// Import dynamique de la carte
const Map = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400 animate-pulse">Chargement...</div>
});

export default function StoreSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [selectedStore, setSelectedStore] = useState<any>(null);
  
  const isGpsUpdate = useRef(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]); 
  const [listStores, setListStores] = useState<any[]>([]); 
  const [mapStores, setMapStores] = useState<any[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const getCleanId = (store: any) => {
    let rawId = store.noPR || store.noPL || store.id;
    if (!rawId) return null;
    let stringId = String(rawId).trim();
    if (stringId.length === 5) {
        stringId = `0${stringId}`;
    }
    return stringId;
  };

  useEffect(() => {
    setMounted(true);
    const currentStoreId = searchParams.get('storeId');
    if (currentStoreId) {
        const store = (storesData as any[]).find(s => {
            const clean = getCleanId(s);
            return clean === currentStoreId || s.id === currentStoreId || s.noPL === currentStoreId;
        });
        if (store) setSelectedStore(store);
    }
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const getVal = (s: any, keys: string[]) => { for (const k of keys) if (s[k]) return s[k]; return ""; };
  const getStoreLat = (s: any) => parseFloat(getVal(s, ['lat', 'latitude', 'y']));
  const getStoreLng = (s: any) => parseFloat(getVal(s, ['lng', 'lon', 'longitude', 'x']));

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (isGpsUpdate.current) { isGpsUpdate.current = false; return; }
    const term = search.trim();
    if (term.length < 3) { setSuggestions([]); return; }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${term}&type=municipality&limit=5&autocomplete=1`);
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (error) { console.error(error); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const calculateStoresAround = (lat: number, lon: number) => {
    setIsSearching(true);
    setListStores([]); 
    setMapCenter([lat, lon]);
    setTimeout(() => {
        const calculated = (storesData as any[])
        .map(store => {
            const sLat = getStoreLat(store);
            const sLng = getStoreLng(store);
            return {
                ...store,
                displayName: getVal(store, ['name', 'nom', 'enseigne']),
                displayCity: getVal(store, ['city', 'ville']),
                displayZip: getVal(store, ['postalCode', 'codePostal', 'cp', 'zip']),
                lat: sLat,
                lng: sLng,
                distance: getDistance(lat, lon, sLat, sLng),
                cleanId: getCleanId(store)
            };
        })
        .filter(store => store.distance < 100)
        .sort((a, b) => a.distance - b.distance);
        
        setListStores(calculated.slice(0, 10)); 
        setMapStores(calculated.slice(0, 50)); 
        setIsSearching(false);
    }, 300); 
  };

  const handleSelectCity = (feature: any) => {
    isGpsUpdate.current = true; 
    setSearch(feature.properties.label);
    setShowSuggestions(false);
    const [lon, lat] = feature.geometry.coordinates;
    calculateStoresAround(lat, lon);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) { alert("Pas de GPS"); return; }
    setIsSearching(true);
    isGpsUpdate.current = true;
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
            const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`);
            const data = await res.json();
            if(data.features?.length > 0) setSearch(data.features[0].properties.city);
        } catch(e) {}
        calculateStoresAround(latitude, longitude);
    }, () => { setIsSearching(false); alert("Impossible de localiser."); });
  };

  const handleSelectStore = (store: any) => {
      setSelectedStore(store);
      setIsOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      const finalId = getCleanId(store);
      if (finalId) {
          params.set('storeId', finalId);
          router.replace(`/?${params.toString()}`, { scroll: false });
      } else {
          alert("Erreur ID magasin");
      }
  };

  const leclercLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/e/ed/Logo_E.Leclerc_Sans_le_texte.svg";

  return (
    <>
      {/* --- DESIGN "PILL" CLAIR ET LARGE --- */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="group flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-2 pr-5 py-2 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 max-w-[280px] sm:max-w-md"
      >
        {/* Icône */}
        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            {selectedStore ? <Store size={18} /> : <MapPin size={18} />}
        </div>

        {/* Texte */}
        <div className="flex flex-col items-start leading-tight mr-4 min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5 whitespace-nowrap">
                Mon Magasin
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-white truncate w-full group-hover:text-blue-600 transition-colors">
                {selectedStore ? (selectedStore.displayName || selectedStore.nom || selectedStore.name) : "Choisir un magasin..."}
            </span>
        </div>

        {/* Flèche */}
        <ChevronDown size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
      </button>

      {/* PORTAL POUR LA MODALE */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 font-sans"
            >
                <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-5xl h-auto max-h-[85vh] aspect-video rounded-3xl shadow-2xl flex overflow-hidden border border-slate-100 dark:border-slate-800 relative"
                >
                {/* GAUCHE */}
                <div className="w-full md:w-1/3 flex flex-col border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                    <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-20">
                    <h3 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Localisation</h3>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    
                    <div className="p-5 bg-white dark:bg-slate-900 relative z-30" ref={wrapperRef}>
                    <div className="flex gap-2">
                        <div className="relative group flex-1">
                            {isSearching ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" /> 
                                            : <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />}
                            <input 
                                type="text" 
                                placeholder="Ville, Code postal..." 
                                value={search} 
                                onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                                autoFocus 
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-medium text-slate-800 dark:text-white"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                    {suggestions.map((city: any) => (
                                        <div 
                                            key={city.properties.id}
                                            onClick={() => handleSelectCity(city)}
                                            className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between border-b border-slate-50 dark:border-slate-700 last:border-0"
                                        >
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{city.properties.label}</span>
                                            <span className="text-xs text-slate-400">{city.properties.postcode}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={handleGPS} className="p-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors border border-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400" title="Autour de moi">
                            <Navigation size={20} className="fill-current" />
                        </button>
                    </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar z-10">
                    {!isSearching && listStores.map((store: any, i) => (
                        <motion.div 
                        key={store.id || i}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        onClick={() => handleSelectStore(store)} 
                        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer bg-white dark:bg-slate-800 dark:border-slate-700 transition-all group"
                        >
                        <div className="p-2 rounded-full bg-white border border-slate-100 shadow-sm shrink-0">
                            <Image src={leclercLogoUrl} alt="Logo" width={24} height={24} className="w-6 h-6 object-contain"/>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{store.displayName || store.name}</h4>
                                <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full shadow-sm shadow-green-200">{store.distance.toFixed(1)} km</span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">
                                {store.displayZip || store.postalCode} {store.displayCity || store.city}
                            </p>
                        </div>
                        </motion.div>
                    ))}
                    </div>
                </div>

                {/* CARTE */}
                <div className="hidden md:block w-2/3 relative bg-slate-50">
                    <Map center={mapCenter} stores={mapStores} onSelect={handleSelectStore} />
                </div>
                </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}