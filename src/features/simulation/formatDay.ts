/** Day counter is always three digits: 1 -> "001". */
export const formatDay = (day: number): string => String(day).padStart(3, '0');
