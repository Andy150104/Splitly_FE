export function formatCurrency(
  value = 0,
  currency = "VND",
  locale = "vi-VN",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}
