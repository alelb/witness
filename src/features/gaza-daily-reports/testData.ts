import type { GazaDailyReportsData } from '../../data/worker/gazaDailyReports.ts';

// A short Gaza daily reports payload for view tests: a full month, a month without a report, a month whose figure
// spans it, and a partial last month.
export const DATA: GazaDailyReportsData = {
  months: [
    {
      month: '2023-10',
      killed: 8_525,
      killedCum: 8_525,
      partial: false,
      spansFrom: null,
    },
    {
      month: '2023-11',
      killed: null,
      killedCum: null,
      partial: false,
      spansFrom: null,
    },
    {
      month: '2023-12',
      killed: 13_000,
      killedCum: 21_525,
      partial: false,
      spansFrom: '2023-11',
    },
    {
      month: '2024-01',
      killed: 400,
      killedCum: 21_925,
      partial: true,
      spansFrom: null,
    },
  ],
  latest: { date: '2024-01-14', killedCum: 21_925, injuredCum: 56_000 },
  skippedRows: 0,
};
