// Friendly, flat education-themed illustration for the login panel.
// Designed to pop on a amber→pink gradient (white cards + bright accents).
export default function AuthIllustration({ className }) {
  return (
    <svg viewBox="0 0 460 420" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#2a1145" floodOpacity="0.25" />
        </filter>
        <linearGradient id="capG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b2a7a" />
          <stop offset="1" stopColor="#241a52" />
        </linearGradient>
        <linearGradient id="screenBar1" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* decorative floating blobs */}
      <circle cx="70" cy="80" r="46" fill="#ffffff" opacity="0.12" />
      <circle cx="400" cy="120" r="30" fill="#ffffff" opacity="0.12" />
      <circle cx="380" cy="330" r="54" fill="#ffffff" opacity="0.10" />

      {/* book stack (bottom-left) */}
      <g filter="url(#soft)">
        <rect x="56" y="300" width="120" height="22" rx="6" fill="#14b8a6" />
        <rect x="64" y="280" width="120" height="22" rx="6" fill="#f472b6" />
        <rect x="50" y="260" width="120" height="22" rx="6" fill="#fbbf24" />
        <rect x="60" y="266" width="6" height="10" rx="3" fill="#ffffff" opacity="0.8" />
        <rect x="74" y="286" width="6" height="10" rx="3" fill="#ffffff" opacity="0.8" />
        <rect x="66" y="306" width="6" height="10" rx="3" fill="#ffffff" opacity="0.8" />
      </g>

      {/* main dashboard card */}
      <g filter="url(#soft)" transform="rotate(-6 210 200)">
        <rect x="120" y="118" width="210" height="164" rx="20" fill="#ffffff" />
        {/* header */}
        <circle cx="142" cy="142" r="9" fill="#a78bfa" />
        <rect x="158" y="137" width="70" height="9" rx="4.5" fill="#e9e3ff" />
        <rect x="158" y="151" width="44" height="7" rx="3.5" fill="#efe9ff" />
        {/* donut */}
        <circle cx="290" cy="150" r="20" fill="none" stroke="#eee" strokeWidth="7" />
        <circle cx="290" cy="150" r="20" fill="none" stroke="#22c55e" strokeWidth="7" strokeLinecap="round"
          strokeDasharray="125.6" strokeDashoffset="34" transform="rotate(-90 290 150)" />
        {/* bars */}
        <rect x="142" y="225" width="22" height="35" rx="6" fill="url(#screenBar1)" />
        <rect x="176" y="208" width="22" height="52" rx="6" fill="#f472b6" />
        <rect x="210" y="232" width="22" height="28" rx="6" fill="#fbbf24" />
        <rect x="244" y="216" width="22" height="44" rx="6" fill="#38bdf8" />
        <rect x="278" y="200" width="22" height="60" rx="6" fill="#34d399" />
      </g>

      {/* graduation cap (top) */}
      <g filter="url(#soft)" transform="rotate(-10 215 96)">
        <path d="M215 70 L268 92 L215 114 L162 92 Z" fill="url(#capG)" />
        <path d="M215 114 L215 132" stroke="#fbbf24" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="215" cy="135" r="5" fill="#fbbf24" />
        <path d="M188 101 L188 118 Q215 132 242 118 L242 101" fill="#4c3a96" />
      </g>

      {/* checklist badge (right) */}
      <g filter="url(#soft)" transform="rotate(8 360 230)">
        <rect x="318" y="178" width="92" height="108" rx="16" fill="#ffffff" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${i * 30})`}>
            <circle cx="338" cy="206" r="9" fill={["#22c55e", "#8b5cf6", "#f472b6"][i]} />
            <path d="M334 206 l3 3 l5 -6" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="354" y="201" width="44" height="9" rx="4.5" fill="#eee" />
          </g>
        ))}
      </g>

      {/* pencil */}
      <g transform="rotate(40 150 200)">
        <rect x="120" y="186" width="70" height="14" rx="3" fill="#fbbf24" />
        <path d="M190 186 l16 7 l-16 7 z" fill="#fb7185" />
        <rect x="116" y="186" width="6" height="14" rx="2" fill="#f472b6" />
      </g>

      {/* sparkles */}
      <Sparkle x={120} y={70} s={10} />
      <Sparkle x={410} y={70} s={8} />
      <Sparkle x={300} y={350} s={9} />
      <Sparkle x={70} y={210} s={7} />

      {/* confetti dots */}
      <circle cx="345" cy="120" r="5" fill="#fbbf24" />
      <circle cx="95" cy="160" r="4" fill="#38bdf8" />
      <circle cx="395" cy="280" r="5" fill="#f472b6" />
      <circle cx="180" cy="350" r="4" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

function Sparkle({ x, y, s }) {
  return (
    <path
      d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`}
      fill="#fff"
      opacity="0.95"
    />
  );
}
