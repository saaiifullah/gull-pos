import { Suspense } from "react";
import { Shops } from "@/components/admin/shops";

const ShopsFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading shops…</p>
    </div>
  );
};

export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopsFallback />}>
      <Shops />
    </Suspense>
  );
}
