import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PageErrorProps {
  message: string;
}

export function PageError({ message }: PageErrorProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Alert
        variant="destructive"
        className="rounded-2xl border-destructive/30 bg-destructive/10"
      >
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="font-semibold">System Notice</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}
