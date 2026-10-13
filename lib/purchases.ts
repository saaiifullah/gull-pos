import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatQuantity, formatRupees, readQuantity, type Unit } from "@/lib/quantities";

type Named = { name: string };

type ItemShape = { name: string; unit: Unit };

type VariantShape = {
  color: string | null;
  size: string | null;
  items: ItemShape | ItemShape[] | null;
};

type LineShape = {
  id: string;
  quantity: number | string | null;
  unit_cost: number | string | null;
  item_variants: VariantShape | VariantShape[] | null;
};

type PurchaseShape = {
  id: string;
  number: string;
  purchased_on: string;
  payment_status: string;
  notes: string;
  suppliers: Named | Named[] | null;
  purchase_lines: LineShape[] | null;
};

export type PurchaseLine = {
  id: string;
  itemName: string;
  variant: string;
  quantityLabel: string;
  unitCostLabel: string;
  totalLabel: string;
};

export type PurchaseRecord = {
  id: string;
  number: string;
  supplier: string;
  date: string;
  status: string;
  open: boolean;
  notes: string;
  totalLabel: string;
  lines: PurchaseLine[];
};

export type PurchasesData = {
  count: string;
  paidTotal: string;
  openTotal: string;
  purchases: PurchaseRecord[];
};

const emptyPurchases: PurchasesData = {
  count: "0",
  paidTotal: "Rs 0",
  openTotal: "Rs 0",
  purchases: [],
};

const statusLabels: Record<string, string> = {
  paid: "Paid",
  part_paid: "Part paid",
  due: "Due",
};

const readName = (value: Named | Named[] | null | undefined, fallback: string) => {
  if (!value) return fallback;
  const named = Array.isArray(value) ? value[0] : value;
  return named?.name || fallback;
};

const readItem = (variant: VariantShape | VariantShape[] | null) => {
  const row = Array.isArray(variant) ? variant[0] : variant;
  const item = Array.isArray(row?.items) ? row.items[0] : row?.items;
  return {
    name: item?.name || "Item",
    unit: item?.unit ?? "m",
    variant: [row?.color, row?.size].filter(Boolean).join(" · "),
  };
};

export const getPurchases = async (): Promise<PurchasesData> => {
  const user = await getCurrentUser();
  if (!user) return emptyPurchases;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(
      "id, number, purchased_on, payment_status, notes, suppliers(name), purchase_lines(id, quantity, unit_cost, item_variants(color, size, items(name, unit)))",
    )
    .order("purchased_on", { ascending: false });

  if (error) return emptyPurchases;

  const purchases = ((data ?? []) as PurchaseShape[]).map((purchase) => {
    const lines = (purchase.purchase_lines ?? []).map((line) => {
      const item = readItem(line.item_variants);
      const quantity = readQuantity(line.quantity);
      const unitCost = readQuantity(line.unit_cost);
      return {
        id: line.id,
        itemName: item.name,
        variant: item.variant,
        quantityLabel: formatQuantity(quantity, item.unit),
        unitCostLabel: formatRupees(unitCost),
        totalLabel: formatRupees(quantity * unitCost),
        total: quantity * unitCost,
      };
    });
    const total = lines.reduce((sum, line) => sum + line.total, 0);
    const open = purchase.payment_status !== "paid";

    return {
      id: purchase.id,
      number: purchase.number,
      supplier: readName(purchase.suppliers, "Supplier"),
      date: formatDate(purchase.purchased_on),
      status: statusLabels[purchase.payment_status] ?? purchase.payment_status,
      open,
      notes: purchase.notes,
      totalLabel: formatRupees(total),
      total,
      lines,
    };
  });

  const paidTotal = purchases
    .filter((purchase) => !purchase.open)
    .reduce((sum, purchase) => sum + purchase.total, 0);
  const openTotal = purchases
    .filter((purchase) => purchase.open)
    .reduce((sum, purchase) => sum + purchase.total, 0);

  return {
    count: String(purchases.length),
    paidTotal: formatRupees(paidTotal),
    openTotal: formatRupees(openTotal),
    purchases,
  };
};
