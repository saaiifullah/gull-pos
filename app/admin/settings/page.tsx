import { Suspense } from "react";
import { Settings } from "@/components/admin/settings";

const SettingsFallback = () => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="text-sm text-muted">Loading settings…</p>
    </div>
  );
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <Settings />
    </Suspense>
  );
}
