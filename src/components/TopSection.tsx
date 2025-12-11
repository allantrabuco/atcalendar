import React from 'react';

import { AppearanceToggle } from './AppearanceToggle';
import TodayNav from './calendar/TodayNav';
import ViewByBar from './calendar/ViewByBar';

const TopSection: React.FC = () => {
  return (
    <div className="z-50 flex h-(--header-height) flex-row items-center justify-baseline gap-2 bg-(--header-background) pr-2">
      <div className="flex h-(--header-height) flex-row items-center justify-baseline gap-0.5 pr-2 pl-4">
        <TodayNav />
      </div>

      <div className="ml-auto flex h-(--header-height) flex-row items-center justify-baseline gap-2 p-2">
        <ViewByBar />
      </div>

      <div className="ml-auto flex h-(--header-height) flex-row items-center justify-baseline gap-2 p-2">
        <AppearanceToggle />
      </div>
    </div>
  );
};

export default TopSection;
