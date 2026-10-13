export type AdminIconName =
  | "grid"
  | "box"
  | "bag"
  | "scissors"
  | "truck"
  | "users"
  | "wallet"
  | "chart"
  | "settings"
  | "shop"
  | "menu"
  | "close";

export type AdminNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: AdminIconName;
};

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", shortLabel: "Home", icon: "grid" },
  { href: "/admin/inventory", label: "Inventory", shortLabel: "Inventory", icon: "box" },
  { href: "/admin/purchases", label: "Purchases", shortLabel: "Purchases", icon: "bag" },
  { href: "/admin/production", label: "Production", shortLabel: "Production", icon: "scissors" },
  { href: "/admin/distribution", label: "Distribution", shortLabel: "Dispatch", icon: "truck" },
  { href: "/admin/shops", label: "Shops & Customers", shortLabel: "Shops", icon: "users" },
  { href: "/admin/accounts", label: "Accounts", shortLabel: "Accounts", icon: "wallet" },
  { href: "/admin/reports", label: "Reports", shortLabel: "Reports", icon: "chart" },
  { href: "/admin/settings", label: "Settings", shortLabel: "Settings", icon: "settings" },
];
