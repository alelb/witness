import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard, KpiCardSkeleton } from './KpiCard.tsx';

describe('KpiCard', () => {
  it('formats the value and names the figure by its label', () => {
    render(<KpiCard label="People killed" value={72_835} />);
    const figure = screen.getByRole('figure', { name: 'People killed' });
    expect(figure).toHaveTextContent('72,835');
  });

  it('renders the description when given', () => {
    render(<KpiCard label="L" value={1} description="About this" />);
    expect(screen.getByText('About this')).toBeInTheDocument();
  });

  it('labels the figure with a heading, for heading navigation', () => {
    render(<KpiCard label="People killed" value={72_835} />);
    const heading = screen.getByRole('heading', { level: 2, name: 'People killed' });
    expect(screen.getByRole('figure', { name: 'People killed' })).toContainElement(heading);
  });

  it('renders the aside inside the figure, after the value and the description', () => {
    render(<KpiCard label="L" value={1} description="About this" aside={<p>Secondary</p>} />);
    const figure = screen.getByRole('figure', { name: 'L' });
    const aside = within(figure).getByText('Secondary');
    const description = within(figure).getByText('About this');
    expect(
      description.compareDocumentPosition(aside) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(figure.lastElementChild).toContainElement(aside);
  });

  it('leaves the markup unchanged without an aside', () => {
    const { container } = render(<KpiCard label="L" value={1} description="D" />);
    const figure = container.firstElementChild;
    expect(figure?.className.split(' ')).toHaveLength(1);
    expect(Array.from(figure?.children ?? [], (child) => child.tagName)).toEqual([
      'FIGCAPTION',
      'P',
      'DIV',
    ]);
  });

  it('shares the container class with the skeleton', () => {
    const { container: card } = render(<KpiCard label="L" value={1} />);
    const { container: skeleton } = render(<KpiCardSkeleton />);
    const cardClass = card.firstElementChild?.className;
    expect(cardClass).toBeTruthy();
    expect(skeleton.firstElementChild).toHaveClass(cardClass ?? '');
    expect(skeleton.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
