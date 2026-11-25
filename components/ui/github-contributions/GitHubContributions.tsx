import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useReducedMotion } from '../colourist-reel-page/motion-preference';
import { calendarRange, calendarWeeks, contributionLabel, fetchContributions, formatContributionDate, type ContributionCalendar, type ContributionDay } from './github-data';
import { ReactiveGitHubCat } from './ReactiveGitHubCat';
import './styles.css';

type FeedState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; calendar: ContributionCalendar; refresh: 'idle' | 'pending' | 'failed' };

const REFRESH_MS = 10 * 60 * 1000;

function ContributionGraph({ calendar, active }: { calendar: ContributionCalendar; active: boolean }) {
  const weeks = useMemo(() => calendarWeeks(calendar.days), [calendar.days]);
  const [selected, setSelected] = useState(() => calendar.days.at(-1)?.date ?? '');
  const [hovered, setHovered] = useState<ContributionDay | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const selectedDay = calendar.days.find(day => day.date === selected) ?? calendar.days.at(-1);
  const day = hovered ?? selectedDay;
  const gridStyle: CSSProperties & { '--gh-weeks': number } = { '--gh-weeks': weeks.length };

  useEffect(() => {
    if (active && viewport.current) viewport.current.scrollLeft = viewport.current.scrollWidth;
  }, [active, calendar.days]);

  const navigate = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const index = calendar.days.findIndex(day => day.date === date);
    let next = index;
    if (event.key === 'ArrowLeft') next -= 7;
    else if (event.key === 'ArrowRight') next += 7;
    else if (event.key === 'ArrowUp') next -= 1;
    else if (event.key === 'ArrowDown') next += 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = calendar.days.length - 1;
    else return;
    event.preventDefault();
    const target = calendar.days[Math.max(0, Math.min(calendar.days.length - 1, next))];
    setSelected(target.date);
    setHovered(null);
    buttons.current.get(target.date)?.focus({ preventScroll: true });
    const cell = buttons.current.get(target.date);
    const frame = viewport.current;
    if (cell && frame) {
      const cellRect = cell.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      if (cellRect.left < frameRect.left + 32) frame.scrollLeft += cellRect.left - frameRect.left - 32;
      if (cellRect.right > frameRect.right - 8) frame.scrollLeft += cellRect.right - frameRect.right + 8;
    }
  };

  return <div className="q-gh-calendar" style={gridStyle}>
    <div className="q-gh-calendar-heading"><h3>Contribution calendar</h3><span>{calendarRange(calendar.days)}</span></div>
    <p className="q-gh-sr" id="github-calendar-help">Each square is one day. Use arrow keys to explore, Home for the first day and End for the latest day.</p>
    <div className="q-gh-calendar-viewport" ref={viewport} onPointerLeave={() => setHovered(null)}>
      <div className="q-gh-calendar-inner">
        <div className="q-gh-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
        <div className="q-gh-months" aria-hidden="true">{weeks.map((week, i) => <span key={i}>{week.label}</span>)}</div>
        <div className="q-gh-weeks" role="group" aria-label="Daily GitHub contributions" aria-describedby="github-calendar-help">
          {weeks.map((week, weekIndex) => <div className="q-gh-week" key={weekIndex}>{week.days.map((day, i) => day ? <button
            key={day.date} type="button" className="q-gh-day" data-level={day.level} data-selected={day.date === selectedDay?.date}
            tabIndex={day.date === selectedDay?.date ? 0 : -1} aria-label={contributionLabel(day)} aria-pressed={day.date === selectedDay?.date}
            title={contributionLabel(day)} ref={element => { if (element) buttons.current.set(day.date, element); else buttons.current.delete(day.date); }}
            onPointerEnter={() => setHovered(day)} onFocus={() => { setSelected(day.date); setHovered(null); }}
            onClick={() => { setSelected(day.date); setHovered(null); }} onKeyDown={event => navigate(event, day.date)}
          /> : <span key={`empty-${i}`} className="q-gh-empty" aria-hidden="true" />)}</div>)}
        </div>
      </div>
    </div>
    <div className="q-gh-calendar-bottom">
      <p className="q-gh-day-readout" aria-live="polite" aria-atomic="true">{day ? <><strong>{day.count.toLocaleString()} {day.count === 1 ? 'contribution' : 'contributions'}</strong><span>{formatContributionDate(day.date)}</span></> : 'Select a day to explore.'}</p>
      <div className="q-gh-legend" aria-label="Contribution intensity from less to more"><span>Less</span>{[0, 1, 2, 3, 4].map(level => <i key={level} data-level={level} />)}<span>More</span></div>
    </div>
    <p className="q-gh-swipe-hint">Swipe across the calendar to explore the year <span aria-hidden="true">↔</span></p>
  </div>;
}

