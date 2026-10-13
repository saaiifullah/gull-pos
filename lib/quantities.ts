export type Unit = "m" | "pcs";

export const readQuantity = (value: number | string | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCount = (value: number) => {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
};

export const formatQuantity = (value: number, unit: Unit) => {
  const suffix = unit === "m" ? "m" : "pcs";
  return `${formatCount(value)} ${suffix}`;
};

export const formatRupees = (amount: number) => {
  const shown = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  return `Rs ${shown}`;
};

export const formatDate = (value: string | null) => {
  if (!value) return "No date";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};
