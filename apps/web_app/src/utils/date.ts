import { format, parseISO } from 'date-fns';

export const formatDate = (date: Date | string, formatString = 'dd MMM yyyy') => {
    if (!date) return '-';
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    try {
        return format(parsedDate, formatString);
    } catch {
        return '-';
    }
};

export const formatDateTime = (date: Date | string) => {
    return formatDate(date, 'dd MMM yyyy, hh:mm a');
};
export default formatDate;
