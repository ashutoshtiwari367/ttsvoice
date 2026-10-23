type IconName =
  | "mic"
  | "sparkle"
  | "play"
  | "download"
  | "check"
  | "pause";

interface IconProps {
  name: IconName;
  size?: number;
}

export default function Icon({
  name,
  size = 20,
}: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "mic":
      return (
        <svg {...common}>
          <rect x="9" y="2.5" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
          <path d="M12 17.5V21" />
          <path d="M8.5 21h7" />
        </svg>
      );

    case "sparkle":
      return (
        <svg {...common}>
          <path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9z" />
          <path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z" />
        </svg>
      );

    case "play":
      return (
        <svg {...common}>
          <path
            d="M8 5.5v13l10-6.5z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );

    case "pause":
      return (
        <svg {...common}>
          <path d="M8 5v14" />
          <path d="M16 5v14" />
        </svg>
      );

    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    default:
      return null;
  }
}