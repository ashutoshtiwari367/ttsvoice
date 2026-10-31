interface PricingPlanCardProps {
  name: string;
  price: string;
  characters: string;
  description: string;
  popular?: boolean;
  onBuy?: () => void;
}

export default function PricingPlanCard({
  name,
  price,
  characters,
  description,
  popular = false,
  onBuy,
}: PricingPlanCardProps) {
  return (
    <div
      className={`relative flex flex-col justify-between w-full h-full rounded-3xl border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 ${
        popular
          ? "border-orange-400 ring-2 ring-orange-500/20 dark:border-orange-500"
          : "border-slate-200"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
          Most Popular
        </div>
      )}

      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {name}
      </p>

      <div className="mt-4">
        <span className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          {price}
        </span>
      </div>

      <div className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-200">
        {characters} characters
      </div>

      <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>

      <button
        type="button"
        onClick={onBuy}
        className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 cursor-pointer"
      >
        Buy Credits
      </button>
    </div>
  );
}