import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeViews } from '../test/fakeViews.tsx';
import { ViewNav } from './ViewNav.tsx';

describe('ViewNav', () => {
  it('renders a link per view, in order, marking only the current one', () => {
    render(<ViewNav views={fakeViews} currentId="second" />);
    const links = within(screen.getByRole('navigation', { name: 'Views' })).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['First view', 'Second view']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#/first', '#/second']);
    expect(links[0]).not.toHaveAttribute('aria-current');
    expect(links[1]).toHaveAttribute('aria-current', 'page');
  });
});
