import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatQuantity, readQuantity, type Unit } from "@/lib/quantities";

type ItemShape = { name: string; unit?: Unit };

type VariantShape = {
  color: string | null;
  size: string | null;
  items: ItemShape | ItemShape[] | null;
};

type BatchShape = {
  id: string;
  number: string;
  stage: string;
  due_on: string | null;
  material_qty: number | string | null;
  expected_units: number | string | null;
  material: VariantShape | VariantShape[] | null;
  output: VariantShape | VariantShape[] | null;
};

export type ProductionBatch = {
  id: string;
  number: string;
  stage: string;
  open: boolean;
  makes: string;
  cloth: string;
  expected: string;
  due: string;
};

export type ProductionData = {
  count: string;
  openCount: string;
  openCloth: string;
  batches: ProductionBatch[];
};

const emptyProduction: ProductionData = {
  count: "0",
  openCount: "0",
  openCloth: "0 m",
  batches: [],
};

const stageLabels: Record<string, string> = {
  cutting: "Cutting",
  stitching: "Stitching",
  finished: "Finished",
};

const readVariant = (value: VariantShape | VariantShape[] | null) => {
  return Array.isArray(value) ? value[0] : value;
};

const readItemName = (variant: VariantShape | null | undefined) => {
  const item = Array.isArray(variant?.items) ? variant.items[0] : variant?.items;
  return item?.name || "Item";
};

export const getProduction = async (): Promise<ProductionData> => {
  const user = await getCurrentUser();
  if (!user) return emptyProduction;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_batches")
    .select(
      "id, number, stage, due_on, material_qty, expected_units, material:item_variants!material_variant_id(color, size, items(name, unit)), output:item_variants!output_variant_id(items(name))",
    )
    .order("due_on", { ascending: true });

  if (error) return emptyProduction;

  const batches = ((data ?? []) as BatchShape[])
    .slice()
    .sort((left, right) => {
      const leftOpen = left.stage !== "finished" ? 1 : 0;
      const rightOpen = right.stage !== "finished" ? 1 : 0;
      if (leftOpen !== rightOpen) return rightOpen - leftOpen;
      return (left.due_on ?? "").localeCompare(right.due_on ?? "");
    })
    .map((batch) => {
      const material = readVariant(batch.material);
      const materialItem = Array.isArray(material?.items) ? material.items[0] : material?.items;
      const unit = materialItem?.unit ?? "m";
      const clothName = readItemName(material);
      const clothDetail = [material?.color, material?.size].filter(Boolean).join(" · ");
      const open = batch.stage !== "finished";

      return {
        id: batch.id,
        number: batch.number,
        stage: stageLabels[batch.stage] ?? batch.stage,
        open,
        makes: readItemName(readVariant(batch.output)),
        cloth: `${formatQuantity(readQuantity(batch.material_qty), unit)} ${clothName}${clothDetail ? ` · ${clothDetail}` : ""}`,
        expected: formatQuantity(readQuantity(batch.expected_units), "pcs"),
        due: formatDate(batch.due_on),
        materialQty: readQuantity(batch.material_qty),
      };
    });

  const openCloth = batches.filter((batch) => batch.open).reduce((sum, batch) => sum + batch.materialQty, 0);

  return {
    count: String(batches.length),
    openCount: String(batches.filter((batch) => batch.open).length),
    openCloth: formatQuantity(openCloth, "m"),
    batches,
  };
};
