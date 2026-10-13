import { Suspense } from "react";
import { Accounts } from "@/components/admin/accounts";

const AccountsFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading accounts…</p>
    </div>
  );
};

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountsFallback />}>
      <Accounts />
    </Suspense>
  );
}
