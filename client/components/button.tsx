import { Button as ShadcnButton } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<ComponentProps<typeof ShadcnButton>, 'variant'> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link" | "primary";
  text?: string;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  text,
  isLoading,
  children,
  className,
  disabled,
  fullWidth = true,
  ...props
}: ButtonProps) {
  const isPrimary = variant === "primary" || variant === "default";

  return (
    <ShadcnButton
      variant="default"
      className={cn(
        "h-12 rounded-full text-[15px] font-bold tracking-wide transition-all",
        fullWidth ? "w-full" : "px-6",
        isPrimary
          ? "bg-[#1900FF] text-white shadow-lg shadow-[#1900FF]/30 hover:bg-[#1400E0] hover:shadow-xl hover:shadow-[#1900FF]/40 active:scale-[0.98]"
          : cn(
              variant === "outline" &&
                "border-slate-300 bg-white text-[#0C0332] shadow-sm hover:bg-slate-50",
            ),
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {text || children}
    </ShadcnButton>
  );
}