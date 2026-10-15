import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import styles from './ChartFrame.module.css';
import { ChartFrame, ChartFrameSkeleton } from './ChartFrame.tsx';

const TITLE = 'Sex of people identified by name';
const SUMMARY = 'Of 72,835 people identified by name, 50,959 (70.0%) are male.';

function renderFrame() {
  return render(
    <ChartFrame
      title={TITLE}
      description={<p>Killed in Gaza list, last updated 27 July 2026.</p>}
      summary={SUMMARY}
      rows={2}
      source={<p>Source: Killed in Gaza</p>}
    >
      <div data-testid="chart" />
    </ChartFrame>,
  );
}

describe('ChartFrame', () => {
  it('is a figure named by its title and described by its summary', () => {
    renderFrame();
    const figure = screen.getByRole('figure', { name: TITLE });
    expect(figure).toHaveAccessibleDescription(SUMMARY);
    expect(within(figure).getByTestId('chart')).toBeInTheDocument();
    expect(within(figure).getByText('Source: Killed in Gaza')).toBeInTheDocument();
  });

  it('titles the figure with a heading, for heading navigation', () => {
    renderFrame();
    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(screen.getByRole('figure', { name: TITLE })).toContainElement(heading);
  });

  it('keeps the source note as the last child of the frame', () => {
    renderFrame();
    const figure = screen.getByRole('figure', { name: TITLE });
    expect(figure.lastElementChild).toHaveTextContent('Source: Killed in Gaza');
  });

  it('keeps the summary for screen readers only, with no data table', () => {
    renderFrame();
    expect(screen.getByText(SUMMARY)).toHaveClass('visually-hidden');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ChartFrame without rows', () => {
  function renderTimeFrame() {
    return render(
      <ChartFrame
        title="Killed over time"
        summary="A summary."
        controls={<button type="button">Per month</button>}
        details={
          <details>
            <summary>Figures by month</summary>
          </details>
        }
        source={<p>Source: Gaza daily reports</p>}
      >
        <div data-testid="chart" />
      </ChartFrame>,
    );
  }

  it('gives the plot the fixed height, with no --rows', () => {
    renderTimeFrame();
    const plot = screen.getByTestId('chart').parentElement;
    expect(plot).toHaveClass(`${styles.plot}`, `${styles.plotFixed}`);
    expect(plot).not.toHaveAttribute('style');
  });

  it('renders the controls before the plot and the details between the plot and the source', () => {
    renderTimeFrame();
    const figure = screen.getByRole('figure', { name: 'Killed over time' });
    const children = [...figure.children];
    const controls = children.findIndex((el) => el.contains(screen.getByRole('button')));
    const plot = children.findIndex((el) => el.contains(screen.getByTestId('chart')));
    const details = children.findIndex((el) => el.contains(screen.getByText('Figures by month')));
    expect(controls).toBeLessThan(plot);
    expect(details).toBe(plot + 1);
    expect(figure.lastElementChild).toHaveTextContent('Source: Gaza daily reports');
  });

  it('renders no controls or details wrappers without them', () => {
    const { container } = renderFrame();
    expect(container.querySelector(`.${styles.controls}`)).toBeNull();
    expect(container.querySelector(`.${styles.details}`)).toBeNull();
  });
});

describe('ChartFrameSkeleton', () => {
  it("shares the frame's container class and plot height, hidden from assistive tech", () => {
    const { container: frame } = renderFrame();
    const { container: skeleton } = render(<ChartFrameSkeleton rows={2} />);
    const frameRoot = frame.querySelector('figure');
    const skeletonRoot = skeleton.firstElementChild;
    expect(skeletonRoot).toHaveAttribute('aria-hidden', 'true');
    expect(skeletonRoot?.className).toBe(frameRoot?.className);

    const framePlot = screen.getByTestId('chart').parentElement;
    const skeletonPlot = skeletonRoot?.querySelector('[style]');
    expect(skeletonPlot?.getAttribute('style')).toBe(framePlot?.getAttribute('style'));
    expect(skeletonPlot?.className).toContain(framePlot?.className ?? 'missing');
  });

  it('matches a frame without rows: fixed plot, and a bar for the controls and the details', () => {
    const { container } = render(<ChartFrameSkeleton controls details />);
    const root = container.firstElementChild;
    const plot = root?.querySelector(`.${styles.plotFixed}`);
    expect(plot).toHaveClass(`${styles.plot}`, `${styles.plotSkeleton}`);
    expect(plot).not.toHaveAttribute('style');
    // Title, description, controls, details, and source bars.
    expect(root?.querySelectorAll(`.${styles.bar}`)).toHaveLength(5);
    expect(root?.querySelectorAll(`.${styles.barTapTarget}`)).toHaveLength(3);
  });

  it('has only the source tap-target bar by default', () => {
    const { container } = render(<ChartFrameSkeleton rows={2} />);
    expect(container.querySelectorAll(`.${styles.barTapTarget}`)).toHaveLength(1);
  });
});
