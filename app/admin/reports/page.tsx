import { Suspense } from "react";
import { Reports } from "@/components/admin/reports";

const ReportsFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading reports…</p>
    </div>
  );
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsFallback />}>
      <Reports />
    </Suspense>
  );
}
