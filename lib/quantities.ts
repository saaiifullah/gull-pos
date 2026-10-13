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
