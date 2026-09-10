import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<typeof ShadcnInput> {
  error?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string;
  onValueChange?: (value: any) => void;
}

export default function Input({
  error,
  className,
  type,
  label,
  id,
  ...props
}: InputProps) {
  const inputType = type === "pass" ? "password" : type ?? "text";
  const inputId =
    id ??
    (label
      ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : undefined);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-[#0C0332]"
        >
          {label}
        </label>
      )}
      <ShadcnInput
        id={inputId}
        type={inputType}
        className={cn(
          "h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-[#0C0332] shadow-sm transition-all",
          "placeholder:text-slate-400 hover:border-slate-300",
          "focus-visible:border-[#1900FF] focus-visible:ring-4 focus-visible:ring-[#1900FF]/15",
          error
            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/15"
            : undefined,
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}