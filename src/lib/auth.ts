import { cookies } from 'next/headers';
import { UserRole } from '@/types';
import { getTursoClient } from './turso';

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const sessionRole = (cookieStore.get('gr_user_role')?.value as UserRole) || 'OWNER';
  const sessionEmail = cookieStore.get('gr_user_email')?.value || 'owner@gorepireo.in';

  // Read actual profiles from Turso or ensure default owner profile exists
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
      // Create owner profile in Turso if not exists
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
