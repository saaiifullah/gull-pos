import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatQuantity, readQuantity, type Unit } from "@/lib/quantities";

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
  item_variants: VariantShape | VariantShape[] | null;
};

type DispatchShape = {
  id: string;
  number: string;
  status: string;
  delivery_on: string | null;
  shops: Named | Named[] | null;
  dispatch_lines: LineShape[] | null;
};

export type DispatchLine = {
  id: string;
  itemName: string;
  variant: string;
  quantityLabel: string;
};

export type DispatchRecord = {
  id: string;
  number: string;
  shop: string;
  status: string;
  open: boolean;
  delivery: string;
  lines: DispatchLine[];
};

export type DistributionData = {
  count: string;
  openCount: string;
  piecesSent: string;
  dispatches: DispatchRecord[];
};

const emptyDistribution: DistributionData = {
  count: "0",
  openCount: "0",
  piecesSent: "0 pcs",
  dispatches: [],
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
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
    unit: item?.unit ?? "pcs",
    variant: [row?.color, row?.size].filter(Boolean).join(" · "),
  };
};

export const getDistribution = async (): Promise<DistributionData> => {
  const user = await getCurrentUser();
  if (!user) return emptyDistribution;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dispatches")
    .select(
      "id, number, status, delivery_on, shops(name), dispatch_lines(id, quantity, item_variants(color, size, items(name, unit)))",
    )
    .order("delivery_on", { ascending: false });

  if (error) return emptyDistribution;

  let pieces = 0;
  const dispatches = ((data ?? []) as DispatchShape[]).map((dispatch) => {
    const lines = (dispatch.dispatch_lines ?? []).map((line) => {
      const item = readItem(line.item_variants);
      const quantity = readQuantity(line.quantity);
      if (item.unit === "pcs") pieces += quantity;
      return {
        id: line.id,
        itemName: item.name,
        variant: item.variant,
        quantityLabel: formatQuantity(quantity, item.unit),
      };
    });
    const open = dispatch.status !== "delivered";

    return {
      id: dispatch.id,
      number: dispatch.number,
      shop: readName(dispatch.shops, "Shop"),
      status: statusLabels[dispatch.status] ?? dispatch.status,
      open,
      delivery: formatDate(dispatch.delivery_on),
      lines,
    };
  });

  return {
    count: String(dispatches.length),
    openCount: String(dispatches.filter((dispatch) => dispatch.open).length),
    piecesSent: formatQuantity(pieces, "pcs"),
    dispatches,
  };
};
