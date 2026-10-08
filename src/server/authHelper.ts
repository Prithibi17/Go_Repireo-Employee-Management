import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { UserRole } from '@/types';
import { getTursoClient } from '@/lib/turso';

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
}

export async function getCurrentUser(c: Context): Promise<CurrentUser> {
  const sessionRole = (getCookie(c, 'gr_user_role') as UserRole) || 'OWNER';
  const sessionEmail = getCookie(c, 'gr_user_email') || 'owner@gorepireo.in';

  try {
    const db = getTursoClient();
    const res = await db.execute({
      sql: 'SELECT * FROM profiles WHERE email = ? LIMIT 1',
      args: [sessionEmail],
    });

    if (res.rows.length > 0) {
      const p = res.rows[0];
      return {
        id: String(p.id),
        email: String(p.email),
        full_name: String(p.full_name),
        role: (p.role as UserRole) || sessionRole,
        avatar_url: p.avatar_url ? String(p.avatar_url) : null,
      };
    } else {
      const id = `prof-${Date.now()}`;
      const fullName = sessionEmail.includes('owner') ? 'Prithibi Mandi' : 'Authorized User';
      await db.execute({
        sql: `INSERT OR IGNORE INTO profiles (id, email, full_name, role, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        args: [id, sessionEmail, fullName, sessionRole],
      });
      return {
        id,
        email: sessionEmail,
        full_name: fullName,
        role: sessionRole,
      };
    }
  } catch {
    return {
      id: 'owner-1',
      email: sessionEmail,
      full_name: 'Prithibi Mandi',
      role: sessionRole,
    };
  }
}

export function canManagePeople(role: UserRole): boolean {
  return ['OWNER', 'ADMIN', 'PEOPLE_MANAGER'].includes(role);
}

export function canIssueCertificates(role: UserRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role);
}

export function canManageSettings(role: UserRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'OWNER';
}
