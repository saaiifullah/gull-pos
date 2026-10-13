export const SectionPage = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => {
  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#829089]">{eyebrow}</p>
      <h1 className="text-[26px] font-semibold tracking-[-0.04em]">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
    </div>
  );
};
