"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { can, type Permission, type Role } from "@/lib/rbac";

export function usePermissions() {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api<{ role: Role }>("/api/me")
        .then((me) => setRole(me.role))
        .catch(() => setRole(null));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return {
    role,
    can: (permission: Permission) => can(role ?? undefined, permission),
    ready: role !== null,
  };
}
