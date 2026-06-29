// src/components/Logo.tsx

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "light" | "dark";
}

const Logo = ({ size = 36, className = "", variant = "light" }: LogoProps) => {
  const isDark = variant === "dark";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: isDark
          ? "drop-shadow(0 10px 22px rgba(249, 115, 22, 0.55)) drop-shadow(0 4px 10px rgba(249, 115, 22, 0.3))"
          : "drop-shadow(0 10px 22px rgba(249, 115, 22, 0.45)) drop-shadow(0 4px 10px rgba(249, 115, 22, 0.25))",
      }}
    >
      {/* Outer glow */}
      <circle cx="50" cy="50" r="49" fill="url(#glowGradient)" opacity={isDark ? 0.7 : 0.6} />
      {/* Background circle */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#bgGradient)"
        stroke={isDark ? "#7c2d12" : "#f5c08a"}
        strokeWidth="1.2"
      />
      
      {/* Leaf petals radiating outward */}
      <g stroke="url(#leafGradient)" strokeWidth="1.7" fill="none">
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
      <circle cx="50" cy="50" r="8" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" fill="none" />
      
      {/* Gradients */}
      <defs>
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isDark ? "#ffe4c7" : "#ffecd6"} />
          <stop offset="55%" stopColor={isDark ? "#fb923c" : "#fdba74"} />
          <stop offset="100%" stopColor="rgba(249, 115, 22, 0)" />
        </radialGradient>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#2b160b" : "#ffffff"} />
          <stop offset="100%" stopColor={isDark ? "#3b1d0d" : "#fff7ef"} />
        </linearGradient>
        
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#fdba74" : "#fed7aa"} />
          <stop offset="50%" stopColor={isDark ? "#fb923c" : "#f97316"} />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        
        <linearGradient id="leafFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "rgba(251, 146, 60, 0.55)" : "rgba(251, 146, 60, 0.4)"} />
          <stop offset="100%" stopColor={isDark ? "rgba(249, 115, 22, 0.35)" : "rgba(249, 115, 22, 0.26)"} />
        </linearGradient>
        
        <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isDark ? "#fff6ec" : "#fff2e5"} />
          <stop offset="100%" stopColor={isDark ? "#fdba74" : "#fb923c"} />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default Logo;

