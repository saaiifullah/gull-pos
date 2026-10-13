export const recordPageClass = "mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8";

export const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <li className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.12em] text-[#829089]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </li>
  );
};

export const RecordIntro = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => {
  return (
    <>
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#829089]">{eyebrow}</p>
      <h1 className="text-[26px] font-semibold tracking-[-0.04em]">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
    </>
  );
};

export const EmptyRecord = () => {
  return <p className="mt-4 text-sm leading-6 text-muted">Nothing in this workspace yet.</p>;
};
