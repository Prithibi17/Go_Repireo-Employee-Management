import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { UserRole } from '../types';
import { getTursoClient } from '../lib/turso';

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
}

export async function getCurrentUser(c: Context): Promise<CurrentUser | null> {
  const sessionToken = getCookie(c, 'gr_auth_session');
  const sessionEmail = getCookie(c, 'gr_user_email');
  const sessionRole = getCookie(c, 'gr_user_role') as UserRole | undefined;

  // Strict check: if no active session cookie exists, user is unauthenticated
  if (!sessionToken || !sessionEmail) {
    return null;
  }

  const normalizedEmail = sessionEmail.trim().toLowerCase();

  try {
    const db = getTursoClient();
    const res = await db.execute({
      sql: 'SELECT * FROM profiles WHERE lower(email) = lower(?) LIMIT 1',
      args: [normalizedEmail],
    });

    if (res.rows.length > 0) {
      const p = res.rows[0];
      return {
        id: String(p.id),
        email: String(p.email),
        full_name: String(p.full_name),
        role: (p.role as UserRole) || sessionRole || 'EMPLOYEE',
        avatar_url: p.avatar_url ? String(p.avatar_url) : null,
      };
    } else {
      const isSamyak = normalizedEmail === 'samyaksingh1845@gmail.com';
      const id = isSamyak ? 'admin-profile-samyak' : `prof-${Date.now()}`;
      const fullName = isSamyak ? 'Samyak Singh' : normalizedEmail.includes('owner') ? 'Prithibi Mandi' : 'Authorized User';
      const roleToUse = isSamyak ? 'ADMIN' : (sessionRole || 'EMPLOYEE');
      await db.execute({
        sql: `INSERT OR IGNORE INTO profiles (id, email, full_name, role, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        args: [id, normalizedEmail, fullName, roleToUse],
      });
      return {
        id,
        email: normalizedEmail,
        full_name: fullName,
        role: roleToUse,
      };
    }
  } catch {
    const isSamyak = normalizedEmail === 'samyaksingh1845@gmail.com';
    return {
      id: isSamyak ? 'admin-profile-samyak' : 'user-session',
      email: normalizedEmail,
      full_name: isSamyak ? 'Samyak Singh' : (normalizedEmail.includes('owner') ? 'Prithibi Mandi' : 'Authorized User'),
      role: isSamyak ? 'ADMIN' : (sessionRole || 'EMPLOYEE'),
    };
  }
}

export function canManagePeople(role?: UserRole | null): boolean {
  if (!role) return false;
  return ['OWNER', 'ADMIN', 'PEOPLE_MANAGER'].includes(role);
}

export function canIssueCertificates(role?: UserRole | null): boolean {
  if (!role) return false;
  return ['OWNER', 'ADMIN'].includes(role);
}

export function canManageSettings(role?: UserRole | null): boolean {
  if (!role) return false;
  return ['OWNER', 'ADMIN'].includes(role);
}

export function canManageUsers(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === 'OWNER';
}

export function canManageApiKeys(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === 'OWNER';
}
