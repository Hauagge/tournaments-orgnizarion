import { Athlete, BracketMap } from '@/app/dashboard';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../ui/select';
import { TabsContent } from '../../ui/tabs';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../ui/table';
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

export default function BracketTabs({
  athletes,
  brackets,
  selectedCategory,
  setSelectedCategory,
  selectedBelt,
  setSelectedBelt,
  generateBracket,
}: BracketTabsProps) {
  const currentBracket = brackets[selectedCategory] || [];

  return (
    <TabsContent value="chaves">
      <BracketsPage athletes={athletes} />

      {/* <Card>
        <CardContent className="pt-4 space-y-4">
          <p>Selecione a categoria para visualizar a chave:</p>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>{selectedCategory || 'Categoria'}</SelectTrigger>
            <SelectContent>
              {[...new Set(athletes.map((a) => a.category))].map((cat, idx) => (
                <SelectItem key={idx} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBelt} onValueChange={setSelectedBelt}>
            <SelectTrigger>{selectedBelt || 'Faixa'}</SelectTrigger>
            <SelectContent>
              {[...new Set(athletes.map((a) => a.belt))].map((belt, idx) => (
                <SelectItem key={idx} value={belt}>
                  {belt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => generateBracket(selectedCategory)}
            disabled={!selectedCategory}
          >
            Gerar Chave
          </Button>

          <div className="border p-4 rounded-lg">
            {currentBracket.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atleta 1</TableHead>
                    <TableHead>Atleta 2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBracket.map((pair, index) => (
                    <TableRow key={index}>
                      <TableCell>{pair[0]}</TableCell>
                      <TableCell className="text-center font-bold">
                        VS
                      </TableCell>
                      <TableCell>{pair[1]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center">
                [Área de visualização gráfica da chave de lutas]
              </p>
            )}
          </div>
        </CardContent>
      </Card> */}
    </TabsContent>
  );
}
