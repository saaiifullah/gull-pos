import { getPurchases, type PurchaseRecord } from "@/lib/purchases";

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <li className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.12em] text-[#829089]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </li>
  );
};

const PurchaseCard = ({ purchase }: { purchase: PurchaseRecord }) => {
  return (
    <article className="rounded-2xl border border-line bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold tracking-[-0.03em]">{purchase.number}</h2>
        <p className="text-sm font-semibold">{purchase.totalLabel}</p>
      </div>
      <p className="mt-1 text-sm text-muted">
        {purchase.supplier} · {purchase.date} ·{" "}
        {purchase.open ? (
          <span className="font-semibold text-[#9a4b32]">{purchase.status}</span>
        ) : (
          purchase.status
        )}
      </p>
      {purchase.notes ? <p className="mt-2 text-sm leading-6">{purchase.notes}</p> : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
              <th scope="col" className="pb-3 font-bold">
                Cloth
              </th>
              <th scope="col" className="pb-3 text-right font-bold">
                Quantity
              </th>
              <th scope="col" className="pb-3 text-right font-bold">
                Unit cost
              </th>
              <th scope="col" className="pb-3 text-right font-bold">
                Line total
              </th>
            </tr>
          </thead>
          <tbody>
            {purchase.lines.map((line) => (
              <tr key={line.id} className="border-b border-line last:border-0">
                <th scope="row" className="py-3 pr-4 font-semibold">
                  {line.itemName}
                  {line.variant ? (
                    <span className="mt-0.5 block text-xs font-normal text-muted">{line.variant}</span>
                  ) : null}
                </th>
                <td className="py-3 text-right">{line.quantityLabel}</td>
                <td className="py-3 text-right">{line.unitCostLabel}</td>
                <td className="py-3 text-right font-semibold">{line.totalLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
};

export const Purchases = async () => {
  const purchases = await getPurchases();

  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#829089]">SUPPLIER PURCHASES</p>
      <h1 className="text-[26px] font-semibold tracking-[-0.04em]">Purchases</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        Cloth bought from suppliers. This list is a record only. Saving a new purchase comes later.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Purchase summary">
        <SummaryCard label="PURCHASES" value={purchases.count} />
        <SummaryCard label="PAID" value={purchases.paidTotal} />
        <SummaryCard label="STILL OPEN" value={purchases.openTotal} />
      </ul>

      {purchases.purchases.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-muted">Nothing in this workspace yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {purchases.purchases.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
    </div>
  );
};
