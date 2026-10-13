import { getInventory, type InventoryRow } from "@/lib/inventory";

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <li className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.12em] text-[#829089]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </li>
  );
};

const StockTable = ({ rows }: { rows: InventoryRow[] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
            <th scope="col" className="pb-3 font-bold">
              Item
            </th>
            <th scope="col" className="pb-3 text-right font-bold">
              Bought
            </th>
            <th scope="col" className="pb-3 text-right font-bold">
              Sent out
            </th>
            <th scope="col" className="pb-3 text-right font-bold">
              Remaining
            </th>
            <th scope="col" className="pb-3 text-right font-bold">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.itemId} className="border-b border-line last:border-0">
              <th scope="row" className="py-3 pr-4 font-semibold">
                {row.name}
                {row.variant ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted">{row.variant}</span>
                ) : null}
              </th>
              <td className="py-3 text-right">{row.boughtLabel}</td>
              <td className="py-3 text-right">{row.distributedLabel}</td>
              <td className="py-3 text-right font-semibold">{row.remainingLabel}</td>
              <td className="py-3 text-right">
                {row.low ? <span className="font-semibold text-[#9a4b32]">Low</span> : "In stock"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StockSection = ({ title, rows }: { title: string; rows: InventoryRow[] }) => {
  const headingId = title.toLowerCase().replaceAll(" ", "-");

  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-4 md:p-5" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-base font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      <div className="mt-4">
        {rows.length === 0 ? (
          <p className="text-sm leading-6 text-muted">Nothing in this workspace yet.</p>
        ) : (
          <StockTable rows={rows} />
        )}
      </div>
    </section>
  );
};

export const Inventory = async () => {
  const inventory = await getInventory();

  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#829089]">STOCK CONTROL</p>
      <h1 className="text-[26px] font-semibold tracking-[-0.04em]">Inventory</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        On-hand stock is the sum of the ledger. Bought cloth and finished pieces, what has gone out, and what is still here.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Inventory summary">
        <SummaryCard label="CLOTH ON HAND" value={inventory.clothOnHand} />
        <SummaryCard label="PIECES ON HAND" value={inventory.piecesOnHand} />
        <SummaryCard label="LOW STOCK" value={inventory.lowCount} />
      </ul>

      <StockSection title="Cloth" rows={inventory.cloth} />
      <StockSection title="Finished pieces" rows={inventory.finished} />
    </div>
  );
};
