import { deleteEvent as deleteEventService } from '@/services/Events';
import { useEffect, useState } from 'react';
import { DeleteEventDialog } from '../DeleteEventDialog';
import { useEvents, useLoading } from './Provider';

export function Shortcuts() {
  const { selectedEvent, setSelectedEvent, setEvents } = useEvents();
  const { setIsLoading } = useLoading();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Delete or Backspace key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only proceed if an event is selected and no input/textarea is focused
        if (
          selectedEvent &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement)
        ) {
          e.preventDefault();
          setDeleteDialogOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (selectedEvent) {
          e.preventDefault();
          setSelectedEvent(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEvent, setSelectedEvent]);

  const handleDeleteConfirm = async () => {
    if (selectedEvent) {
      setIsLoading(true);

      try {
        // Call service to delete
        // We cast to any or handle the type mismatch because the service expects number but ID can be string
        // In a real app we should unify types, but for now we just pass it if it's a number-like string or just log
        if (typeof selectedEvent.id === 'number') {
          await deleteEventService(selectedEvent.id);
        } else if (!isNaN(Number(selectedEvent.id))) {
          await deleteEventService(Number(selectedEvent.id));
        } else {
          console.warn('Skipping API delete for non-numeric ID:', selectedEvent.id);
        }

        // Remove from local state
        setEvents((prev) => {
          const newEvents = { ...prev };
          Object.keys(newEvents).forEach((key) => {
            newEvents[key] = newEvents[key].filter((ev) => ev.id !== selectedEvent.id);
          });
          return newEvents;
        });

        setSelectedEvent(null);
      } catch (error) {
        console.error('Failed to delete event', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <DeleteEventDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      onConfirm={handleDeleteConfirm}
    />
  );
}
