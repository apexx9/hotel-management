export interface StatusColors {
  bg: string;
  text: string;
  border: string;
}

export const roomStatusColors: Record<string, StatusColors> = {
  available: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  occupied: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  cleaning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-500", border: "border-amber-500/20" },
  inspection: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  maintenance: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
  out_of_service: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
  reserved: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
};

export const invoiceStatusColors: Record<string, StatusColors> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  issued: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  partially_paid: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  paid: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
};

export const paymentStatusColors: Record<string, StatusColors> = {
  paid: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  partial: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  overdue: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  reversed: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
};

export const paymentMethodColors: Record<string, StatusColors> = {
  cash: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  mobile_money: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  card: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  bank_transfer: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300" },
};

export const notificationTypeColors: Record<string, StatusColors> = {
  checkout_completed: { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20" },
  checkout_overdue: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20" },
  payment_outstanding: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-500", border: "border-amber-500/20" },
  room_ready: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  room_unavailable: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400", border: "border-gray-500/20" },
  maintenance_issue: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20" },
  new_booking: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  guest_arrival: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
  service_charge_added: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
};
