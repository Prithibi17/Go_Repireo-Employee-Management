import React, { useEffect, useState, useCallback } from 'react';
import { UsersAccessClient } from '@/components/settings/UsersAccessClient';
import { useAuth } from '@/context/AuthContext';
import { Profile } from '@/types';

export function UsersAccessPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(() => {
    setLoading(true);
    fetch('/api/settings/users')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProfiles(json.profiles);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading user roles...</div>;
  }

  return (
    <UsersAccessClient
      profiles={profiles}
      currentUserId={user?.id || ''}
      isOwner={user?.role === 'OWNER'}
      onRefresh={loadProfiles}
    />
  );
}
