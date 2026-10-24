"use client";

interface GenerateButtonProps {
  generating: boolean;
  disabled: boolean;
  isOverLimit: boolean;
  extraChars: number;
  remainingAllowance: number;
  onClick: () => void;
}

export default function GenerateButton({
  generating,
  disabled,
  isOverLimit,
  extraChars,
  remainingAllowance,
  onClick,
}: GenerateButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`group relative flex w-full max-w-lg items-center justify-center gap-3 rounded-2xl sm:rounded-full px-8 py-4 text-base sm:text-lg font-black tracking-wide text-white transition-all duration-300 shadow-xl ${
          disabled
            ? "cursor-not-allowed bg-slate-300 dark:bg-zinc-800 text-slate-500 shadow-none opacity-70"
            : "bg-gradient-to-r from-[#ff6a1f] via-[#ff5500] to-[#ff3b00] hover:scale-[1.02] active:scale-[0.98] shadow-orange-500/30 hover:shadow-orange-500/50 cursor-pointer"
        }`}
      >
        {generating ? (
          <>
            <svg
              className="size-5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Generating Studio Speech...</span>
          </>
        ) : isOverLimit ? (
          <>
            <span>⚠️ Trim {extraChars} character(s) to convert</span>
          </>
        ) : remainingAllowance <= 0 ? (
          <>
            <span>Allowance Exhausted • Please Recharge</span>
          </>
        ) : (
          <>
            {/* Audio Waveform Graphic */}
            <span className="flex items-center gap-0.5 text-white/90">
              <span className="inline-block h-3.5 w-1 rounded-full bg-white animate-pulse" />
              <span className="inline-block h-5 w-1 rounded-full bg-white" />
              <span className="inline-block h-2.5 w-1 rounded-full bg-white" />
              <span className="inline-block h-4 w-1 rounded-full bg-white animate-pulse" />
            </span>

            <span>Convert to Speech</span>
            <span className="text-xl transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </>
        )}
      </button>

      {/* Micro-hint under button */}
      {!disabled && !generating && (
        <p className="mt-2 text-center text-[11px] font-medium text-slate-400 dark:text-zinc-500">
          Fast Neural Generation • High Quality MP3 Download
        </p>
      )}
    </div>
  );
}