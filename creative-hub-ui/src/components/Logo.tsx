// src/components/Logo.tsx

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo = ({ size = 36, className = "" }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" />
      
      {/* Leaf petals radiating outward */}
      <g stroke="url(#leafGradient)" strokeWidth="1.5" fill="none">
        {/* Top */}
        <path d="M50 10 Q55 25 50 35 Q45 25 50 10" fill="url(#leafFill)" />
        <path d="M50 10 Q60 20 55 30" />
        
        {/* Top Right */}
        <path d="M75 18 Q65 30 58 38 Q70 35 75 18" fill="url(#leafFill)" />
        <path d="M78 22 Q68 32 62 40" />
        
        {/* Right */}
        <path d="M90 50 Q75 55 65 50 Q75 45 90 50" fill="url(#leafFill)" />
        <path d="M88 45 Q75 50 65 48" />
        
        {/* Bottom Right */}
        <path d="M75 82 Q65 70 58 62 Q70 65 75 82" fill="url(#leafFill)" />
        <path d="M78 78 Q68 68 62 60" />
        
        {/* Bottom */}
        <path d="M50 90 Q55 75 50 65 Q45 75 50 90" fill="url(#leafFill)" />
        <path d="M50 88 Q40 78 45 68" />
        
        {/* Bottom Left */}
        <path d="M25 82 Q35 70 42 62 Q30 65 25 82" fill="url(#leafFill)" />
        <path d="M22 78 Q32 68 38 60" />
        
        {/* Left */}
        <path d="M10 50 Q25 55 35 50 Q25 45 10 50" fill="url(#leafFill)" />
        <path d="M12 55 Q25 50 35 52" />
        
        {/* Top Left */}
        <path d="M25 18 Q35 30 42 38 Q30 35 25 18" fill="url(#leafFill)" />
        <path d="M22 22 Q32 32 38 40" />
      </g>
      
      {/* Center circle */}
      <circle cx="50" cy="50" r="12" fill="url(#centerGradient)" />
      
      {/* Inner decorative ring */}
      <circle cx="50" cy="50" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" fill="none" />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0f0f1a" />
        </linearGradient>
        
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        
        <linearGradient id="leafFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(245, 158, 11, 0.15)" />
          <stop offset="100%" stopColor="rgba(236, 72, 153, 0.1)" />
        </linearGradient>
        
        <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default Logo;

