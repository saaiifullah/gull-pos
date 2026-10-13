import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";

const LoginPanel = async ({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) => {
  const params = await searchParams;
  const requested = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath =
    requested === "/admin" || requested?.startsWith("/admin/") ? requested : "/admin";

  return <LoginForm nextPath={nextPath} />;
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
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
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.04em]">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use your email to open the admin workspace. Creating an account signs you in when email
          confirmation is not required.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading sign in…</p>}>
          <LoginPanel searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}
