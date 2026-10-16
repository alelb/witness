import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DailyReportsChart from './DailyReportsChart.tsx';
import { DATA } from './testData.ts';

const TITLE = 'Killed over time';

// jsdom has no ResizeObserver; the chart's drawing is covered by `TimeSeriesChart.test.tsx`.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderChart(skippedRows = 0) {
  const latest = DATA.latest;
  if (latest === null) throw new Error('test data has no latest report');
  return render(
    <DailyReportsChart months={DATA.months} latest={latest} skippedRows={skippedRows} />,
  );
}

describe('DailyReportsChart', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a figure titled "Killed over time", with the date and the table note, and no source note', () => {
    renderChart();
    const figure = screen.getByRole('figure', { name: TITLE });
    expect(
      within(figure).getByText(
        'Gaza daily reports, last updated 14 January 2024. Days without a report are counted in the table.',
      ),
    ).toBeInTheDocument();
    expect(within(figure).queryByText(/Source:/)).not.toBeInTheDocument();
  });

  it('starts per month, and the toggle switches the mode, aria-pressed and the summary', () => {
    renderChart();
    const figure = screen.getByRole('figure', { name: TITLE });
    const perMonth = screen.getByRole('button', { name: 'Per month' });
    const cumulative = screen.getByRole('button', { name: 'Cumulative' });
    expect(within(screen.getByRole('group', { name: 'Chart' })).getAllByRole('button')).toEqual([
      perMonth,
      cumulative,
    ]);
    expect(perMonth).toHaveAttribute('aria-pressed', 'true');
    expect(cumulative).toHaveAttribute('aria-pressed', 'false');
    expect(figure).toHaveAccessibleDescription(
      'From October 2023 to January 2024 (to 14 January), 21,925 people were reported killed. ' +
        'The highest monthly figure was October 2023, with 8,525 people killed. ' +
        '1 month has no reported total.',
    );

    fireEvent.click(cumulative);
    expect(perMonth).toHaveAttribute('aria-pressed', 'false');
    expect(cumulative).toHaveAttribute('aria-pressed', 'true');
    expect(figure).toHaveAccessibleDescription(
      'The reported total rose from 8,525 at the end of October 2023 to 21,925 on 14 January 2024.',
    );

    fireEvent.click(perMonth);
    expect(perMonth).toHaveAttribute('aria-pressed', 'true');
    expect(figure).toHaveAccessibleDescription(/^From October 2023/);
  });

  it('lists every month in a collapsible table, with "No report", spans and the partial label', () => {
    renderChart();
    const details = screen.getByText('Figures by month').closest('details');
    expect(details).not.toHaveAttribute('open');
    const table = screen.getByRole('table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['Month', 'Killed', 'Cumulative', 'Days without report']);
    const rows = within(table)
      .getAllByRole('row')
      .slice(1)
      .map((row) => [...row.querySelectorAll('th, td')].map((cell) => cell.textContent));
    expect(rows).toEqual([
      ['October 2023', '8,525', '8,525', '2'],
      ['November 2023', 'No report', 'No report', '30'],
      ['December 2023Covers November 2023 to December 2023.', '13,000', '21,525', '0'],
      ['January 2024 (to 14 Jan)', '400', '21,925', '3'],
    ]);
  });

  it('keeps the table the same in both modes', () => {
    renderChart();
    const before = screen.getByRole('table').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Cumulative' }));
    expect(screen.getByRole('table').textContent).toBe(before);
  });

  it('notes the rows without a valid date only when there are some', () => {
    renderChart();
    expect(screen.queryByText(/without a valid date/)).not.toBeInTheDocument();
    renderChart(2);
    expect(screen.getByText('2 rows without a valid date were left out.')).toBeInTheDocument();
  });
});
