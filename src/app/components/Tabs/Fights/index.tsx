import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { TabsContent } from '../../ui/tabs';

export default function FightsTab() {
  return (
    <TabsContent value="lutas">
      <Card>
        <CardContent className="pt-4 space-y-4">
          <p>Luta atual:</p>
          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <strong>João Silva</strong>
              <p>Gracie Barra</p>
            </div>
            <span className="text-xl font-bold">VS</span>
            <div>
              <strong>Carlos Mendes</strong>
              <p>Checkmat</p>
            </div>
          </div>
          <Button className="w-full">Marcar João Silva como vencedor</Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
