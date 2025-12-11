import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { GlobalLoading } from './GlobalLoading';
import { useLoading } from './calendar/Provider';

// Mock the useLoading hook
vi.mock('./calendar/Provider', () => ({
  useLoading: vi.fn(),
}));

describe('GlobalLoading', () => {
  it('renders nothing when isLoading is false', () => {
    (useLoading as Mock).mockReturnValue({ isLoading: false });
    const { container } = render(<GlobalLoading />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders loading spinner when isLoading is true', () => {
    (useLoading as Mock).mockReturnValue({ isLoading: true });
    render(<GlobalLoading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
