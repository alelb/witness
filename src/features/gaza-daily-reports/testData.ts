import type { GazaDailyReportsData } from '../../data/worker/gazaDailyReports.ts';

// A short Gaza daily reports payload for view tests: a full month, a month without a report, a month whose figure
// spans it, and a partial last month.
export const DATA: GazaDailyReportsData = {
  months: [
    {
      month: '2023-10',
      killed: 8_525,
      killedCum: 8_525,
      daysWithoutReport: 2,
      partial: false,
      spansFrom: null,
    },
    {
      month: '2023-11',
      killed: null,
      killedCum: null,
      daysWithoutReport: 30,
      partial: false,
      spansFrom: null,
    },
    {
      month: '2023-12',
      killed: 13_000,
      killedCum: 21_525,
      daysWithoutReport: 0,
      partial: false,
      spansFrom: '2023-11',
    },
    {
      month: '2024-01',
      killed: 400,
      killedCum: 21_925,
      daysWithoutReport: 3,
      partial: true,
      spansFrom: null,
    },
  ],
  latest: { date: '2024-01-14', killedCum: 21_925, injuredCum: 56_000 },
  skippedRows: 0,
};
