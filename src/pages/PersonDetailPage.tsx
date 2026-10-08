import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PersonProfileClient } from '@/components/people/PersonProfileClient';
import { useAuth } from '@/context/AuthContext';

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadPerson = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/people/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadPerson();
  }, [loadPerson]);

  if (loading && !data) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading profile details...</div>;
  }

  if (!data?.person) {
    return <div className="p-8 text-center text-sm text-red-500">Person not found.</div>;
  }

  const { person, company, activityLogs } = data;
  const activeInternship = person.internships?.[0] || null;
  const activeIdCard = person.id_cards?.find((c: any) => c.status === 'ACTIVE') || person.id_cards?.[0] || null;
  const certificates = person.certificates || [];

  return (
    <PersonProfileClient
      person={person}
      activeInternship={activeInternship}
      activeIdCard={activeIdCard}
      certificates={certificates}
      company={company}
      activityLogs={activityLogs || []}
      userRole={user?.role || 'VIEWER'}
      onRefresh={loadPerson}
    />
  );
}
