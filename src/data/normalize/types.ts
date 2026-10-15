// Domain types produced by normalizers. Pure TypeScript: no React, no DOM, no network.

export type Sex = 'male' | 'female' | 'unknown';

export interface DomainRecord {
  sex: Sex;
  /** Age in years, or `null` when missing or unparseable. */
  age: number | null;
}

/** One day of the Gaza daily reports. Counts are cumulative, reported values only (never extrapolated). */
export interface DailyReport {
  /** `YYYY-MM-DD`. */
  date: string;
  /** `true` when a known source published a report covering this day. */
  reported: boolean;
  /** Reported cumulative killed, or `null` on a day without a report or without a valid value. */
  killedCum: number | null;
  /** Reported cumulative injured; same rule as `killedCum`. */
  injuredCum: number | null;
}