/** The third chapter: a native calendar, fetched on entry and refreshed while visible. */
export function GitHubContributions({ username, active, onBack, onHome }: {
  username: string;
  active: boolean;
  onBack: () => void;
  onHome: () => void;
}) {
  const [feed, setFeed] = useState<FeedState>({ kind: 'loading' });
  const scroll = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const request = useRef<AbortController | null>(null);
  const fetchedAt = useRef(0);
  const reducedMotion = useReducedMotion();
  const entryFocusDelay = useRef(0);
  entryFocusDelay.current = reducedMotion ? 0 : 1300;

  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setFeed(previous => previous.kind === 'ready' ? { ...previous, refresh: 'pending' } : { kind: 'loading' });
    const timeout = window.setTimeout(() => controller.abort(new DOMException('The contribution request timed out.', 'TimeoutError')), 15_000);
    try {
      const calendar = await fetchContributions(username, controller.signal);
      if (controller.signal.aborted) return;
      fetchedAt.current = calendar.fetchedAt;
      setFeed({ kind: 'ready', calendar, refresh: 'idle' });
    } catch {
      // An interrupted navigation is not a feed failure. A timed-out request is.
      if (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError') return;
      setFeed(previous => previous.kind === 'ready' ? { ...previous, refresh: 'failed' } : { kind: 'error' });
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) request.current = null;
    }
  }, [username]);

  useEffect(() => {
    if (!active) return;
    const maybeRefresh = () => { if (!document.hidden && Date.now() - fetchedAt.current >= REFRESH_MS) void refresh(); };
    maybeRefresh();
    const interval = window.setInterval(maybeRefresh, REFRESH_MS);
    document.addEventListener('visibilitychange', maybeRefresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', maybeRefresh);
      request.current?.abort();
      request.current = null;
      setFeed(previous => previous.kind === 'ready' && previous.refresh === 'pending'
        ? { ...previous, refresh: 'idle' } : previous);
    };
  }, [active, refresh]);

  useEffect(() => {
    if (!active) return;
    scroll.current?.scrollTo({ top: 0 });
    const focus = window.setTimeout(() => {
      // Do not steal focus from a control used during entry or when motion preferences change.
      if (scroll.current?.contains(document.activeElement)) return;
      heading.current?.focus({ preventScroll: true });
    }, entryFocusDelay.current);
    return () => window.clearTimeout(focus);
  }, [active]);

  useEffect(() => {
    const content = scroll.current;
    if (!active || !content) return;
    let upward = 0;
    let lastWheel = 0;
    let startY: number | null = null;
    let startX = 0;
    let startedAtTop = false;
    // Match the lab's guard so a single trackpad fling cannot cross two chapters.
    const canReturnAfter = performance.now() + (reducedMotion ? 250 : 1300);
    const wheel = (event: WheelEvent) => {
      if (performance.now() < canReturnAfter || content.scrollTop > 1 || event.deltaY >= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) { upward = 0; return; }
      const now = performance.now();
      if (now - lastWheel > 220) upward = 0;
      lastWheel = now;
      upward -= event.deltaY;
      event.preventDefault();
      if (upward > 80) { upward = 0; onBack(); }
    };
    const touchStart = (event: TouchEvent) => { startY = event.touches[0]?.clientY ?? null; startX = event.touches[0]?.clientX ?? 0; startedAtTop = content.scrollTop <= 1; };
    const touchEnd = (event: TouchEvent) => {
      const end = event.changedTouches[0]?.clientY;
      const horizontal = Math.abs(startX - (event.changedTouches[0]?.clientX ?? startX));
      if (startY !== null && end !== undefined && horizontal < Math.abs(end - startY) && startedAtTop && end - startY > 90 && performance.now() > canReturnAfter) onBack();
      startY = null;
    };
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select, [contenteditable="true"]')) return;
      if (content.scrollTop <= 1 && ['ArrowUp', 'PageUp'].includes(event.key) && performance.now() > canReturnAfter) { event.preventDefault(); onBack(); }
    };
    content.addEventListener('wheel', wheel, { passive: false });
    content.addEventListener('touchstart', touchStart, { passive: true });
    content.addEventListener('touchend', touchEnd, { passive: true });
    content.addEventListener('keydown', key);
    return () => {
      content.removeEventListener('wheel', wheel);
      content.removeEventListener('touchstart', touchStart);
      content.removeEventListener('touchend', touchEnd);
      content.removeEventListener('keydown', key);
    };
  }, [active, onBack, reducedMotion]);

  const profile = `https://github.com/${encodeURIComponent(username)}`;
  return <section className="q-github-page" data-active={active} inert={!active} aria-labelledby="github-heading">
    <div className="q-github-scroll" ref={scroll} tabIndex={active ? 0 : -1}>
      <header className="q-gh-header"><div className="q-gh-brand"><ReactiveGitHubCat active={active} compact /><a href={profile} target="_blank" rel="noreferrer">{username}<span> / GitHub</span></a></div><button type="button" onClick={onBack}>Back to the lab <span aria-hidden="true">↑</span></button></header>
      <div className="q-gh-body">
        <div className="q-gh-eyebrow"><span>02 / Open source</span><span className="q-gh-source-status" data-connected={feed.kind === 'ready'}><i />{feed.kind === 'ready' ? 'Connected to GitHub' : feed.kind === 'loading' ? 'Connecting to GitHub' : 'Feed unavailable'}</span></div>
        <div className="q-gh-hero"><div><p className="q-gh-kicker">qvost on GitHub</p><h2 id="github-heading" ref={heading} tabIndex={-1}>Code and<br /><span>activity.</span></h2></div><div className="q-gh-hero-aside"><ReactiveGitHubCat active={active} /><p>My public contribution history.<br />Choose a day to see its activity.</p><a href={profile} target="_blank" rel="noreferrer">View my GitHub <span aria-hidden="true">↗</span></a></div></div>
        <div className="q-gh-feed" aria-busy={feed.kind === 'loading'}>
          {feed.kind === 'ready' ? <>
            <div className="q-gh-stats"><div><strong>{feed.calendar.total.toLocaleString()}</strong><span>contributions in the last year</span></div><div><strong>{feed.calendar.activeDays.toLocaleString()}</strong><span>days with contributions</span></div><div><strong>{feed.calendar.busiest.count.toLocaleString()}</strong><span>most contributions in a day</span></div></div>
            <ContributionGraph calendar={feed.calendar} active={active} />
          </> : <div className="q-gh-feed-placeholder" role="status"><div className="q-gh-placeholder-grid" aria-hidden="true">{Array.from({ length: 56 }, (_, i) => <i key={i} />)}</div><h3>{feed.kind === 'loading' ? 'Fetching the latest activity…' : 'GitHub is taking a moment.'}</h3><p>{feed.kind === 'loading' ? 'The calendar will appear when the feed arrives.' : 'The activity feed could not be reached. Try again or visit my profile.'}</p>{feed.kind === 'error' ? <button type="button" onClick={() => void refresh()}>Try again <span aria-hidden="true">↻</span></button> : null}</div>}
          <div className="q-gh-feed-footer"><p role="status">{feed.kind === 'ready' ? feed.refresh === 'failed' ? 'Refresh failed. Showing the last successful fetch.' : <>{feed.refresh === 'pending' ? 'Refreshing…' : <>Fetched at {new Date(feed.calendar.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</>} <span>Source updates about hourly.</span></> : 'Public contribution activity · No sign-in needed.'}</p><button type="button" onClick={() => void refresh()} disabled={feed.kind === 'loading' || (feed.kind === 'ready' && feed.refresh === 'pending')}>Refresh <span aria-hidden="true">↻</span></button></div>
        </div>
        <footer className="q-gh-footer"><p>Source code and contribution history.</p><a href={profile} target="_blank" rel="noreferrer">@{username} <span aria-hidden="true">↗</span></a><button type="button" onClick={onHome}>Back to the portfolio <span aria-hidden="true">↑</span></button></footer>
      </div>
      <nav className="q-gh-chapters" aria-label="Portfolio chapters"><button type="button" onClick={onHome}>00 <span>Portfolio</span></button><button type="button" onClick={onBack}>01 <span>The lab</span></button><span aria-current="page">02 <span>GitHub</span></span></nav>
    </div>
  </section>;
}
