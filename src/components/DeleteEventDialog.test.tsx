import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { DeleteEventDialog } from './DeleteEventDialog';
import { useEvents } from './calendar/Provider';

// Mock the useEvents hook
vi.mock('./calendar/Provider', () => ({
  useEvents: vi.fn(),
}));

describe('DeleteEventDialog', () => {
  const onOpenChangeMock = vi.fn();
  const onConfirmMock = vi.fn();

  beforeEach(() => {
    (useEvents as Mock).mockReturnValue({
      selectedEvent: { title: 'Test Event', id: '1' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog when open is true', () => {
    render(
      <DeleteEventDialog open={true} onOpenChange={onOpenChangeMock} onConfirm={onConfirmMock} />
    );
    expect(screen.getByText('Delete Event')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this event? This action cannot be undone.')
    ).toBeInTheDocument();
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('does not render the dialog when open is false', () => {
    render(
      <DeleteEventDialog open={false} onOpenChange={onOpenChangeMock} onConfirm={onConfirmMock} />
    );
    expect(screen.queryByText('Delete Event')).not.toBeInTheDocument();
  });

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    render(
      <DeleteEventDialog open={true} onOpenChange={onOpenChangeMock} onConfirm={onConfirmMock} />
    );
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
  });

  it('calls onConfirm and onOpenChange(false) when Delete is clicked', () => {
    render(
      <DeleteEventDialog open={true} onOpenChange={onOpenChangeMock} onConfirm={onConfirmMock} />
    );
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    expect(onConfirmMock).toHaveBeenCalled();
    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
  });
});
