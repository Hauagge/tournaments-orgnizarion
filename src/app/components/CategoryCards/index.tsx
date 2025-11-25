'use client';

import { Card, CardContent } from '../ui/card';
// import { useRouter } from 'next/navigation';
import { Athlete, Category } from '@/app/types';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Plus, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

type BracketsPageProps = {
  categories: Array<Category>;
  categoryName?: string;
  redirectToCategory?: boolean;
  searchTerm?: string;
  maxPerCategory?: number;
  athletesPool?: Athlete[];
  onAdd?: (categoryId: number, athlete: Athlete) => void;
  onRemove?: (categoryId: number, athlete: Athlete) => void;
};

function athleteKey(a: Athlete) {
  return String(a.id ?? `${a.name}|${a.age}|${a.gender}|${a.belt}|${a.weight}`);
}

export default function CardCategory({
  categories,
  categoryName,
  searchTerm = '',
  athletesPool = [],
  maxPerCategory = 4,
  onAdd,
  onRemove,
}: BracketsPageProps) {
  // const router = useRouter();
  const onlyCategoriesNotEmpty = categories
    .filter((category) => category.athletes && category.athletes.length > 0)
    .sort((a, b) => a.id - b.id);

  const [openFor, setOpenFor] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const filteredByCatName = useMemo(
    () =>
      onlyCategoriesNotEmpty.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [onlyCategoriesNotEmpty, searchTerm],
  );

  const suggestions = useMemo(() => {
    const q = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    const norm = (s: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
    return athletesPool
      .filter((a) => {
        if (!openFor) return false;
        const cat = filteredByCatName.find((c) => c.id === openFor);
        if (!cat) return false;
        // não listar quem já está na própria categoria
        const present = cat.athletes.some(
          (p) => athleteKey(p) === athleteKey(a),
        );
        if (present) return false;
        if (!q) return true;
        return norm(a.name).includes(q) || norm(a.academy || '').includes(q);
      })
      .slice(0, 20);
  }, [athletesPool, filteredByCatName, openFor, query]);

  return (
    <div className="space-y-4 max-h-full overflow-y-auto flex-1">
      <h2 className="text-xl font-bold text-center">{categoryName}</h2>

      {filteredByCatName.map((category) => {
        const full = category.athletes.length >= maxPerCategory;
        return (
          <Card key={category.id} className="hover:shadow-lg">
            <CardContent className="space-y-2 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    ID: {category.id}
                  </p>
                  <h3 className="text-lg font-bold">{category.name}</h3>
                  <p className="text-sm">
                    Idade: {category?.ageDivision.min} -{' '}
                    {category?.ageDivision.max} anos
                  </p>
                  <p className="text-sm">
                    Peso: {category?.minWeight} kg - {category?.maxWeight} kg
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {category.athletes.length}/{maxPerCategory}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={full}
                    onClick={() => setOpenFor(category.id)}
                    title={full ? 'Chave completa' : 'Adicionar atleta'}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de atletas */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Academia</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Faixa</TableHead>
                      <TableHead className="w-12 text-center">
                        Remover
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.athletes.map((a, idx) => (
                      <TableRow key={athleteKey(a)}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.academy}</TableCell>
                        <TableCell>{a.age}</TableCell>
                        <TableCell>
                          {Number(a.weight).toLocaleString('pt-BR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </TableCell>
                        <TableCell>{a.belt}</TableCell>
                        <TableCell className="text-center">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-red-600 hover:bg-red-50"
                            onClick={() => onRemove?.(category.id, a)}
                            title="Remover atleta da categoria"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {category.athletes.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-6 text-center text-sm text-muted-foreground"
                        >
                          Nenhum atleta nesta categoria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Modal de adicionar */}
              <Dialog
                open={openFor === category.id}
                onOpenChange={(v) => setOpenFor(v ? category.id : null)}
              >
                <DialogContent className="max-w-3xl bg-amber-50 ">
                  <DialogHeader>
                    <DialogTitle>Adicionar atleta à categoria</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3">
                    <Input
                      placeholder="Buscar por nome ou academia…"
                      value={openFor === category.id ? query : ''}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="max-h-72 overflow-y-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Academia</TableHead>
                            <TableHead>Idade</TableHead>
                            <TableHead>Peso</TableHead>
                            <TableHead>Faixa</TableHead>
                            <TableHead className="w-24 text-center">
                              Ação
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {suggestions.map((a) => (
                            <TableRow key={athleteKey(a)}>
                              <TableCell className="font-medium">
                                {a.name}
                              </TableCell>
                              <TableCell>{a.academy}</TableCell>
                              <TableCell>{a.age}</TableCell>
                              <TableCell>{a.weight}</TableCell>
                              <TableCell>{a.belt}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    category.athletes.length >= maxPerCategory
                                  }
                                  onClick={() => {
                                    onAdd?.(category.id, a);
                                    // mantém o modal aberto pra múltiplas adições, ou feche se preferir:
                                    // setOpenFor(null);
                                  }}
                                >
                                  Adicionar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {suggestions.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="py-6 text-center text-sm text-muted-foreground"
                              >
                                Nenhum atleta encontrado.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setOpenFor(null)}
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
  // return (
  //   <div className="space-y-4 max-h-full overflow-y-auto flex-1">
  //     <h2 className="text-xl font-bold text-center">{categoryName}</h2>
  //     {onlyCategoriesNotEmpty
  //       .filter((category) =>
  //         category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  //       )
  //       .map((category) => (
  //         <Card
  //           key={category.id}
  //           className="cursor-pointer hover:shadow-lg"
  //           onClick={() =>
  //             router.push(`/category/${encodeURIComponent(category.name)}`)
  //           }
  //         >
  //           <CardContent>
  //             <p>ID: {category.id}</p>
  //             <h3 className="text-lg font-bold">{category.name}</h3>
  //             <p>
  //               Idade: {category?.ageDivision.min} - {category?.ageDivision.max}{' '}
  //               anos
  //             </p>
  //             <p>
  //               Peso: {category?.minWeight} kg - {category?.maxWeight} kg
  //             </p>
  //             <p>{category.athletes?.length || 0} Atletas</p>
  //           </CardContent>
  //         </Card>
  //       ))}
  //   </div>
  // );
}
