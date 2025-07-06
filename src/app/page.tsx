import React from 'react';

// import Bracket from './components/brackets-two-stage';
import JiujitsuTournamentUI from './dashboard';
// import FightBracket from './components/double-brackets-athletes';

const Page: React.FC = () => {
  return (
    <div className="flex flex-row   justify-start  bg-gray-100">
      <div className="flex flex-col   h-1 min-h-screen">
        {/* <FightBracket /> */}
        {/* <Bracket /> */}
        <JiujitsuTournamentUI />
      </div>
    </div>
  );
};

export default Page;
