export const formatCurrency = (amount: number, locale = 'en-IN', currency = 'INR') => {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 2
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
};
