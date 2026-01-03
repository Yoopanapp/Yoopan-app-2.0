'use client';

import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// --- CONFIGURATION DES ICÔNES ---

const storeIcon = L.divIcon({
  className: '', 
  html: `
    <div style="position: relative; width: 40px; height: 50px; display: flex; justify-content: center; filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07));">
      <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%) rotate(-45deg); width: 40px; height: 40px; background-color: #2563eb; border-radius: 50% 50% 50% 0;"></div>
      <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); width: 32px; height: 32px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10;">
        <img src="https://upload.wikimedia.org/wikipedia/commons/e/ed/Logo_E.Leclerc_Sans_le_texte.svg" style="width: 24px; height: 24px; object-fit: contain;" alt="Leclerc" />
      </div>
    </div>
  `,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -55],
  tooltipAnchor: [0, -50]
});

const centerIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Composant pour recentrer la carte automatiquement
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { 
    if (center && center[0] && center[1]) {
        map.setView(center, 13, { animate: true }); 
    }
  }, [center, map]);
  return null;
}

// --- COMPOSANT PRINCIPAL ---

export default function Map({ center, stores, onSelect }: { center: [number, number], stores: any[], onSelect: (s: any) => void }) {
  return (
    <div className="h-full w-full relative z-0 isolate">
        <MapContainer 
            center={center} 
            zoom={13} 
            scrollWheelZoom={true} 
            className="h-full w-full outline-none"
        >
            <ChangeView center={center} />
            
            <TileLayer 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
            />
            
            {/* Votre position */}
            <Marker position={center} icon={centerIcon} zIndexOffset={1000}>
                <Popup className="font-sans">
                    <div className="text-center font-bold text-red-500 text-xs uppercase tracking-wider">Votre recherche</div>
                </Popup>
            </Marker>

            {/* Magasins */}
            {stores.map((store, i) => {
                // Sécurisation : on gère le cas où lat/lng sont des strings OU des nombres
                const lat = typeof store.lat === 'string' ? parseFloat(store.lat) : store.lat;
                const lng = typeof store.lng === 'string' ? parseFloat(store.lng) : store.lng;

                if (!lat || !lng) return null;

                return (
                    <Marker 
                        key={store.id || i} 
                        position={[lat, lng]} 
                        icon={storeIcon}
                        eventHandlers={{ 
                            click: () => {
                                // Action au clic sur le marqueur (optionnel)
                            } 
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -55]} opacity={1} className="custom-tooltip">
                            <div className="text-center">
                                <span className="font-bold text-slate-800">{store.displayName || store.name}</span>
                            </div>
                        </Tooltip>

                        <Popup className="font-sans" minWidth={180}>
                            <div className="text-center">
                                <h3 className="font-bold text-slate-800 text-sm mb-1">{store.displayName || store.name}</h3>
                                <p className="text-xs text-slate-500 mb-3">
                                    {store.displayZip || store.postalCode} {store.displayCity || store.city}
                                </p>
                                
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => onSelect(store)} 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
                                    >
                                        CHOISIR CE MAGASIN
                                    </button>
                                    
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1 no-underline"
                                    >
                                        🚗 ITINÉRAIRE
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    </div>
  );
}