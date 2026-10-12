import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard, KpiCardSkeleton } from './KpiCard.tsx';

describe('KpiCard', () => {
  it('formats the value and names the figure by its label', () => {
    render(<KpiCard label="People killed" value={72_835} />);
    const figure = screen.getByRole('figure', { name: 'People killed' });
    expect(figure).toHaveTextContent('72,835');
  });

  it('renders the description and footer when given', () => {
    render(<KpiCard label="L" value={1} description="About this" footer={<p>Source</p>} />);
    expect(screen.getByText('About this')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('labels the figure with a heading, for heading navigation', () => {
    render(<KpiCard label="People killed" value={72_835} />);
    const heading = screen.getByRole('heading', { level: 2, name: 'People killed' });
    expect(screen.getByRole('figure', { name: 'People killed' })).toContainElement(heading);
  });

  it('renders the aside inside the figure, after the value and before the footer', () => {
    render(
      <KpiCard
        label="L"
        value={1}
        description="About this"
        aside={<p>Secondary</p>}
        footer={<p>Source</p>}
      />,
    );
    const figure = screen.getByRole('figure', { name: 'L' });
    const aside = within(figure).getByText('Secondary');
    const value = within(figure).getByText('1');
    const footer = within(figure).getByText('Source');
    expect(value.compareDocumentPosition(aside) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(aside.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('leaves the markup unchanged without an aside', () => {
    const { container } = render(<KpiCard label="L" value={1} description="D" footer="F" />);
    const figure = container.firstElementChild;
    expect(figure?.className.split(' ')).toHaveLength(1);
    expect(Array.from(figure?.children ?? [], (child) => child.tagName)).toEqual([
      'FIGCAPTION',
      'P',
      'DIV',
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

  it('shares the container classes of a card with an aside with the withAside skeleton', () => {
    const { container: card } = render(<KpiCard label="L" value={1} aside="A" />);
    const { container: skeleton } = render(<KpiCardSkeleton withAside />);
    const { container: plain } = render(<KpiCardSkeleton />);
    const cardClasses = card.firstElementChild?.className.split(' ') ?? [];
    expect(cardClasses).toHaveLength(2);
    expect(skeleton.firstElementChild).toHaveClass(...cardClasses);
    expect(plain.firstElementChild).not.toHaveClass(cardClasses[1] ?? 'missing');
  });
});
