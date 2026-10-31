import { describe, it, expect } from 'vitest';
import {
  getTimezoneFromCepOrState,
  getStoreTimezone,
  getTodayRangeUtc,
  isOrderFromToday,
  formatOrderTime,
  getUtcDateForLocalTime,
} from './date-timezone';

describe('date-timezone utilities', () => {
  it('should detect timezone based on state or CEP', () => {
    expect(getTimezoneFromCepOrState(null, 'MS')).toBe('America/Campo_Grande');
    expect(getTimezoneFromCepOrState(null, 'SP')).toBe('America/Sao_Paulo');
    expect(getTimezoneFromCepOrState(null, 'AC')).toBe('America/Rio_Branco');
    expect(getTimezoneFromCepOrState(null, 'MT')).toBe('America/Cuiaba');
    expect(getTimezoneFromCepOrState('79000-000', null)).toBe('America/Campo_Grande');
    expect(getTimezoneFromCepOrState('01001-000', null)).toBe('America/Sao_Paulo');
  });

  it('should get store timezone with fallback', () => {
    expect(getStoreTimezone(null)).toBe('America/Campo_Grande');
    expect(getStoreTimezone({ state: 'MS' })).toBe('America/Campo_Grande');
    expect(getStoreTimezone({ state: 'RJ' })).toBe('America/Sao_Paulo');
  });

  it('should calculate local start and end of day in UTC correctly', () => {
    const timeZone = 'America/Campo_Grande';
    const range = getTodayRangeUtc(timeZone);

    expect(range.startDateIso).toBeDefined();
    expect(range.endDateIso).toBeDefined();
    expect(range.todayYmd).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const start = new Date(range.startDateIso);
    const end = new Date(range.endDateIso);

    // Verify difference is ~24 hours
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(24, 0);

    // In local timezone, start should be 00:00 and end should be 23:59
    const localStartFormatted = formatOrderTime(start, timeZone);
    expect(localStartFormatted).toBe('00:00');

    const localEndFormatted = formatOrderTime(end, timeZone);
    expect(localEndFormatted).toBe('23:59');
  });

  it('should identify whether an order belongs to today in local timezone', () => {
    const timeZone = 'America/Campo_Grande';
    const range = getTodayRangeUtc(timeZone);

    // Midday today in local timezone
    const midDayUtc = getUtcDateForLocalTime(range.todayYmd, '12:00:00.000', timeZone);
    expect(isOrderFromToday(midDayUtc, timeZone, range.todayYmd)).toBe(true);

    // Yesterday midday
    const yesterday = new Date(midDayUtc.getTime() - 25 * 60 * 60 * 1000);
    expect(isOrderFromToday(yesterday, timeZone, range.todayYmd)).toBe(false);
  });

  it('should format order time formatted as HH:mm in store timezone', () => {
    const timeZone = 'America/Campo_Grande';
    // 15:30 in Campo Grande (UTC-4) -> 19:30 UTC
    const dateUtc = new Date('2026-10-31T19:30:00.000Z');
    expect(formatOrderTime(dateUtc, timeZone)).toBe('15:30');
  });
});
