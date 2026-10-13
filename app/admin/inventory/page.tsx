import { Suspense } from "react";
import { Inventory } from "@/components/admin/inventory";

const InventoryFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading inventory…</p>
    </div>
  );
};

export default function InventoryPage() {
  return (
    <Suspense fallback={<InventoryFallback />}>
      <Inventory />
    </Suspense>
  );
}
