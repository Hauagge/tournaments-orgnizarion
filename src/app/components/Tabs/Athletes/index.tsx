import { useImportAthletes } from '@/app/hooks/useImportAthletes';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../ui/table';
import { TabsContent } from '../../ui/tabs';
import { Athlete } from '@/app/dashboard';
import { DragAndDrop } from '../../ui/dragAndDrop';
import { useAthleteStore } from '@/app/store/useAthleteStore';

type AthleteTabProps = {
  newAthlete: Athlete;
  setNewAthlete: (athlete: Athlete) => void;
};

export default function AthleteTabs({
  newAthlete,
  setNewAthlete,
}: AthleteTabProps) {
  const { athletes, addAthlete } = useAthleteStore();
  const { handleFileUpload } = useImportAthletes();
  console.log('Athletes in AthleteTabs:', athletes);
  const handleAthlete = () => {
    if (
      newAthlete.name &&
      newAthlete.belt &&
      newAthlete.weight &&
      newAthlete.academy &&
      newAthlete.category &&
      newAthlete.age > 0
    ) {
      addAthlete({
        ...newAthlete,
        weight: Number(newAthlete.weight),
      });

      setNewAthlete({
        name: '',
        belt: '',
        weight: 0,
        academy: '',
        category: {
          name: '',
          minWeight: 0,
          maxWeight: 0,
          maxAge: 0,
          minAge: 0,
          belt: '',
        },
        isApto: false,
        status: 'Aguardando',
        age: 0,
      });
    }
  };

  return (
    <TabsContent value="atletas">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-6 gap-2">
            <Input
              placeholder="Nome"
              value={newAthlete.name}
              onChange={(e) =>
                setNewAthlete({ ...newAthlete, name: e.target.value })
              }
            />
            <Input
              placeholder="Faixa"
              value={newAthlete.belt}
              onChange={(e) =>
                setNewAthlete({ ...newAthlete, belt: e.target.value })
              }
            />
            <Input
              placeholder="Idade"
              type="number"
              value={newAthlete.age > 0 ? newAthlete.age : ''}
              onChange={(e) =>
                setNewAthlete({
                  ...newAthlete,
                  age: Number(e.target.value),
                })
              }
            />
            <Input
              placeholder="Peso"
              type="number"
              value={newAthlete.weight}
              onChange={(e) =>
                setNewAthlete({
                  ...newAthlete,
                  weight: parseInt(e.target.value),
                })
              }
            />
            <Input
              placeholder="Academia"
              value={newAthlete.academy}
              onChange={(e) =>
                setNewAthlete({ ...newAthlete, academy: e.target.value })
              }
            />
            <Input
              placeholder="Categoria"
              value={newAthlete.category?.name}
              onChange={(e) => {
                setNewAthlete({
                  ...newAthlete,
                  category: {
                    name: e.target.value,
                    minWeight: 0,
                    maxWeight: 0,
                    maxAge: 0,
                    minAge: 0,
                    belt: newAthlete.belt,
                  },
                });
              }}
            />
            <DragAndDrop handleFileUpload={handleFileUpload} />
          </div>
          <Button onClick={handleAthlete}>Adicionar Atleta</Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>

                <TableHead>Faixa</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Academia</TableHead>
                <TableHead>Categoria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {athletes.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.age}</TableCell>

                  <TableCell>{a.belt}</TableCell>
                  <TableCell>
                    {a.weight.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>{a.academy}</TableCell>
                  <TableCell>{a.category?.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
