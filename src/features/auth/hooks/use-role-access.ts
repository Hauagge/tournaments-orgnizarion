'use client';

import { useMemo } from 'react';
import { readTokenRole } from '@/features/auth/lib/read-token-role';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

type RoleAccessOptions = {
  allow?: string[];
  deny?: string[];
};

function normalizeRoles(roles?: string[]) {
  return (roles ?? []).map((role) => role.trim().toUpperCase()).filter(Boolean);
}

export function useRoleAccess(options: RoleAccessOptions = {}) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const role = useMemo(() => readTokenRole(token), [token]);
  const allowedRoles = useMemo(() => normalizeRoles(options.allow), [options.allow]);
  const deniedRoles = useMemo(() => normalizeRoles(options.deny), [options.deny]);

  const isAllowed = useMemo(() => {
    if (!hasHydrated) {
      return false;
    }

    if (role && deniedRoles.includes(role)) {
      return false;
    }

    if (allowedRoles.length > 0) {
      return role ? allowedRoles.includes(role) : false;
    }

    return true;
  }, [allowedRoles, deniedRoles, hasHydrated, role]);

  return {
    role,
    hasHydrated,
    isAllowed,
  };
}

