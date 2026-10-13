import { Suspense } from "react";
import { Production } from "@/components/admin/production";

const ProductionFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading production…</p>
    </div>
  );
};

export default function ProductionPage() {
  return (
    <Suspense fallback={<ProductionFallback />}>
      <Production />
    </Suspense>
  );
}
