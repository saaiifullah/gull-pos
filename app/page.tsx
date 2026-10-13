import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <section className="w-full max-w-lg">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#829089]">MODEHAUS</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Distribution HQ</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          The admin workspace is open. Inventory, production, and the customer shop are added in
          later phases.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-[9px] bg-accent px-5 text-sm font-semibold text-white hover:bg-[#2448c6]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-[9px] border border-line bg-white px-5 text-sm font-semibold text-ink"
          >
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
