import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeViews, navigateTo } from '../test/fakeViews.tsx';
import { App } from './App.tsx';

vi.mock('../hooks/useDataset.ts', () => ({
  useDataset: () => ({
    status: 'success',
    data: { demographics: { total: 72_835, bySex: [], byAgeBracket: [] }, summary: null },
    error: null,
    retry: () => {},
  }),
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

  it('shows no view menu with a single registered view, and titles the page after it', () => {
    render(<App />);
    expect(screen.queryByRole('navigation', { name: 'Views' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Gaza demographics' })).toBeInTheDocument();
    expect(document.title).toBe('Gaza demographics · Witness');
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
