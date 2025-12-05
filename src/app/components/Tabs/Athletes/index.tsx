'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { DragAndDrop } from '../../ui/dragAndDrop';
import { useAthleteStore } from '@/app/store/useAthleteStore';
import { Athlete, BeltsEnum, GenderEnum } from '@/app/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '../../ui/select';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '../../ui/dialog';
import { useDebouncedValue } from '@/app/hooks/useDebouncedValue';
import { buildAthletePatch } from '@/app/utils/buildAthletePatch';
import { useToast } from '../../ui/use-toast';
import { useCategoryStore } from '@/app/store/useCategoryStore';
import { Trash2, Pen } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alertDialog';
import ClearStorageButton from '../../ui/clear-storage-button';

type AthleteTabProps = {
  newAthlete: Athlete;
  setNewAthlete: (athlete: Athlete) => void;
};

type SortKey = 'name' | 'age' | 'belt' | 'category' | 'weight';
type SortDir = 'asc' | 'desc';

type Mode = 'create' | 'edit';
type ToastPayload = { title?: string; description?: string };
export default function AthleteTabs({
  newAthlete,
  setNewAthlete,
}: AthleteTabProps) {
  const { athletes, addAthlete, updateAthletePartial, deleteAthlete } =
    useAthleteStore();
  const { handleFileUpload } = useImportAthletes();
  const { removeFromCategory } = useCategoryStore();
  const { toast } = useToast?.() ?? {
    toast: (x: ToastPayload) => alert(x?.description || x?.title || 'OK'),
  };

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);

  // ---- Ordenação ----
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ---- Paginação ----
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // ---- Busca ----
  const [searchInput, setSearchInput] = useState('');
  const searchDebounced = useDebouncedValue(searchInput, 400);

  function resetForm() {
    setNewAthlete({
      id: 0,
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
      gender: '',
    });
  }

  const canSave =
    !!newAthlete.name &&
    !!newAthlete.belt &&
    !!newAthlete.academy &&
    !!newAthlete.gender &&
    newAthlete.age > 0 &&
    newAthlete.weight > 0;

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSave) return;

    if (Number(newAthlete.age) <= 0) {
      return toast({
        title: 'Idade inválida',
        description: 'Idade deve ser maior que 0.',
      });
    }
    if (Number(newAthlete.weight) <= 0) {
      return toast({
        title: 'Peso inválido',
        description: 'Peso deve ser maior que 0.',
      });
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        addAthlete({
          ...newAthlete,
          weight: Number(newAthlete.weight),
        });

        toast({
          title: 'Atleta adicionado',
          description: `${newAthlete.name} foi cadastrado com sucesso.`,
        });
      } else {
        if (!editingId) return;
        const current = athletes.find((a) => a.id === editingId);
        if (!current) return;

        const draft: Athlete = {
          ...newAthlete,
          id: editingId,
          weight: Number(newAthlete.weight),
        };
        const patch = buildAthletePatch(current, draft);
        if (Object.keys(patch).length === 0) {
          toast({
            title: 'Nenhuma alteração',
            description: 'Nenhuma alteração foi feita no atleta.',
          });
          return;
        }
        updateAthletePartial(editingId, patch);

        toast({
          title: 'Atleta atualizado',
          description: `${newAthlete.name} foi atualizado com sucesso.`,
          variant: 'success',
        });
      }
      resetForm();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(athlete: Athlete) {
    if (!athlete.id) return;
    setMode('edit');
    setEditingId(athlete.id ?? null);
    setNewAthlete({
      id: athlete.id ?? 0,
      name: athlete.name,
      belt: athlete.belt,
      weight: Number(athlete.weight),
      academy: athlete.academy || '',
      category: {
        name: athlete.category?.name || '',
        minWeight: athlete.category?.minWeight ?? 0,
        maxWeight: athlete.category?.maxWeight ?? 0,
        maxAge: athlete.category?.maxAge ?? 0,
        minAge: athlete.category?.minAge ?? 0,
        belt: athlete.category?.belt || (athlete.belt ?? ''),
      },
      isApto: !!athlete.isApto,
      status: athlete.status || 'Aguardando',
      age: Number(athlete.age),
      gender: athlete.gender || '',
    });
    setOpen(true);
  }

  function requestDelete(a: Athlete) {
    setAthleteToDelete(a);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!athleteToDelete?.id) {
      setDeleteOpen(false);
      setAthleteToDelete(null);
      return;
    }
    // 1) remove do store de atletas
    deleteAthlete(athleteToDelete.id);

    // 2) remove das categorias
    removeFromCategory(athleteToDelete.id);

    // 3) feedback
    toast({
      title: 'Atleta excluído',
      description: `${athleteToDelete.name} foi removido.`,
      variant: 'success',
    });

    setDeleteOpen(false);
    setAthleteToDelete(null);
  }

  function getValue(a: Athlete, key: SortKey) {
    switch (key) {
      case 'name':
        return a.name || '';
      case 'age':
        return Number(a.age) || 0;
      case 'belt':
        return a.belt || '';
      case 'category':
        return a.category?.name || '';
      case 'weight':
        return Number(a.weight) || 0;
    }
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1); // volta pra primeira página ao trocar ordenação
  }

  const sortedAthletes = useMemo(() => {
    const data = [...athletes];
    data.sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);

      // number x string
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'pt-BR', {
            numeric: true,
            sensitivity: 'base',
          })
        : String(bv).localeCompare(String(av), 'pt-BR', {
            numeric: true,
            sensitivity: 'base',
          });
    });
    return data;
  }, [athletes, sortKey, sortDir]);

  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredAthletes = useMemo(() => {
    const q = norm(searchDebounced.trim());
    if (!q) return sortedAthletes;
    return sortedAthletes.filter((a) => norm(a.name).includes(q));
  }, [sortedAthletes, searchDebounced]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredAthletes.length / rowsPerPage),
    );
    if (page > totalPages) setPage(totalPages);
  }, [filteredAthletes.length, rowsPerPage, page]);

  // Volta para a 1 ao mudar o termo (após debounce)
  useEffect(() => {
    setPage(1);
  }, [searchDebounced]);

  // Slice da página atual
  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAthletes.slice(start, end);
  }, [filteredAthletes, page, rowsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAthletes.length / rowsPerPage),
  );
  const showingStart =
    filteredAthletes.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(page * rowsPerPage, filteredAthletes.length);

  const SortIndicator = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="opacity-40">↕</span>;
    return <span>{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <TabsContent value="atletas">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Dialog
                open={open}
                onOpenChange={(v) => {
                  setOpen(v);
                  if (!v) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    {mode === 'create' ? 'Novo atleta' : 'Editar atleta'}
                  </Button>
                </DialogTrigger>

                <DialogContent
                  className="
                 bg-gray-50
                 w-[96vw] max-w-3xl sm:max-w-4xl
                 "
                >
                  <DialogHeader>
                    <DialogTitle>
                      {mode === 'create' ? 'Cadastrar atleta' : 'Editar atleta'}
                    </DialogTitle>
                  </DialogHeader>

                  {/* Formulário do modal */}
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Nome"
                        value={newAthlete.name}
                        onChange={(e) =>
                          setNewAthlete({ ...newAthlete, name: e.target.value })
                        }
                        required
                      />

                      <Select
                        value={newAthlete.belt}
                        onValueChange={(value) =>
                          setNewAthlete({
                            ...newAthlete,
                            belt:
                              (BeltsEnum[
                                value as keyof typeof BeltsEnum
                              ] as Athlete['belt']) || '',
                          })
                        }
                      >
                        <SelectTrigger>
                          <p>{newAthlete.belt || 'Faixa'}</p>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(BeltsEnum).map((belt) => (
                            <SelectItem key={belt} value={belt}>
                              {belt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={newAthlete.gender}
                        onValueChange={(value) =>
                          setNewAthlete({
                            ...newAthlete,
                            gender:
                              (GenderEnum[
                                value as keyof typeof GenderEnum
                              ] as Athlete['gender']) || '',
                          })
                        }
                      >
                        <SelectTrigger>
                          <p>
                            {newAthlete.gender
                              ? newAthlete.gender === GenderEnum.MAS
                                ? 'Masculino'
                                : 'Feminino'
                              : 'Gênero'}
                          </p>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MAS">Masculino</SelectItem>
                          <SelectItem value="FEM">Feminino</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Idade"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={newAthlete.age || ''}
                        onChange={(e) =>
                          setNewAthlete({
                            ...newAthlete,
                            age: Number(e.target.value),
                          })
                        }
                        required
                      />

                      <Input
                        placeholder="Peso (kg)"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        value={newAthlete.weight || ''}
                        onChange={(e) =>
                          setNewAthlete({
                            ...newAthlete,
                            weight: Number(e.target.value),
                          })
                        }
                        required
                      />

                      <Input
                        placeholder="Academia"
                        value={newAthlete.academy}
                        onChange={(e) =>
                          setNewAthlete({
                            ...newAthlete,
                            academy: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    {/* Categoria opcional (preenchida manualmente se quiser) */}
                    <Input
                      placeholder="Categoria (opcional)"
                      value={newAthlete.category?.name || ''}
                      onChange={(e) =>
                        setNewAthlete({
                          ...newAthlete,
                          category: {
                            name: e.target.value,
                            minWeight: 0,
                            maxWeight: 0,
                            maxAge: 0,
                            minAge: 0,
                            belt: newAthlete.belt || '',
                          },
                        })
                      }
                    />

                    <DialogFooter className="gap-2">
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={!canSave || saving}>
                        {saving
                          ? 'Salvando...'
                          : mode === 'create'
                          ? 'Salvar atleta'
                          : 'Salvar alterações'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Importação em massa permanece disponível */}
              <DragAndDrop handleFileUpload={handleFileUpload} />

              <ClearStorageButton />
            </div>

            {/* Barra de ferramentas direita: Busca + Linhas por página */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nome..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-48 sm:w-64"
              />
              {searchInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchInput('')}
                >
                  Limpar
                </Button>
              )}

              <span className="text-sm text-muted-foreground">Linhas:</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(v) => {
                  setRowsPerPage(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <p>{rowsPerPage}</p>
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de atletas */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead
                  onClick={() => handleSort('name')}
                  className="cursor-pointer select-none"
                  aria-sort={sortKey === 'name' ? sortDir : 'none'}
                >
                  {' '}
                  <div className="flex items-center gap-1">
                    <span>Nome</span> <SortIndicator col="name" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('age')}
                  className="cursor-pointer select-none"
                  aria-sort={sortKey === 'age' ? sortDir : 'none'}
                >
                  <div className="flex items-center gap-1">
                    <span>Idade</span> <SortIndicator col="age" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('belt')}
                  className="cursor-pointer select-none"
                  aria-sort={sortKey === 'belt' ? sortDir : 'none'}
                >
                  <div className="flex items-center gap-1">
                    <span>Faixa</span> <SortIndicator col="belt" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('weight')}
                  className="cursor-pointer select-none"
                  aria-sort={sortKey === 'weight' ? sortDir : 'none'}
                >
                  {' '}
                  <div className="flex items-center gap-1">
                    <span>Peso</span> <SortIndicator col="weight" />
                  </div>
                </TableHead>
                <TableHead>Academia</TableHead>
                <TableHead
                  onClick={() => handleSort('category')}
                  className="cursor-pointer select-none"
                  aria-sort={sortKey === 'category' ? sortDir : 'none'}
                >
                  {' '}
                  <div className="flex items-center gap-1">
                    <span>Categoria</span> <SortIndicator col="category" />
                  </div>
                </TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((a, i) => (
                <TableRow key={`${a.name}-${i}`}>
                  <TableCell>{page + 1 * rowsPerPage + i + 1}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.age}</TableCell>
                  <TableCell>{a.belt}</TableCell>
                  <TableCell>
                    {Number(a.weight).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>{a.academy}</TableCell>
                  <TableCell>{a.category?.name}</TableCell>
                  <TableCell className="gap-y-1.5 flex flex-col">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(a)}
                      title="Editar"
                    >
                      <Pen className="h-4 w-4 mr-1" />
                      Editar
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => requestDelete(a)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Exibindo {showingStart}–{showingEnd} de {sortedAthletes.length}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                « Primeiro
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹ Anterior
              </Button>
              <span className="text-sm">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                Última »
              </Button>
            </div>
          </div>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir atleta</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir{' '}
                  <strong>{athleteToDelete?.name}</strong>? Esta ação removerá o
                  atleta também de quaisquer categorias.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
