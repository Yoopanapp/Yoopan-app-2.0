// app/components/Logo.tsx
export function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="neocart_gradient" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" /> {/* Bleu Tech */}
          <stop offset="1" stopColor="#10B981" /> {/* Vert Économie */}
        </linearGradient>
      </defs>
      
      {/* CORPS DU CADDIE - Trait épais et arrondi */}
      <path 
        d="M20 25H35L42 75H90L100 45H40" 
        stroke="url(#neocart_gradient)" 
        strokeWidth="12" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* ROUES - Simples cercles pleins pour la stabilité */}
      <circle cx="45" cy="95" r="9" fill="url(#neocart_gradient)" />
      <circle cx="85" cy="95" r="9" fill="url(#neocart_gradient)" />
      
      {/* PETIT DÉTAIL EN PLUS - Une petite ligne "vitesse" ou "ticket" discrète */}
      <path 
        d="M55 45L58 60" 
        stroke="url(#neocart_gradient)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        opacity="0.5"
      />
    </svg>
  );
}