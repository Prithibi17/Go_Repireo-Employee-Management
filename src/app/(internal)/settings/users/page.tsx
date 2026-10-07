import React from 'react';

export const dynamic = 'force-dynamic';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canManageUsers } from '@/lib/auth';
import { UsersAccessClient } from '@/components/settings/UsersAccessClient';

export default async function UsersAccessPage() {
  const profiles = await DataService.getProfiles();
  const currentUser = await getCurrentUser();

  return (
    <UsersAccessClient
      profiles={profiles}
      currentUserId={currentUser.id}
      isOwner={canManageUsers(currentUser.role)}
    />
  );
}
