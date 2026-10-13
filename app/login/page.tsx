import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/app/login/login-form";
import { readAdminNext } from "@/lib/safe-admin-path";

const LoginPanel = async ({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) => {
  const params = await searchParams;
  return <LoginForm nextPath={readAdminNext(params.next)} />;
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <AuthCard
      title="Sign in"
      description="Use your email to open the admin workspace."
    >
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading sign in…</p>}>
        <LoginPanel searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
