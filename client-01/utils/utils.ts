export const date = new Date().getFullYear();
export const version: string = "1.0";

export function cn(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency = "GHS",
) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(
  value: number | string | null | undefined,
) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-GH").format(
    Number.isFinite(amount) ? amount : 0,
  );
}

export function formatDateTime(
  value: string | Date | null | undefined,
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDate(
  value: string | Date | null | undefined,
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "U",
) {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";

  const initials = `${first}${last}`.toUpperCase();

  return initials || fallback
};
