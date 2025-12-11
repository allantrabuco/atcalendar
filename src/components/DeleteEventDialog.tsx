import { useEvents } from '@/components/calendar/Provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OctagonX } from 'lucide-react';

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteEventDialog({ open, onOpenChange, onConfirm }: DeleteEventDialogProps) {
  const { selectedEvent } = useEvents();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <OctagonX className="h-6 w-6" />
            Delete Event
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-2">
            <span>Are you sure you want to delete this event? This action cannot be undone.</span>
            <span className="text-foreground pt-2 font-bold">{selectedEvent?.title}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
