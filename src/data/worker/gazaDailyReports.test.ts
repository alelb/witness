import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '../sources/__fixtures__/casualties-daily.sample.json';
import { CASUALTIES_DAILY_URL } from '../sources/casualtiesDaily.ts';
import { loaders } from './datasets.ts';
import { loadGazaDailyReports } from './gazaDailyReports.ts';

function stubFetch(response: () => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(response())),
  );
}

describe('loadGazaDailyReports', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the month buckets, the latest report and the skipped rows', async () => {
    stubFetch(() => new Response(JSON.stringify([...fixture, { report_date: 'bad' }])));
    const result = await loadGazaDailyReports();
    expect(fetch).toHaveBeenCalledWith(CASUALTIES_DAILY_URL, expect.anything());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.data).sort()).toEqual(['latest', 'months', 'skippedRows']);
    expect(result.data.months).toHaveLength(37);
    expect(result.data.latest).toEqual({
      date: '2026-10-14',
      killedCum: 74_392,
      injuredCum: 175_440,
    });
    expect(result.data.skippedRows).toBe(1);
  });

  it('passes a source error through', async () => {
    stubFetch(() => new Response('', { status: 503 }));
    await expect(loadGazaDailyReports()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'http', status: 503, url: CASUALTIES_DAILY_URL },
    });
  });

  it('posts aggregates only: no daily rows and no ext_* values', async () => {
    stubFetch(() => new Response(JSON.stringify(fixture)));
    const serialized = JSON.stringify(await loadGazaDailyReports());
    for (const leaked of ['report_date', 'ext_', '2023-10-13', 'mohtel', '1900']) {
      expect(serialized).not.toContain(leaked);
    }
  });

  it('is registered as the gaza-daily-reports dataset', async () => {
    stubFetch(() => new Response(JSON.stringify(fixture)));
    await expect(loaders['gaza-daily-reports']()).resolves.toMatchObject({
      ok: true,
      data: { latest: { killedCum: 74_392 } },
    });
  });
});
