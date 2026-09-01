"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-[#0C0332]">
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 max-w-2xl text-sm font-medium leading-6 text-[#6B6B6B]">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
};

export default PageHeader;

