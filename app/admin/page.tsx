import { Suspense } from "react";
import { Dashboard } from "@/components/admin/dashboard";

const DashboardFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading dashboard…</p>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard />
    </Suspense>
  );
}
