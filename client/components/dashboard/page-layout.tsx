import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {children}
    </div>
  );
}
