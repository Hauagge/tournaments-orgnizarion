import React from 'react';

import JiujitsuTournamentUI from './dashboard';

const Page: React.FC = () => {
  return (
    <div className="flex flex-row   justify-start  bg-gray-100">
      <div className="flex flex-col   h-1 max-h-screen w-full">
        <JiujitsuTournamentUI />
      </div>
    </div>
  );
};

export default Page;
