export type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type ContributionCalendar = {
  days: ContributionDay[];
  total: number;
  activeDays: number;
  busiest: ContributionDay;
  fetchedAt: number;
};

const DAY_MS = 86_400_000;

// Parse the public feed here; the calendar never receives unverified JSON.
function parseDay(value: unknown): ContributionDay {
  if (typeof value !== 'object' || value === null ||
    !('date' in value) || !('count' in value) || !('level' in value)) {
    throw new Error('The contribution feed returned an incomplete day.');
  }
  const { date, count, level } = value;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date ||
    typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0 ||
    (level !== 0 && level !== 1 && level !== 2 && level !== 3 && level !== 4)) {
    throw new Error('The contribution feed returned an invalid day.');
  }
  return { date, count, level };
}

export async function fetchContributions(username: string, signal: AbortSignal): Promise<ContributionCalendar> {
  const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`, {
    signal,
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`The contribution feed is unavailable (${response.status}).`);
  const value: unknown = await response.json();
  if (typeof value !== 'object' || value === null || !('contributions' in value) || !Array.isArray(value.contributions)) {
    throw new Error('The contribution feed returned an unexpected response.');
  }
  const days = value.contributions.map(parseDay).sort((a, b) => a.date.localeCompare(b.date));
  const first = days[0];
  if (!first || days.length > 400) throw new Error('The contribution calendar is unavailable.');
  for (let i = 1; i < days.length; i++) {
    if (Date.parse(days[i].date) - Date.parse(days[i - 1].date) !== DAY_MS) {
      throw new Error('The contribution feed returned an incomplete calendar.');
    }
  }
  return {
    days,
    total: days.reduce((sum, day) => sum + day.count, 0),
    activeDays: days.filter(day => day.count > 0).length,
    busiest: days.reduce((best, day) => day.count >= best.count ? day : best, first),
    fetchedAt: Date.now(),
  };
}

const dayFormatter = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });
const rangeFormatter = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export const formatContributionDate = (date: string) => dayFormatter.format(new Date(date));
export const contributionLabel = (day: ContributionDay) => `${day.count.toLocaleString()} contribution${day.count === 1 ? '' : 's'} on ${formatContributionDate(day.date)}`;

export function calendarWeeks(days: ContributionDay[]) {
  const first = days[0];
  if (!first) return [];
  const offset = new Date(first.date).getUTCDay();
  const cells: (ContributionDay | null)[] = [...Array.from<null>({ length: offset }).fill(null), ...days];
  const weeks: { label: string; days: (ContributionDay | null)[] }[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    // A month starts in the week containing its first day, even if that week starts in the previous month.
    // Omit a short leading month so adjacent labels cannot collide at the left edge.
    const monthStart = week.find(day => day?.date.endsWith('-01'));
    const labelDay = monthStart ?? (i === 0 && new Date(first.date).getUTCDate() <= 14 && week.filter(Boolean).length >= 4 ? first : null);
    const label = labelDay ? monthFormatter.format(new Date(labelDay.date)) : '';
    weeks.push({ label, days: week });
  }
  return weeks;
}

export function calendarRange(days: ContributionDay[]) {
  const first = days[0];
  const last = days.at(-1);
  return first && last ? `${rangeFormatter.format(new Date(first.date))} to ${rangeFormatter.format(new Date(last.date))}` : '';
}
