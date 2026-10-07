import React from 'react';

export const dynamic = 'force-dynamic';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canManageSettings } from '@/lib/auth';
import { SettingsClient } from '@/components/settings/SettingsClient';

export default async function SettingsPage() {
  const settings = await DataService.getCompanySettings();
  const departments = await DataService.getDepartments();
  const currentUser = await getCurrentUser();

  return (
    <SettingsClient
      settings={settings}
      departments={departments}
      canEdit={canManageSettings(currentUser.role)}
    />
  );
}
