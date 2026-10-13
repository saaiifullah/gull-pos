import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

type Named = { name: string };

type ProfileShape = {
  id: string;
  full_name: string;
  role: string;
  shops: Named | Named[] | null;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  shop: string;
  staff: boolean;
};

export type SettingsData = {
  people: string;
  staff: string;
  customers: string;
  members: TeamMember[];
};

const emptySettings: SettingsData = {
  people: "0",
  staff: "0",
  customers: "0",
  members: [],
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  store_manager: "Store manager",
  accountant: "Accountant",
  shop: "Shop",
  customer: "Customer",
};

const roleOrder = ["owner", "store_manager", "accountant", "shop", "customer"];

const readName = (value: Named | Named[] | null | undefined) => {
  if (!value) return "—";
  const named = Array.isArray(value) ? value[0] : value;
  return named?.name || "—";
};

export const getSettings = async (): Promise<SettingsData> => {
  const user = await getCurrentUser();
  if (!user) return emptySettings;

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, role, shops(name)");

  if (error) return emptySettings;

  const members = ((data ?? []) as ProfileShape[])
    .slice()
    .sort((left, right) => {
      const roleGap = roleOrder.indexOf(left.role) - roleOrder.indexOf(right.role);
      if (roleGap !== 0) return roleGap;
      return left.full_name.localeCompare(right.full_name);
    })
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name || "Signed in",
      role: roleLabels[profile.role] ?? profile.role,
      shop: readName(profile.shops),
      staff: profile.role !== "customer",
    }));

  return {
    people: String(members.length),
    staff: String(members.filter((member) => member.staff).length),
    customers: String(members.filter((member) => !member.staff).length),
    members,
  };
};
