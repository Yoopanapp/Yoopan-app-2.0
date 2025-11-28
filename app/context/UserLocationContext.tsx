'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_LAT = 48.7105;
const DEFAULT_LNG = 2.4168;

// On utilise 'type' au lieu de 'interface' pour éviter le bug de parsing
type LocationContextType = {
  lat: number;
  lng: number;
  error: string | null;
  isLoading: boolean;
  calculateDistance: (targetLat: number, targetLng: number) => string | null;
};

const UserLocationContext = createContext<LocationContextType | undefined>(undefined);

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Non supporté");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsLoading(false);
      },
      (err) => {
        console.warn(err);
        setError("Refusé");
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const calculateDistance = (targetLat: number, targetLng: number) => {
    if (!lat || !lng || !targetLat || !targetLng) return null;
    const R = 6371; 
    const dLat = (targetLat - lat) * (Math.PI / 180);
    const dLon = (targetLng - lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) * Math.cos(targetLat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    if (d < 1) return Math.round(d * 1000) + 'm';
    return d.toFixed(1) + 'km';
  };

  return (
    <UserLocationContext.Provider value={{ lat, lng, error, isLoading, calculateDistance }}>
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = useContext(UserLocationContext);
  if (context === undefined) {
    throw new Error('useUserLocation error');
  }
  return context;
}