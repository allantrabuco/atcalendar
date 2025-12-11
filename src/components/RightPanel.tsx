import CalendarEventPanel from './calendar/EventPanel';
import { useEvents, useViewBy } from './calendar/Provider';

const RightPanel = () => {
  const { viewBy } = useViewBy();
  const { selectedEvent } = useEvents();

  if (viewBy === 'day') {
    return (
      <div className="relative right-1 bottom-1 flex w-(--right-width) flex-col">
        <div className="mx-4 h-(--content-header-height)" />
        <div
          className="mt-5 mr-2 mb-2 ml-4 flex h-[calc(100vh-var(--headers-height))] items-start justify-center rounded-md border border-(--event-default-colour-1-30) bg-(--event-default-colour-1-10)"
          style={{
            backgroundColor: `var(--event-default-colour-${selectedEvent?.colour}-10)`,
            borderColor:
              selectedEvent !== null
                ? `var(--event-default-colour-${selectedEvent?.colour}-30)`
                : 'transparent',
          }}
        >
          {selectedEvent !== null && selectedEvent.id !== '' ? (
            <CalendarEventPanel
              key={selectedEvent?.id}
              title={selectedEvent?.title ?? ''}
              start={selectedEvent?.start}
              end={selectedEvent?.end}
              event={selectedEvent}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-gray-500">No event selected</p>
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default RightPanel;
