export function WorkSightLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Icon Circle */}
      <circle cx="20" cy="20" r="18" fill="url(#gradient)" />

      {/* S Letter */}
      <path
        d="M 20 11 C 16 11 13 13 13 16 C 13 19 15 20 20 21 C 23 21.5 25 22 25 24 C 25 26 23 27 20 27 C 17 27 15 25.5 15 24 L 12 24 C 12 27 15 30 20 30 C 25 30 28 27 28 24 C 28 20.5 25 19.5 20 18.5 C 17 18 16 17 16 16 C 16 14.5 17.5 13 20 13 C 22.5 13 24 14.5 24 16 L 27 16 C 27 13 24 11 20 11 Z"
        fill="white"
      />

      {/* Text */}
      <text
        x="45"
        y="26"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="20"
        fontWeight="600"
        fill="currentColor"
      >
        WorkSight
      </text>

      {/* Gradient Definition */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#575ff4" />
          <stop offset="100%" stopColor="#4248c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
