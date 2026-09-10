import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  minHeight?: string;
}

export function EmptyState({ title, description, action, minHeight = "300px" }: EmptyStateProps) {
  return (
    <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12" style={{ minHeight }}>
      <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
        <Info className="h-6 w-6" />
      </div>
      <p className="text-lg font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}
