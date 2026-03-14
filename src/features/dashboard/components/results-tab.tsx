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

export default function ResultTab() {
  return (
    <TabsContent value="resultados">
      <Card>
        <CardContent className="pt-4 space-y-4">
          <p>Ranking por categoria:</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>1º Lugar</TableHead>
                <TableHead>2º Lugar</TableHead>
                <TableHead>3º Lugar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Adulto Médio - Roxa</TableCell>
                <TableCell>João Silva</TableCell>
                <TableCell>Carlos Mendes</TableCell>
                <TableCell>Felipe Costa</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
