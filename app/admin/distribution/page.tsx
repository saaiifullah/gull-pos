import { Suspense } from "react";
import { Distribution } from "@/components/admin/distribution";

const DistributionFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading distribution…</p>
    </div>
  );
};

export default function DistributionPage() {
  return (
    <Suspense fallback={<DistributionFallback />}>
      <Distribution />
    </Suspense>
  );
}
