import { getProduction } from "@/lib/production";

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <li className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.12em] text-[#829089]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </li>
  );
};

export const Production = async () => {
  const production = await getProduction();

  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#829089]">CUTTING AND STITCHING</p>
      <h1 className="text-[26px] font-semibold tracking-[-0.04em]">Production</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        Batches already on the floor. This list is a record only. Starting a new batch comes later.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Production summary">
        <SummaryCard label="BATCHES" value={production.count} />
        <SummaryCard label="OPEN" value={production.openCount} />
        <SummaryCard label="CLOTH IN OPEN BATCHES" value={production.openCloth} />
      </ul>

      {production.batches.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-muted">Nothing in this workspace yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white p-4 md:p-5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
                <th scope="col" className="pb-3 font-bold">
                  Batch
                </th>
                <th scope="col" className="pb-3 font-bold">
                  Makes
                </th>
                <th scope="col" className="pb-3 font-bold">
                  Stage
                </th>
                <th scope="col" className="pb-3 font-bold">
                  Cloth used
                </th>
                <th scope="col" className="pb-3 text-right font-bold">
                  Expected
                </th>
                <th scope="col" className="pb-3 text-right font-bold">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {production.batches.map((batch) => (
                <tr key={batch.id} className="border-b border-line last:border-0">
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    {batch.number}
                  </th>
                  <td className="py-3 pr-4">{batch.makes}</td>
                  <td className="py-3 pr-4">
                    {batch.open ? (
                      <span className="font-semibold text-[#9a4b32]">{batch.stage}</span>
                    ) : (
                      batch.stage
                    )}
                  </td>
                  <td className="py-3 pr-4">{batch.cloth}</td>
                  <td className="py-3 text-right">{batch.expected}</td>
                  <td className="py-3 text-right">{batch.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
