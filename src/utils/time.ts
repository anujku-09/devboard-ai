const DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: "seconds" },
    { amount: 60, unit: "minutes" },
    { amount: 24, unit: "hours" },
    { amount: 7, unit: "days" },
    { amount: 4.34524, unit: "weeks" },
    { amount: 12, unit: "months" },
    { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
});

/**
 * Formats an ISO timestamp as a human-readable relative time string,
 * e.g. "3 hours ago", "yesterday", "just now".
 */
export function formatRelativeTime(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    let duration = (date.getTime() - Date.now()) / 1000;

    if (Math.abs(duration) < 5) {
        return "Just now";
    }

    for (const division of DIVISIONS) {
        if (Math.abs(duration) < division.amount) {
            return relativeTimeFormatter.format(Math.round(duration), division.unit);
        }
        duration /= division.amount;
    }

    return relativeTimeFormatter.format(Math.round(duration), "years");
}
