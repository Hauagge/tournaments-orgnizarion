import React from 'react';

import JiujitsuTournamentUI from './dashboard';

const Page: React.FC = () => {
  return (
    <div
      className="min-h-screen p-6 space-y-6 bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: "url('./background.jpg')" }}
    >
      <div className="absolute inset-0pointer-events-none -z-10" />
      <div className="flex flex-col   h-1 max-h-screen w-full">
        <JiujitsuTournamentUI />
      </div>
    </div>
  );
};

export default Page;
