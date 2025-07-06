import { Athlete } from '@/app/dashboard';
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

type WeighInTabsProps = {
  athletes: Array<Athlete>;
  setAthletes: (athletes: Array<Athlete>) => void;
};
export default function WeighInTabs({
  athletes,
  setAthletes,
}: WeighInTabsProps) {
  const [search, setSearch] = useState('');
  const sortedAthletes = [...athletes].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const filteredAthletes = sortedAthletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(search.toLowerCase()),
  );
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
                  <TableCell>{athlete.weight}</TableCell>
                  <TableCell>{athlete.category?.name}</TableCell>
                  <TableCell>{athlete.status}</TableCell>
                  <TableCell>
                    <Radio
                      checked={athlete.isApto === true}
                      onCheckedChange={() => {
                        const updated = [...athletes];
                        const idex = updated.findIndex(
                          (a) => a.id === athlete.id,
                        );
                        updated[idex].isApto =
                          athlete.isApto === true ? undefined : true;
                        updated[idex].status =
                          athlete.isApto !== true ? 'Aguardando' : 'Avaliado';
                        setAthletes(updated);
                      }}
                      label="Apto"
                      name={`apto-${athlete.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      checked={athlete.isApto === false}
                      onCheckedChange={() => {
                        const updated = [...athletes];
                        const idex = updated.findIndex(
                          (a) => a.id === athlete.id,
                        );
                        updated[idex].isApto =
                          athlete.isApto === false ? undefined : false;
                        updated[idex].status =
                          athlete.isApto !== false ? 'Aguardando' : 'Avaliado';
                        setAthletes(updated);
                      }}
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
