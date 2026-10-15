import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeViews, navigateTo } from '../test/fakeViews.tsx';
import { App } from './App.tsx';

// The Gaza over time view only renders its loading state here: its data is covered by its own tests.
vi.mock('../hooks/useDataset.ts', () => ({
  useDataset: (id: string) =>
    id === 'gaza-demographics'
      ? {
          status: 'success',
          data: { demographics: { total: 72_835, bySex: [], byAgeBracket: [] }, summary: null },
          error: null,
          retry: () => {},
        }
      : { status: 'loading', data: null, error: null, retry: () => {} },
}));

beforeEach(() => {
  history.replaceState(null, '', '/');
  // jsdom does not implement scrolling.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the "Witness" heading and intro line', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Witness' })).toBeInTheDocument();
    expect(screen.getByText(/open data bearing witness/i)).toBeInTheDocument();
  });

  it('renders the Gaza demographics view in the main landmark', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(
      within(main).getByRole('figure', { name: 'People killed in Gaza identified by name' }),
    ).toHaveTextContent('72,835');
  });

  it('renders the skip link as the first link, targeting #main', () => {
    render(<App />);
    const [firstLink] = screen.getAllByRole('link');
    expect(firstLink).toHaveTextContent('Skip to content');
    expect(firstLink).toHaveAttribute('href', '#main');
  });

  it('renders the footer inside the contentinfo landmark', () => {
    render(<App />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/may undercount the real toll/i);
  });

  it('shows the Views menu with both registered views, Gaza demographics by default', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Views' });
    const demographics = within(nav).getByRole('link', { name: 'Gaza demographics' });
    const overTime = within(nav).getByRole('link', { name: 'Gaza over time' });
    expect(within(nav).getAllByRole('link')).toEqual([demographics, overTime]);
    expect(demographics).toHaveAttribute('href', '#/killed-in-gaza');
    expect(overTime).toHaveAttribute('href', '#/gaza-daily-reports');
    expect(demographics).toHaveAttribute('aria-current', 'page');
    expect(overTime).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('region', { name: 'Gaza demographics' })).toBeInTheDocument();
    expect(document.title).toBe('Gaza demographics · Witness');
  });

  it('renders Gaza over time from its hash, and titles the page after it', () => {
    history.replaceState(null, '', '#/gaza-daily-reports');
    render(<App />);
    expect(screen.getByRole('region', { name: 'Gaza over time' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Gaza demographics' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gaza over time' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(document.title).toBe('Gaza over time · Witness');
  });

  it('moves focus to main and leaves the URL unchanged when the skip link is used', () => {
    history.replaceState(null, '', '#/killed-in-gaza');
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(location.hash).toBe('#/killed-in-gaza');
  });
});

describe('App with two views', () => {
  it('shows a menu with a link per view, marking the current one', () => {
    render(<App views={fakeViews} />);
    const nav = screen.getByRole('navigation', { name: 'Views' });
    const first = within(nav).getByRole('link', { name: 'First view' });
    const second = within(nav).getByRole('link', { name: 'Second view' });
    expect(first).toHaveAttribute('href', '#/first');
    expect(second).toHaveAttribute('href', '#/second');
    expect(first).toHaveAttribute('aria-current', 'page');
    expect(second).not.toHaveAttribute('aria-current');
  });

  it('does not move focus on the first render', () => {
    render(<App views={fakeViews} />);
    expect(screen.getByRole('main')).not.toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('renders the other view on a hash change, moves focus to main, and updates the title', () => {
    render(<App views={fakeViews} />);
    act(() => navigateTo('#/second'));
    expect(screen.getByRole('region', { name: 'Second view' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'First view' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Second view' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.title).toBe('Second · Witness');
  });
});
