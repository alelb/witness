import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter.tsx';

describe('SiteFooter', () => {
  it('links the data attribution to the Tech for Palestine portal', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Tech for Palestine' })).toHaveAttribute(
      'href',
      'https://data.techforpalestine.org/',
    );
  });

  it('names the datasets in the source line when given', () => {
    render(<SiteFooter datasets="Gaza daily reports" />);
    expect(screen.getByText(/^Source: Gaza daily reports,/)).toHaveTextContent(
      'Source: Gaza daily reports, Tech for Palestine',
    );
  });

  it('falls back to "Data:" without datasets', () => {
    render(<SiteFooter />);
    expect(screen.getByText(/^Data:/)).toHaveTextContent('Data: Tech for Palestine');
  });

  it('shows the limitations note', () => {
    render(<SiteFooter />);
    expect(screen.getByText(/reported figures may undercount the real toll/i)).toBeInTheDocument();
  });

  it('has no link other than the data portal', () => {
    render(<SiteFooter />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
