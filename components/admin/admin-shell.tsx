"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { adminNav } from "@/lib/admin-nav";
import { Icon } from "@/components/ui/icon";

const isCurrent = (pathname: string, href: string) => {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export const AdminShell = ({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = email.slice(0, 2).toUpperCase() || "MH";

  const handleOpenMenu = () => setMenuOpen(true);
  const handleCloseMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[275px] flex-col bg-sidebar px-4 py-6 text-[#d7ded9] transition-transform md:w-[248px] md:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-2 pb-6 text-[17px] font-bold tracking-wide text-white">
          <span className="grid size-8 place-items-center rounded-[9px] bg-accent font-serif text-[19px] text-white">
            M
          </span>
          Modehaus
        </div>
        <button
          type="button"
          className="absolute top-5 right-3 grid size-10 place-items-center rounded-lg text-white md:hidden"
          onClick={handleCloseMenu}
          aria-label="Close menu"
        >
          <Icon name="close" />
        </button>
        <div className="mx-1 mb-6 grid grid-cols-[1fr_auto] rounded-[10px] border border-[#34403a] px-3 py-2.5">
          <span className="col-span-2 text-[9px] tracking-[0.12em] text-[#7f8f87]">
            WORKSPACE
          </span>
          <strong className="mt-1 text-xs text-white">Distribution HQ</strong>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Admin">
          {adminNav.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={handleCloseMenu}
                className={`flex h-[42px] items-center gap-3 rounded-[9px] px-3 text-[13px] ${current ? "bg-[#27332e] text-white" : "text-[#aeb9b3] hover:bg-[#27332e] hover:text-white"}`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-[10px] border border-[#34423b] bg-[#202b26] px-2.5 py-2.5 text-left text-white"
          >
            <Icon name="shop" size={18} />
            <span className="flex flex-1 flex-col">
              <b className="text-xs">Customer shop</b>
              <small className="text-[10px] text-[#87978f]">Opens in a later phase</small>
            </span>
          </Link>
          <div className="mt-4 flex items-center gap-2 px-1">
            <div className="grid size-8 place-items-center rounded-full bg-[#d9c4a7] text-[10px] font-bold text-[#594732]">
              {initials}
            </div>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[11px] text-white">{email || "Signed in"}</b>
              <small className="text-[10px] text-[#84938b]">Signed in</small>
            </span>
          </div>
          <form action={signOut} className="mt-3 px-1">
            <button
              type="submit"
              className="text-xs font-semibold text-[#aeb9b3] underline-offset-2 hover:text-white hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={handleCloseMenu}
        />
      ) : null}
      <div className="min-h-screen pb-16 md:ml-[248px] md:pb-0">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-line bg-white px-4 md:h-[72px] md:px-8">
          <button
            type="button"
            className="grid size-10 place-items-center md:hidden"
            onClick={handleOpenMenu}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
          <p className="text-sm font-semibold tracking-wide">Modehaus</p>
        </header>
        {children}
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-stretch justify-around border-t border-line bg-white md:hidden"
        aria-label="Admin shortcuts"
      >
        {adminNav.slice(0, 5).map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex min-w-14 flex-col items-center justify-center gap-1 text-[10px] ${current ? "text-accent" : "text-[#77827c]"}`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
