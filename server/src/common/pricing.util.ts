export const money = (value: unknown) => Number(value ?? 0);

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const formatReference = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const formatMoney = (value: unknown, currency: string): string =>
  `${currency} ${money(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function resolvePricingValue(
  amount: number,
  mode: 'value' | 'percentage' | undefined,
  value: number,
) {
  if (mode === 'percentage') {
    return roundMoney((amount * money(value)) / 100);
  }
  return roundMoney(money(value));
}

export function computeTotals(payload: {
  rate: number;
  nights: number;
  discount?: number;
  taxes?: number;
  serviceTotal?: number;
}) {
  const subtotal = roundMoney(payload.rate * payload.nights);
  const discount = roundMoney(payload.discount ?? 0);
  const taxes = roundMoney(payload.taxes ?? 0);
  const serviceTotal = roundMoney(payload.serviceTotal ?? 0);
  const total = roundMoney(subtotal - discount + taxes + serviceTotal);
  return { subtotal, discount, taxes, serviceTotal, total };
}