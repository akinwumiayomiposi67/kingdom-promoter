/**
 * Format a number as Nigerian Naira currency.
 * @param {number} amount
 * @returns {string} e.g. "₦10,000.00"
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

export default formatCurrency;
