import { useEffect, useEffectEvent, useState } from 'react';

import CalendarLayout from './components/calendar/Layout';
import { CalendarProvider } from './components/calendar/Provider';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import { ThemeProvider } from './components/ThemeProvider';
import TopSection from './components/TopSection';

import { Shortcuts } from './components/calendar/Shortcuts';
import { GlobalLoading } from './components/GlobalLoading';

function App() {
  // Initialize dates lazily to avoid re-creating Date on every render
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date());
  const [month, setMonth] = useState<Date>(() => new Date());

  // Controls for responsive panels
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  /**
   * Use a stable event callback for resize using the React 19+ useEffectEvent hook.
   * This avoids recreating the handler across renders and ensures the handler sees
   * the latest state setters safely.
   */
  const handleResize = useEffectEvent(() => {
    // Keep the same breakpoint logic as before (do not change colours/borders)
    setShowLeftPanel(window.innerWidth >= 630);
    // setShowLeftPanel(window.innerWidth >= 830); // for month layout
    setShowRightPanel(window.innerWidth >= 950);
  });

  useEffect(() => {
    // Run once to set initial visibility and attach listener
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <CalendarProvider
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        month={month}
        setMonth={setMonth}
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        // initialEvents={initialEvents}
      >
        <Shortcuts />
        <GlobalLoading />
        <div className="flex h-screen w-full">
          {/* Left Vertical Section */}
          {showLeftPanel && (
            <div className="h-[calc(100dvh-var(--footer-height))] w-(--left-width) border-r border-r-(--left-border-colour) bg-(--left-background)">
              <LeftPanel
                month={month}
                setMonth={setMonth}
                setSelectedDate={(date) => setSelectedDate(date)}
                selectedDate={selectedDate}
              />
            </div>
          )}

          {/* Main Right Area */}
          <div
            className={`${showLeftPanel ? 'w-[calc(100vw-var(--left-width))]' : 'w-full'} flex flex-col bg-(--header-background)`}
          >
            {/* Top Horizontal Section */}
            <TopSection />

            {/* Lower Right Grid */}
            <div className="flex h-[calc(100dvh-var(--header-height))]">
              {/* Left Subgrid */}
              <CalendarLayout />

              {/* Right Subgrid */}
              {showRightPanel && <RightPanel />}
            </div>
          </div>
        </div>
      </CalendarProvider>
    </ThemeProvider>
  );
}

export default App;
