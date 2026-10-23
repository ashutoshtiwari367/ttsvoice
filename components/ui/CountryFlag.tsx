import React from "react";

interface CountryFlagProps {
  country: string;
  className?: string;
  size?: number;
}

export default function CountryFlag({
  country,
  className = "size-5",
  size = 20,
}: CountryFlagProps) {
  const c = country.toUpperCase();

  const uniqueId = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `clip-${c}-${uniqueId}`;

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`rounded-full shrink-0 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-slate-200/80 dark:border-slate-700/80 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {renderFlag(c)}
      </g>
    </svg>
  );
}

function renderFlag(code: string) {
  switch (code) {
    case "IN": // India: Saffron, White, Green + Ashoka Chakra
      return (
        <>
          <rect y="0" width="32" height="10.66" fill="#FF9933" />
          <rect y="10.66" width="32" height="10.66" fill="#FFFFFF" />
          <rect y="21.33" width="32" height="10.67" fill="#138808" />
          <circle cx="16" cy="16" r="4.2" fill="none" stroke="#000080" strokeWidth="0.9" />
          <circle cx="16" cy="16" r="1.1" fill="#000080" />
          {/* Chakra spokes */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="16"
              y1="16"
              x2={16 + 3.8 * Math.cos((deg * Math.PI) / 180)}
              y2={16 + 3.8 * Math.sin((deg * Math.PI) / 180)}
              stroke="#000080"
              strokeWidth="0.45"
            />
          ))}
        </>
      );

    case "BD": // Bangladesh: Green field + Red circle
      return (
        <>
          <rect width="32" height="32" fill="#006A4E" />
          <circle cx="14.5" cy="16" r="7.2" fill="#F42A41" />
        </>
      );

    case "PK": // Pakistan: Green with white bar, crescent and star
      return (
        <>
          <rect width="32" height="32" fill="#01411C" />
          <rect width="7.5" height="32" fill="#FFFFFF" />
          {/* Crescent */}
          <circle cx="19" cy="16" r="6" fill="#FFFFFF" />
          <circle cx="21" cy="15" r="5.2" fill="#01411C" />
          {/* Star */}
          <polygon
            points="21,11.5 22,14.5 25,14.5 22.5,16.2 23.5,19.2 21,17.4 18.5,19.2 19.5,16.2 17,14.5 20,14.5"
            fill="#FFFFFF"
            transform="scale(0.8) translate(5, 3)"
          />
        </>
      );

    case "US": // USA: Red/white stripes + blue canton
      return (
        <>
          <rect width="32" height="32" fill="#B22234" />
          {[2.46, 7.38, 12.3, 17.23, 22.15, 27.07].map((y) => (
            <rect key={y} y={y} width="32" height="2.46" fill="#FFFFFF" />
          ))}
          <rect width="14" height="17" fill="#3C3B6E" />
          {/* Mini stars representation */}
          <circle cx="4" cy="4" r="0.9" fill="#FFFFFF" />
          <circle cx="8" cy="4" r="0.9" fill="#FFFFFF" />
          <circle cx="12" cy="4" r="0.9" fill="#FFFFFF" />
          <circle cx="6" cy="7.5" r="0.9" fill="#FFFFFF" />
          <circle cx="10" cy="7.5" r="0.9" fill="#FFFFFF" />
          <circle cx="4" cy="11" r="0.9" fill="#FFFFFF" />
          <circle cx="8" cy="11" r="0.9" fill="#FFFFFF" />
          <circle cx="12" cy="11" r="0.9" fill="#FFFFFF" />
          <circle cx="6" cy="14" r="0.9" fill="#FFFFFF" />
          <circle cx="10" cy="14" r="0.9" fill="#FFFFFF" />
        </>
      );

    case "ZA": // South Africa: Green Y with black, gold, red, blue, white
      return (
        <>
          <rect width="32" height="16" fill="#E03C31" />
          <rect y="16" width="32" height="16" fill="#001489" />
          <polygon points="0,0 14,16 0,32" fill="#000000" />
          <polygon points="0,0 16,16 0,32" fill="none" stroke="#FFB81C" strokeWidth="2.5" />
          <path d="M0,0 L16,16 L32,16 M0,32 L16,16" fill="none" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M0,0 L16,16 L32,16 M0,32 L16,16" fill="none" stroke="#007749" strokeWidth="3.6" />
        </>
      );

    case "AE":
    case "SA":
    case "AR": // Pan-Arab / Arabic: Green, White, Black horizontal with Red triangle
      return (
        <>
          <rect y="0" width="32" height="10.66" fill="#007A3D" />
          <rect y="10.66" width="32" height="10.66" fill="#FFFFFF" />
          <rect y="21.33" width="32" height="10.67" fill="#000000" />
          <polygon points="0,0 11,16 0,32" fill="#CE1126" />
        </>
      );

    case "AM": // Armenia: Red, Blue, Orange
      return (
        <>
          <rect y="0" width="32" height="10.66" fill="#D90012" />
          <rect y="10.66" width="32" height="10.66" fill="#0033A0" />
          <rect y="21.33" width="32" height="10.67" fill="#F2A800" />
        </>
      );

    case "AZ": // Azerbaijan: Cyan, Red (with crescent/star), Green
      return (
        <>
          <rect y="0" width="32" height="10.66" fill="#0092BC" />
          <rect y="10.66" width="32" height="10.66" fill="#E03A3E" />
          <rect y="21.33" width="32" height="10.67" fill="#009944" />
          <circle cx="15.5" cy="16" r="3.2" fill="#FFFFFF" />
          <circle cx="16.5" cy="16" r="2.6" fill="#E03A3E" />
          <circle cx="18.5" cy="16" r="0.8" fill="#FFFFFF" />
        </>
      );

    case "BY": // Belarus: Red, Green + ornamental border
      return (
        <>
          <rect width="32" height="21.33" fill="#C8313E" />
          <rect y="21.33" width="32" height="10.67" fill="#4AA65A" />
          <rect width="6" height="32" fill="#FFFFFF" />
          <path d="M0,4 L3,7 L0,10 L3,13 L0,16 L3,19 L0,22 L3,25 L0,28" stroke="#C8313E" strokeWidth="1" fill="none" />
        </>
      );

    case "BA": // Bosnia: Blue with yellow triangle and stars
      return (
        <>
          <rect width="32" height="32" fill="#002395" />
          <polygon points="8,0 26,0 26,32" fill="#FECB00" />
          {[4, 9, 14, 19, 24, 29].map((y, i) => (
            <circle key={i} cx={7 + i * 2.8} cy={y} r="1" fill="#FFFFFF" />
          ))}
        </>
      );

    case "BG": // Bulgaria: White, Green, Red
      return (
        <>
          <rect y="0" width="32" height="10.66" fill="#FFFFFF" />
          <rect y="10.66" width="32" height="10.66" fill="#00966E" />
          <rect y="21.33" width="32" height="10.67" fill="#D62612" />
        </>
      );

    case "DE": // Germany: Black, Red, Gold
      return (
        <>
          <rect y="0" width="32" height="10.66" fill="#000000" />
          <rect y="10.66" width="32" height="10.66" fill="#DD0000" />
          <rect y="21.33" width="32" height="10.67" fill="#FFCE00" />
        </>
      );

    case "ES": // Spain: Red, Yellow, Red
      return (
        <>
          <rect y="0" width="32" height="8" fill="#AA151B" />
          <rect y="8" width="32" height="16" fill="#F1BF00" />
          <rect y="24" width="32" height="8" fill="#AA151B" />
          <circle cx="10" cy="16" r="3" fill="#AA151B" opacity="0.8" />
        </>
      );

    case "FR": // France: Blue, White, Red
      return (
        <>
          <rect x="0" width="10.66" height="32" fill="#002654" />
          <rect x="10.66" width="10.66" height="32" fill="#FFFFFF" />
          <rect x="21.33" width="10.67" height="32" fill="#ED2939" />
        </>
      );

    case "ID": // Indonesia: Red, White
      return (
        <>
          <rect y="0" width="32" height="16" fill="#FF0000" />
          <rect y="16" width="32" height="16" fill="#FFFFFF" />
        </>
      );

    case "IT": // Italy: Green, White, Red
      return (
        <>
          <rect x="0" width="10.66" height="32" fill="#009246" />
          <rect x="10.66" width="10.66" height="32" fill="#FFFFFF" />
          <rect x="21.33" width="10.67" height="32" fill="#CE2B37" />
        </>
      );

    case "JP": // Japan: White with red circle
      return (
        <>
          <rect width="32" height="32" fill="#FFFFFF" />
          <circle cx="16" cy="16" r="6.8" fill="#BC002D" />
        </>
      );

    case "KR": // South Korea: White with Taegeuk (Red/Blue) and Trigrams
      return (
        <>
          <rect width="32" height="32" fill="#FFFFFF" />
          <circle cx="16" cy="16" r="6.5" fill="#C60C30" />
          <path d="M9.5,16 A6.5,6.5 0 0,0 22.5,16 A3.25,3.25 0 0,1 16,16 A3.25,3.25 0 0,0 9.5,16 Z" fill="#003478" />
          <circle cx="12.75" cy="16" r="3.25" fill="#C60C30" />
          <circle cx="19.25" cy="16" r="3.25" fill="#003478" />
        </>
      );

    case "NL": // Netherlands: Red, White, Blue
      return (
        <>
          <rect y="0" width="32" height="10.66" fill="#AE1C28" />
          <rect y="10.66" width="32" height="10.66" fill="#FFFFFF" />
          <rect y="21.33" width="32" height="10.67" fill="#21468B" />
        </>
      );

    case "PL": // Poland: White, Red
      return (
        <>
          <rect y="0" width="32" height="16" fill="#FFFFFF" />
          <rect y="16" width="32" height="16" fill="#DC143C" />
        </>
      );

    case "PT":
    case "BR": // Portugal / Brazil: Green and Red with Armillary sphere
      return (
        <>
          <rect x="0" width="13" height="32" fill="#046A38" />
          <rect x="13" width="19" height="32" fill="#DA291C" />
          <circle cx="13" cy="16" r="4.5" fill="#FFC72C" />
          <circle cx="13" cy="16" r="2.5" fill="#DA291C" />
        </>
      );

    case "RU": // Russia: White, Blue, Red
      return (
        <>
          <rect y="0" width="32" height="10.66" fill="#FFFFFF" />
          <rect y="10.66" width="32" height="10.66" fill="#0039A6" />
          <rect y="21.33" width="32" height="10.67" fill="#D52B1E" />
        </>
      );

    case "TR": // Turkey: Red with white crescent and star
      return (
        <>
          <rect width="32" height="32" fill="#E30A17" />
          <circle cx="14" cy="16" r="6" fill="#FFFFFF" />
          <circle cx="16" cy="16" r="4.8" fill="#E30A17" />
          <polygon
            points="18,13 18.8,15.2 21.2,15.2 19.3,16.6 20,18.8 18,17.4 16,18.8 16.7,16.6 14.8,15.2 17.2,15.2"
            fill="#FFFFFF"
          />
        </>
      );

    case "VN": // Vietnam: Red with large yellow star
      return (
        <>
          <rect width="32" height="32" fill="#DA251D" />
          <polygon
            points="16,8 18.5,15.5 26,15.5 20,20 22.3,27 16,22.8 9.7,27 12,20 6,15.5 13.5,15.5"
            fill="#FFFF00"
          />
        </>
      );

    case "CN": // China: Red with yellow star and small stars
      return (
        <>
          <rect width="32" height="32" fill="#DE2910" />
          <polygon
            points="8,6 9.5,10.5 14,10.5 10.5,13.2 11.8,17.5 8,15 4.2,17.5 5.5,13.2 2,10.5 6.5,10.5"
            fill="#FFDE00"
            transform="scale(0.85) translate(2, 2)"
          />
          <circle cx="17" cy="6" r="0.9" fill="#FFDE00" />
          <circle cx="19" cy="9" r="0.9" fill="#FFDE00" />
          <circle cx="19" cy="13" r="0.9" fill="#FFDE00" />
          <circle cx="17" cy="16" r="0.9" fill="#FFDE00" />
        </>
      );

    default: // Default Globe / Neutral fallback
      return (
        <>
          <rect width="32" height="32" fill="#475569" />
          <circle cx="16" cy="16" r="10" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        </>
      );
  }
}
