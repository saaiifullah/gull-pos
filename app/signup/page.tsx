import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/app/signup/signup-form";
import { readAdminNext } from "@/lib/safe-admin-path";

const SignupPanel = async ({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) => {
  const params = await searchParams;
  return <SignupForm nextPath={readAdminNext(params.next)} />;
};

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <AuthCard
      title="Create an account"
      description="Choose an email and password. You will be signed in and taken to the admin workspace."
    >
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading sign up…</p>}>
        <SignupPanel searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
