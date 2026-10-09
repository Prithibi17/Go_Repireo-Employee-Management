import React, { useEffect, useState, useCallback } from 'react';
import { SettingsClient } from '@/components/settings/SettingsClient';
import { useAuth } from '@/context/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    setLoading(true);
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading settings...</div>;
  }

  if (!data?.settings) {
    return <div className="p-8 text-center text-sm text-red-500">Failed to load company settings.</div>;
  }

  const canEdit = Boolean(user && ['OWNER', 'ADMIN'].includes(user.role));
  const isOwner = Boolean(user && user.role === 'OWNER');

  return (
    <SettingsClient
      settings={data.settings}
      departments={data.departments || []}
      canEdit={canEdit}
      isOwner={isOwner}
      onRefresh={loadSettings}
    />
  );
}
