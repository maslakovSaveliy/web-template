import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('announces its label as a status', () => {
    render(<Spinner label="Loading results" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading results');
  });

  it('is hidden from assistive tech when decorative', () => {
    const { container } = render(<Spinner decorative />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
