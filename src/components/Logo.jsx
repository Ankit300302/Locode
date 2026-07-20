// LoCode brand logo component — matches the C-pin mark from brand assets
// Colors extracted: yellow #FFBF00 → orange #FF5722 → pink/magenta #E91E8C → purple #9C27B0 → blue #2196F3

export function LogoMark({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="lc-grad-outer" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFC107" />
          <stop offset="35%" stopColor="#FF5722" />
          <stop offset="65%" stopColor="#E91E8C" />
          <stop offset="100%" stopColor="#9C27B0" />
        </linearGradient>
        <linearGradient id="lc-grad-blue" x1="30" y1="70" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1565C0" />
          <stop offset="100%" stopColor="#42A5F5" />
        </linearGradient>
        <linearGradient id="lc-grad-inner" x1="20" y1="15" x2="75" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8F00" />
          <stop offset="50%" stopColor="#E91E8C" />
          <stop offset="100%" stopColor="#7B1FA2" />
        </linearGradient>
      </defs>
      {/* Outer C arc */}
      <path d="M85 20 C85 20 72 8 50 8 C25 8 8 27 8 50 C8 73 25 92 50 92 C55 92 59 91 63 90 L50 108 L37 90 C20 85 8 69 8 50 C8 24 27 4 50 4 C68 4 83 13 90 26 Z" fill="url(#lc-grad-outer)" />
      {/* Inner C fill to make it look like pin */}
      <path d="M78 18 C72 11 62 7 50 7 C28 7 12 26 12 50 C12 70 24 87 41 92 L50 108 L59 92 C76 87 88 70 88 50 C88 37 83 26 75 19 Z" fill="url(#lc-grad-inner)" opacity="0.5" />
      {/* C cutout — white hole */}
      <circle cx="50" cy="43" r="26" fill="#1a0a2e" />
      {/* Blue pointer tip */}
      <ellipse cx="52" cy="88" rx="14" ry="9" fill="url(#lc-grad-blue)" transform="rotate(-15 52 88)" />
      {/* Pin shadow */}
      <ellipse cx="50" cy="112" rx="12" ry="3" fill="rgba(100,60,200,0.2)" />
    </svg>
  )
}

export function LogoFull({ height = 36, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={height} />
      <svg height={height * 0.65} viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lc-text-orange" x1="0" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF8F00" />
            <stop offset="100%" stopColor="#FF6D00" />
          </linearGradient>
        </defs>
        {/* "Lo" in blue */}
        <text x="0" y="32" fontFamily="'Space Grotesk', 'Inter', sans-serif" fontWeight="700" fontSize="36" fill="#1565C0">Lo</text>
        {/* "C" with pin mark embedded — orange */}
        <text x="52" y="32" fontFamily="'Space Grotesk', 'Inter', sans-serif" fontWeight="700" fontSize="36" fill="url(#lc-text-orange)">Code</text>
      </svg>
    </div>
  )
}

export function AppIcon({ size = 48, className = '' }) {
  // The dark rounded square app icon variant
  return (
    <div
      className={`flex items-center justify-center rounded-2xl ${className}`}
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #1a1035 0%, #2d1b69 100%)',
        boxShadow: '0 4px 20px rgba(155, 39, 176, 0.3)'
      }}
    >
      <LogoMark size={size * 0.72} />
    </div>
  )
}
