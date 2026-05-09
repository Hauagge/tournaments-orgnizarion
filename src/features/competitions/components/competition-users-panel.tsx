'use client';

import { useMemo, useState } from 'react';
import { Search, UserMinus, UserPlus, Users } from 'lucide-react';
import { Competition } from '@/features/competitions/types/competition';
import {
  useAddUserToCompetition,
  useCompetitionUsers,
  useRemoveUserFromCompetition,
  useSystemUsers,
} from '@/features/users/hooks/use-users';
import {
  getUserRoleLabel,
  SystemUser,
} from '@/features/users/types/user';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import AlertDialog, {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alertDialog';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useToast } from '@/shared/ui/use-toast';

type CompetitionUsersPanelProps = {
  competition: Competition;
};

export function CompetitionUsersPanel({
  competition,
}: CompetitionUsersPanelProps) {
  const [search, setSearch] = useState('');
  const [userToRemove, setUserToRemove] = useState<SystemUser | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);
  const { toast } = useToast();

  const competitionUsersQuery = useCompetitionUsers(competition.id);
  const addUserMutation = useAddUserToCompetition(competition.id);
  const removeUserMutation = useRemoveUserFromCompetition(competition.id);
  const systemUsersQuery = useSystemUsers(debouncedSearch.trim());

  const competitionUsers = competitionUsersQuery.data ?? [];
  const suggestions = useMemo(() => {
    const linkedIds = new Set(competitionUsers.map((user) => user.id));
    return (systemUsersQuery.data ?? []).filter((user) => !linkedIds.has(user.id));
  }, [competitionUsers, systemUsersQuery.data]);

  async function handleAddUser(user: SystemUser) {
    try {
      await addUserMutation.mutateAsync(user.id);
      setSearch('');
      toast({
        title: 'Usuário vinculado',
        description: `${user.name} agora pode gerir ${competition.name}.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao vincular usuário',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleConfirmRemove() {
    if (!userToRemove) {
      return;
    }

    try {
      await removeUserMutation.mutateAsync(userToRemove.id);
      toast({
        title: 'Usuário removido',
        description: `${userToRemove.name} não está mais vinculado à competição.`,
        variant: 'success',
      });
      setUserToRemove(null);
    } catch (error) {
      toast({
        title: 'Falha ao remover usuário',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Gestão da competição
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Usuários vinculados a {competition.name}
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Liste quem já tem acesso e vincule usuários do sistema para apoiar a operação desta competição.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
            <Users className="h-4 w-4" />
            <span>
              {competitionUsers.length} {competitionUsers.length === 1 ? 'usuário' : 'usuários'}
            </span>
          </div>
        </div>
      </header>

      <Card className="overflow-visible">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Adicionar usuário à competição
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Digite ao menos 2 caracteres para pesquisar usuários já cadastrados no sistema.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, login ou e-mail"
              className="pl-9"
            />

            {debouncedSearch.trim().length >= 2 && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {systemUsersQuery.isLoading ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    Buscando usuários...
                  </div>
                ) : systemUsersQuery.isError ? (
                  <div className="px-4 py-3 text-sm text-red-600">
                    {systemUsersQuery.error instanceof Error
                      ? systemUsersQuery.error.message
                      : 'Falha ao buscar usuários.'}
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    Nenhum usuário disponível para vincular.
                  </div>
                ) : (
                  suggestions.slice(0, 8).map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleAddUser(user)}
                      disabled={addUserMutation.isPending}
                      className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-500">
                          {user.email || user.username || 'Sem identificação adicional'} ·{' '}
                          {getUserRoleLabel(user.role)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                        <UserPlus className="h-3.5 w-3.5" />
                        Vincular
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table className="rounded-none border-0">
            <TableHeader className="bg-slate-100">
              <TableRow className="hover:bg-slate-100">
                <TableHead>Nome</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitionUsersQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                    Carregando usuários da competição...
                  </TableCell>
                </TableRow>
              ) : competitionUsersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-red-600">
                    {competitionUsersQuery.error instanceof Error
                      ? competitionUsersQuery.error.message
                      : 'Falha ao carregar usuários da competição.'}
                  </TableCell>
                </TableRow>
              ) : competitionUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                    Nenhum usuário vinculado a esta competição.
                  </TableCell>
                </TableRow>
              ) : (
                competitionUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {getUserRoleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setUserToRemove(user)}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog
        open={Boolean(userToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setUserToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário da competição</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover <strong>{userToRemove?.name}</strong> da gestão de{' '}
              <strong>{competition.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeUserMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={removeUserMutation.isPending}
            >
              {removeUserMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
