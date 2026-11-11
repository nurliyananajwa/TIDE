// Number and date formatting used across reports.

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const pct = (ratio: number, digits = 1) => `${(ratio * 100).toFixed(digits)}%`;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2020-12-16" → "16 Dec" */
export const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]}`;
/** "2020-12-16" → "16 Dec 2020" */
export const longDate = (iso: string) => `${shortDate(iso)} ${iso.slice(0, 4)}`;
