import type { ReactNode } from "react";

type ContentPageProps = {
  eyebrow?: string;
  title: string;
  intro: string;
  children?: ReactNode;
};

export default function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: ContentPageProps) {
  return (
    <main className="flex-1 bg-transparent">
      <article className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        {eyebrow && (
          <p className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{intro}</p>
        {children && (
          <div className="mt-8 space-y-6 leading-7 text-slate-700 dark:text-slate-300">
            {children}
          </div>
        )}
      </article>
    </main>
  );
}