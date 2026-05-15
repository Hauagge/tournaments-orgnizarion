'use client';

import { ReactNode } from 'react';
import { useRoleAccess } from '@/features/auth/hooks/use-role-access';

type RoleGuardProps = {
  allow?: string[];
  deny?: string[];
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleGuard({
  allow,
  deny,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { isAllowed } = useRoleAccess({ allow, deny });

  return isAllowed ? <>{children}</> : <>{fallback}</>;
}

