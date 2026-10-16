import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import kpiStyles from '../../components/KpiCard.module.css';
import type { GazaDailyReportsData } from '../../data/worker/gazaDailyReports.ts';
import { useDataset, type UseDatasetResult } from '../../hooks/useDataset.ts';
import { GazaDailyReportsView } from './GazaDailyReportsView.tsx';
import { DATA } from './testData.ts';

vi.mock('../../hooks/useDataset.ts', () => ({ useDataset: vi.fn() }));

const LABEL = 'People killed in Gaza since 7 October 2023';
const CHART_TITLE = 'Killed over time';

const retry = vi.fn();

function mockDataset(result: Partial<UseDatasetResult<GazaDailyReportsData>>) {
  vi.mocked(useDataset).mockReturnValue({
    status: 'success',
    data: null,
    error: null,
    retry,
    ...result,
  });
}

// jsdom has no ResizeObserver; the chart's drawing is covered by `TimeSeriesChart.test.tsx`.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('GazaDailyReportsView', () => {
  // The first import of the lazy chart chunk (Recharts) is slow in jsdom: load it once, outside `findBy` timeouts.
  beforeAll(async () => {
    await import('./DailyReportsChart.tsx');
  });

  beforeEach(() => {
    retry.mockReset();
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the gaza-daily-reports dataset and shows the KPI and chart skeletons while loading', () => {
    mockDataset({ status: 'loading' });
    const { container } = render(<GazaDailyReportsView />);
    expect(useDataset).toHaveBeenCalledWith('gaza-daily-reports');
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).toBeInTheDocument();
    expect(busy?.querySelectorAll(':scope > div > [aria-hidden="true"]')).toHaveLength(2);
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('shows the error with a working Retry', () => {
    mockDataset({ status: 'error', error: { kind: 'network', message: 'Failed to fetch' } });
    render(<GazaDailyReportsView />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('shows the empty state without a reported total', () => {
    mockDataset({ data: { ...DATA, latest: null } });
    render(<GazaDailyReportsView />);
    expect(
      screen.getByText('No records are available in this dataset right now.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('shows the latest reported total, its date and the injured aside, with no source note', async () => {
    mockDataset({ data: DATA });
    render(<GazaDailyReportsView />);
    const card = screen.getByRole('figure', { name: LABEL });
    expect(within(card).getByText('21,925')).toBeInTheDocument();
    expect(
      within(card).getByText('From Gaza daily reports, last updated 14 January 2024.'),
    ).toBeInTheDocument();
    expect(card.querySelector(`.${kpiStyles.aside}`)).toHaveTextContent(/^56,000 injured$/);
    expect(card.lastElementChild).toHaveTextContent(/^56,000 injured$/);
    expect(within(card).queryByText(/Source:/)).not.toBeInTheDocument();
    // The card first, then the chart.
    const chart = await screen.findByRole('figure', { name: CHART_TITLE });
    expect(screen.getAllByRole('figure')).toEqual([card, chart]);
    expect(screen.getByRole('region', { name: 'Gaza over time' })).toContainElement(chart);
  });

  it('leaves out the injured aside without an injured total', async () => {
    const latest = { date: '2024-01-14', killedCum: 21_925, injuredCum: null };
    mockDataset({ data: { ...DATA, latest } });
    render(<GazaDailyReportsView />);
    const card = screen.getByRole('figure', { name: LABEL });
    expect(card.querySelector(`.${kpiStyles.aside}`)).not.toBeInTheDocument();
    expect(screen.queryByText(/injured/)).not.toBeInTheDocument();
    await screen.findByRole('figure', { name: CHART_TITLE });
  });
});

describe('GazaDailyReportsView when the chart chunk fails to load', () => {
  afterEach(() => {
    vi.doUnmock('./DailyReportsChart.tsx');
    vi.resetModules();
  });

  it('keeps the KPI and shows the error with Retry in the chart area', async () => {
    vi.resetModules();
    vi.doMock('./DailyReportsChart.tsx', () => {
      throw new Error('Failed to fetch dynamically imported module');
    });
    const { useDataset: mockedUseDataset } = await import('../../hooks/useDataset.ts');
    vi.mocked(mockedUseDataset).mockReturnValue({
      status: 'success',
      data: DATA,
      error: null,
      retry,
    });
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    const { GazaDailyReportsView: View } = await import('./GazaDailyReportsView.tsx');

    render(<View />);
    await screen.findByRole('alert');
    expect(screen.getByRole('figure', { name: LABEL })).toHaveTextContent('21,925');
    expect(screen.queryByText(/dynamically imported/)).not.toBeInTheDocument();

    vi.doUnmock('./DailyReportsChart.tsx');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('figure', { name: CHART_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(retry).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
