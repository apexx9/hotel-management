import { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

const SectionCard = ({
  title,
  eyebrow,
  description,
  action,
  children,
  className = "",
}: SectionCardProps) => {
  return (
    <section className={`border border-[#E8E8E8] bg-white ${className}`}>
      {(title || eyebrow || description || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-[#E8E8E8] px-5 py-4 sm:px-6">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                {eyebrow}
              </p>
            )}

            {title && (
              <h2 className="mt-1 text-[14px] font-bold tracking-tight text-[#0C0332]">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-[12px] font-medium leading-6 text-[#6B6B6B]">
                {description}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}

      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
};

export default SectionCard;

