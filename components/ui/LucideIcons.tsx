import React from "react";

export interface LucideIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

function BaseSvg({
  size = 18,
  className = "",
  children,
  ...props
}: LucideIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function UserIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </BaseSvg>
  );
}

export function HistoryIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </BaseSvg>
  );
}

export function BookmarkMicIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      <path d="M12 7v4" />
      <path d="M10 9h4" />
    </BaseSvg>
  );
}

export function CreditCardIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </BaseSvg>
  );
}

export function SettingsIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </BaseSvg>
  );
}

export function HelpCircleIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </BaseSvg>
  );
}

export function LogOutIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </BaseSvg>
  );
}

export function CrownIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </BaseSvg>
  );
}

export function SparklesIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </BaseSvg>
  );
}

export function ChevronRightIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="m9 18 6-6-6-6" />
    </BaseSvg>
  );
}

export function CheckIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </BaseSvg>
  );
}

export function SearchIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </BaseSvg>
  );
}

export function FilterIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </BaseSvg>
  );
}

export function TrashIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </BaseSvg>
  );
}

export function PlayIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </BaseSvg>
  );
}

export function PauseIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </BaseSvg>
  );
}

export function DownloadIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </BaseSvg>
  );
}

export function ShieldIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </BaseSvg>
  );
}

export function LockIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </BaseSvg>
  );
}

export function SunIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </BaseSvg>
  );
}

export function MoonIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </BaseSvg>
  );
}

export function BellIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </BaseSvg>
  );
}

export function SlidersIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" />
      <line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </BaseSvg>
  );
}

export function PlusIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </BaseSvg>
  );
}

export function StarIcon({
  filled = false,
  ...props
}: LucideIconProps & { filled?: boolean }) {
  return (
    <BaseSvg {...props} fill={filled ? "currentColor" : "none"}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </BaseSvg>
  );
}

export function MailIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </BaseSvg>
  );
}

export function BookOpenIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </BaseSvg>
  );
}

export function MessageSquareIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </BaseSvg>
  );
}

export function AlertCircleIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </BaseSvg>
  );
}

export function FileTextIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </BaseSvg>
  );
}

export function RefreshCwIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </BaseSvg>
  );
}

export function MenuIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </BaseSvg>
  );
}

export function XIcon(props: LucideIconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </BaseSvg>
  );
}

