import type { ReactNode } from "react";
import Link from "next/link";

export const AuthCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-[0_10px_35px_rgba(22,33,28,0.08)]">
        <Link href="/" className="mb-8 flex items-center gap-3 text-[17px] font-bold">
          <span className="grid size-8 place-items-center rounded-[9px] bg-accent font-serif text-[19px] text-white">
            M
          </span>
          Modehaus
        </Link>
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#829089]">DISTRIBUTION HQ</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.04em]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        {children}
      </section>
    </main>
  );
};
