import { getDistribution, type DispatchRecord } from "@/lib/distribution";
import { EmptyRecord, RecordIntro, SummaryCard, recordPageClass } from "@/components/admin/record-page";

const DispatchCard = ({ dispatch }: { dispatch: DispatchRecord }) => {
  return (
    <article className="rounded-2xl border border-line bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold tracking-[-0.03em]">{dispatch.number}</h2>
        <p className="text-sm text-muted">{dispatch.delivery}</p>
      </div>
      <p className="mt-1 text-sm text-muted">
        {dispatch.shop} ·{" "}
        {dispatch.open ? (
          <span className="font-semibold text-[#9a4b32]">{dispatch.status}</span>
        ) : (
          dispatch.status
        )}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
              <th scope="col" className="pb-3 font-bold">
                Item
              </th>
              <th scope="col" className="pb-3 text-right font-bold">
                Quantity
              </th>
            </tr>
          </thead>
          <tbody>
            {dispatch.lines.map((line) => (
              <tr key={line.id} className="border-b border-line last:border-0">
                <th scope="row" className="py-3 pr-4 font-semibold">
                  {line.itemName}
                  {line.variant ? (
                    <span className="mt-0.5 block text-xs font-normal text-muted">{line.variant}</span>
                  ) : null}
                </th>
                <td className="py-3 text-right">{line.quantityLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
};

export const Distribution = async () => {
  const distribution = await getDistribution();

  return (
    <div className={recordPageClass}>
      <RecordIntro
        eyebrow="SENDING TO SHOPS"
        title="Distribution"
        description="Finished pieces already sent to shops. This list is a record only. Creating a dispatch comes later."
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Distribution summary">
        <SummaryCard label="DISPATCHES" value={distribution.count} />
        <SummaryCard label="NOT DELIVERED" value={distribution.openCount} />
        <SummaryCard label="PIECES SENT" value={distribution.piecesSent} />
      </ul>
      {distribution.dispatches.length === 0 ? (
        <EmptyRecord />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {distribution.dispatches.map((dispatch) => (
            <DispatchCard key={dispatch.id} dispatch={dispatch} />
          ))}
        </div>
      )}
    </div>
  );
};
