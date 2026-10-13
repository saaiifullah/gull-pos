import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/auth";

const AdminFrame = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AdminShell email={user.email}>{children}</AdminShell>;
};

const AdminFrameFallback = () => {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="hidden w-[248px] bg-sidebar md:fixed md:inset-y-0 md:block" />
      <p className="px-8 py-10 text-sm text-muted md:ml-[248px]">Loading workspace…</p>
    </div>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AdminFrameFallback />}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}
