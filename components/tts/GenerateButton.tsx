import Icon from "@/components/ui/Icon";

interface GenerateButtonProps {
  generating: boolean;
  disabled: boolean;
  onClick: () => void;
}

export default function GenerateButton({
  generating,
  disabled,
  onClick,
}: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group mt-6 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-4 text-base font-bold shadow-md transition-all duration-300 ${
        disabled && !generating
          ? "cursor-not-allowed border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 shadow-none"
          : "bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0"
      }`}
    >
      {/* Gloss shine effect on hover */}
      {!disabled && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}

      {generating ? (
        <>
          <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span className="tracking-wide">Synthesizing Human-like Voice…</span>
        </>
      ) : disabled ? (
        <>
          <Icon name="sparkle" size={20} />
          <span>Enter text above to generate speech</span>
        </>
      ) : (
        <>
          <span className="flex size-7 items-center justify-center rounded-lg bg-white/20 text-white">
            <Icon name="sparkle" size={18} />
          </span>
          <span className="tracking-wide">Generate High-Quality Speech</span>
          <span className="text-white/70 text-xs hidden sm:inline-block font-normal">
            (Instant AI)
          </span>
        </>
      )}
    </button>
  );
}