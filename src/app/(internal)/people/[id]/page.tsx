import React from 'react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { DataService } from '@/services/dataService';
import { getCurrentUser } from '@/lib/auth';
import { PersonProfileClient } from '@/components/people/PersonProfileClient';

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { id } = await params;
  const person = await DataService.getPersonById(id);

  if (!person) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const company = await DataService.getCompanySettings();
  const activityLogs = await DataService.getActivityLogsForEntity('PERSON', person.id);

  const activeInternship = person.internships?.[0] || null;
  const activeIdCard = person.id_cards?.find((c) => c.status === 'ACTIVE') || person.id_cards?.[0] || null;
  const certificates = person.certificates || [];

  return (
    <PersonProfileClient
      person={person}
      activeInternship={activeInternship}
      activeIdCard={activeIdCard}
      certificates={certificates}
      company={company}
      activityLogs={activityLogs}
      userRole={currentUser.role}
    />
  );
}
