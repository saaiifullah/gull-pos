import { Suspense } from "react";
import { Purchases } from "@/components/admin/purchases";

const PurchasesFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading purchases…</p>
    </div>
  );
};

export default function PurchasesPage() {
  return (
    <Suspense fallback={<PurchasesFallback />}>
      <Purchases />
    </Suspense>
  );
}
