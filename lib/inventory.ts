import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatQuantity, readQuantity, type Unit } from "@/lib/quantities";

type Kind = "material" | "finished";

type BalanceRow = {
  item_id: string;
  item_name: string;
  color: string | null;
  size: string | null;
  kind: Kind;
  unit: Unit;
  bought: number | string | null;
  distributed: number | string | null;
  remaining: number | string | null;
};

type ItemRow = {
  id: string;
  low_stock_threshold: number;
};

export type InventoryRow = {
  itemId: string;
  name: string;
  variant: string;
  boughtLabel: string;
  distributedLabel: string;
  remainingLabel: string;
  low: boolean;
};

export type InventoryData = {
  clothOnHand: string;
  piecesOnHand: string;
  lowCount: string;
  cloth: InventoryRow[];
  finished: InventoryRow[];
};

const emptyInventory: InventoryData = {
  clothOnHand: "0 m",
  piecesOnHand: "0 pcs",
  lowCount: "0",
  cloth: [],
  finished: [],
};

const variantLabel = (color: string | null, size: string | null) => {
  return [color, size].filter(Boolean).join(" · ");
};

export const getInventory = async (): Promise<InventoryData> => {
  const user = await getCurrentUser();
  if (!user) return emptyInventory;

  const supabase = await createClient();
  const [balanceResult, itemResult] = await Promise.all([
    supabase
      .from("inventory_balances")
      .select("item_id, item_name, color, size, kind, unit, bought, distributed, remaining"),
    supabase.from("items").select("id, low_stock_threshold"),
  ]);

  if (balanceResult.error) return emptyInventory;

  const balances = (balanceResult.data ?? []) as BalanceRow[];
  const items = itemResult.error ? [] : ((itemResult.data ?? []) as ItemRow[]);
  const thresholds = new Map(items.map((item) => [item.id, item.low_stock_threshold]));

  const grouped = new Map<
    string,
    {
      name: string;
      kind: Kind;
      unit: Unit;
      variants: Set<string>;
      bought: number;
      distributed: number;
      remaining: number;
    }
  >();

  for (const row of balances) {
    const current = grouped.get(row.item_id) ?? {
      name: row.item_name,
      kind: row.kind,
      unit: row.unit,
      variants: new Set<string>(),
      bought: 0,
      distributed: 0,
      remaining: 0,
    };
    const label = variantLabel(row.color, row.size);
    if (label) current.variants.add(label);
    current.bought += readQuantity(row.bought);
    current.distributed += readQuantity(row.distributed);
    current.remaining += readQuantity(row.remaining);
    grouped.set(row.item_id, current);
  }

  const rows = [...grouped.entries()]
    .map(([itemId, row]) => {
      const low = row.remaining <= (thresholds.get(itemId) ?? 0);
      return {
        itemId,
        name: row.name,
        kind: row.kind,
        unit: row.unit,
        variant: [...row.variants].sort().join(", "),
        boughtLabel: formatQuantity(row.bought, row.unit),
        distributedLabel: formatQuantity(row.distributed, row.unit),
        remainingLabel: formatQuantity(row.remaining, row.unit),
        remaining: row.remaining,
        low,
      };
    })
    .sort((left, right) => Number(right.low) - Number(left.low) || left.name.localeCompare(right.name));

  const cloth = rows.filter((row) => row.kind === "material");
  const finished = rows.filter((row) => row.kind === "finished");
  const clothOnHand = cloth.reduce((total, row) => total + row.remaining, 0);
  const piecesOnHand = finished.reduce((total, row) => total + row.remaining, 0);

  return {
    clothOnHand: formatQuantity(clothOnHand, "m"),
    piecesOnHand: formatQuantity(piecesOnHand, "pcs"),
    lowCount: String(rows.filter((row) => row.low).length),
    cloth,
    finished,
  };
};
