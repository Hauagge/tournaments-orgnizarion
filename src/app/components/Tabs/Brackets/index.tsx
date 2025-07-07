import { Athlete, BracketMap } from '@/app/dashboard';

import { TabsContent } from '../../ui/tabs';

import BracketsPage from '../../Cards';

type BracketTabsProps = {
  athletes: Array<Athlete>;
  brackets: BracketMap;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBelt: string;
  setSelectedBelt: (belt: string) => void;
  generateBracket: (category: string) => void;
};

export default function BracketTabs({ athletes }: BracketTabsProps) {
  return (
    <TabsContent value="chaves">
      <BracketsPage athletes={athletes} />
    </TabsContent>
  );
}
