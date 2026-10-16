import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from './__fixtures__/casualties-daily.sample.json';
import {
  CASUALTIES_DAILY_URL,
  fetchCasualtiesDaily,
  findShapeProblem,
  toDailyRows,
} from './casualtiesDaily.ts';

function stubFetchJson(body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
}

describe('findShapeProblem', () => {
  it('accepts the fixture and an empty array', () => {
    expect(findShapeProblem(fixture)).toBeUndefined();
    expect(findShapeProblem([])).toBeUndefined();
  });

  it.each([
    ['an object', { rows: [] }, 'not an array'],
    ['a string', '[]', 'not an array'],
    ['null', null, 'not an array'],
    ['a null row', [{ report_date: '2023-10-07' }, null], 'Row 1'],
    ['an array row', [['2023-10-07', 'mohtel']], 'Row 0'],
    ['a number row', [{}, {}, 3], 'Row 2'],
  ])('rejects %s', (_label, value, message) => {
    expect(findShapeProblem(value)).toContain(message);
  });
});

describe('toDailyRows', () => {
  it('picks the five fields of each row, in order', () => {
    const rows = toDailyRows(fixture);
    expect(rows).toHaveLength(fixture.length);
    expect(rows[0]).toEqual({
      reportDate: '2023-10-07',
      reportSource: 'mohtel',
      reportPeriod: 24,
      killedCum: 232,
      injuredCum: 1610,
    });
    expect(rows.at(-1)).toEqual({
      reportDate: '2026-10-14',
      reportSource: 'mohtel',
      reportPeriod: 24,
      killedCum: 74_392,
      injuredCum: 175_440,
    });
  });

  it('keeps absent fields as undefined and passes values through untouched', () => {
    expect(toDailyRows([{ report_date: 7, killed_cum: '12' }, {}])).toEqual([
      {
        reportDate: 7,
        reportSource: undefined,
        reportPeriod: undefined,
        killedCum: '12',
        injuredCum: undefined,
      },
      {
        reportDate: undefined,
        reportSource: undefined,
        reportPeriod: undefined,
        killedCum: undefined,
        injuredCum: undefined,
      },
    ]);
  });

  it('never reads the ext_* fields', () => {
    // Only extrapolated values: nothing of them may reach a row.
    const [row] = toDailyRows([
      { report_date: '2023-10-13', report_source: 'missing', ext_killed_cum: 1900 },
    ]);
    expect(row?.killedCum).toBeUndefined();
    for (const row of toDailyRows(fixture)) {
      expect(Object.keys(row).sort()).toEqual([
        'injuredCum',
        'killedCum',
        'reportDate',
        'reportPeriod',
        'reportSource',
      ]);
    }
  });
});

describe('fetchCasualtiesDaily', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the v2 endpoint and returns daily rows', async () => {
    stubFetchJson(fixture);
    const result = await fetchCasualtiesDaily();
    expect(fetch).toHaveBeenCalledWith(CASUALTIES_DAILY_URL, expect.anything());
    expect(result.ok && result.data).toHaveLength(fixture.length);
  });

  it.each([
    ['a non-array', { rows: [] }, 'not an array'],
    ['a non-object row', [{ report_date: '2023-10-07' }, 'x'], 'Row 1'],
  ])('maps %s to a shape error', async (_label, body, message) => {
    stubFetchJson(body);
    await expect(fetchCasualtiesDaily()).resolves.toMatchObject({
      ok: false,
      error: {
        kind: 'shape',
        url: CASUALTIES_DAILY_URL,
        message: expect.stringContaining(message),
      },
    });
  });

  it('passes http, network and parse errors through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(fetchCasualtiesDaily()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'http', status: 503 },
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchCasualtiesDaily()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'network' },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')));
    await expect(fetchCasualtiesDaily()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'parse' },
    });
  });

  it('lets no ext_* field leave the module', async () => {
    stubFetchJson(fixture);
    const serialized = JSON.stringify(await fetchCasualtiesDaily());
    expect(serialized).not.toContain('ext_');
    expect(serialized).not.toContain('killed_children_cum');
  });
});
