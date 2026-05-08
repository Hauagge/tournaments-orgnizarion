'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { login } from '@/features/auth/api/auth-client';
import { AUTH_TOKEN_STORAGE_KEY, useAuthStore } from '@/features/auth/stores/useAuthStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (hasHydrated && token) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, router, token]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      setSession({ token: result.token, username: result.username });
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, result.token);
      }
      toast({
        title: 'Login realizado',
        description: 'Acesso liberado ao painel administrativo.',
        variant: 'success',
      });
      router.replace('/dashboard');
    },
    onError: (error) => {
      toast({
        title: 'Falha no login',
        description: error instanceof Error ? error.message : 'Usuário ou senha inválidos.',
        variant: 'destructive',
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      toast({
        title: 'Dados incompletos',
        description: 'Informe usuário e senha para continuar.',
        variant: 'warning',
      });
      return;
    }

    loginMutation.mutate({
      username: trimmedUsername,
      password,
    });
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('/semando-campeoes.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/55" />
      <Card className="relative z-10 w-full max-w-md border-4 border-slate-900 p-0 shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
        <CardContent className="relative space-y-6 p-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Autenticação
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Acessar sistema
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Entre com usuário e senha para acessar o painel.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
                Usuário
              </span>
              <Input
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Seu usuário"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
                Senha
              </span>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
              />
            </label>

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
