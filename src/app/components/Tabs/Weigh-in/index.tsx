import { Card, CardContent } from '../../ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../ui/table';
import { TabsContent } from '../../ui/tabs';
import { Radio } from '../../ui/Radio';
import { useState } from 'react';
import { useAthleteStore } from '@/app/store/useAthleteStore';

export default function WeighInTabs() {
  const { athletes, updateAthlete } = useAthleteStore();
  const [search, setSearch] = useState('');
  const sortedAthletes = [...athletes].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const filteredAthletes = sortedAthletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleAptoStatus = (id: number, apto: boolean) => {
    const athlete = athletes.find((a) => a.id === id);
    if (!athlete) return;
    const isCurrentlyChecked = athlete.isApto === apto;
    const newIsApto = isCurrentlyChecked ? undefined : apto;
    const newStatus = newIsApto === undefined ? 'Aguardando' : 'Avaliado';
    console.log(`Toggling athlete ${athlete.name} to ${newIsApto}`);
    updateAthlete({
      ...athlete,
      isApto: newIsApto,
      status: newStatus,
    });
  };

  return (
    <TabsContent value="pesagem">
      <Card>
        <CardContent className="pt-4">
          <input
            type="text"
            placeholder="Pesquisar por nome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-4 py-2"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead>Peso registrado</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Apto</TableHead>
                <TableHead>Não Apto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAthletes.map((athlete) => (
                <TableRow key={athlete.id}>
                  <TableCell>{athlete.name}</TableCell>
                  <TableCell>{athlete.age}</TableCell>
                  <TableCell>{athlete.belt}</TableCell>
                  <TableCell>{athlete.weight}</TableCell>
                  <TableCell>{athlete.category?.name}</TableCell>
                  <TableCell>{athlete.status}</TableCell>
                  <TableCell>
                    <Radio
                      key={`apto-${athlete.id}-${athlete.isApto}`}
                      checked={athlete.isApto === true}
                      onCheckedChange={() =>
                        toggleAptoStatus(athlete.id!, true)
                      }
                      label="Apto"
                      name={`apto-${athlete.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      key={`no-apto-${athlete.id}-${athlete.isApto}`}
                      checked={athlete.isApto === false}
                      onCheckedChange={() =>
                        toggleAptoStatus(athlete.id!, false)
                      }
                      label="Não Apto"
                      name={`apto-${athlete.id}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
