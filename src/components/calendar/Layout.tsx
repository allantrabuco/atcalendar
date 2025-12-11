import React from 'react';

import DayView from './DayView';
import MonthView from './MonthView';
import { useViewBy } from './Provider';
import WeekView from './WeekView';
import YearView from './YearView';

const Layout: React.FC = () => {
  const { viewBy } = useViewBy();

  switch (viewBy) {
    case 'day':
      return <DayView />;
    case 'week':
      return <WeekView />;
    case 'month':
      return <MonthView />;
    case 'year':
      return <YearView />;
    default:
      return null;
  }
};

export default Layout;
