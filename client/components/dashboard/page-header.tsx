import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface PageHeaderProps {
  badge: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ badge, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
      <div className="space-y-2">
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
        >
          {badge}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
            {description}
          </p>
        )}
        {action}
      </div>
    </div>
  );
}
