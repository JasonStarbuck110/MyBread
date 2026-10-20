// Approximate regular US equity market hours for the local classroom demo.
// Excludes weekends, but does not contain an exchange-holiday calendar.
export function duringRegularMarketHours() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York', weekday: 'short',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const value = (type) => parts.find((part) => part.type === type)?.value;
    if (['Sat', 'Sun'].includes(value('weekday'))) return false;
    const minutes = Number(value('hour')) * 60 + Number(value('minute'));
    return Number.isFinite(minutes) && minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}
