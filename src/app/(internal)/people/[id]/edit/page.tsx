import React from 'react';
import { notFound } from 'next/navigation';
import { DataService } from '@/services/dataService';
import { PersonForm } from '@/components/people/PersonForm';

export const dynamic = 'force-dynamic';

interface EditPersonPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  const { id } = await params;
  const person = await DataService.getPersonById(id);

  if (!person) {
    notFound();
  }

  const departments = await DataService.getDepartments();
  const allPeople = await DataService.getPeople();
  const managers = allPeople.filter((p) => p.person_type === 'EMPLOYEE' && p.id !== person.id);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Profile — {person.full_name}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Update personal information, role details, and internship tracking for <span className="font-mono font-semibold text-slate-700">{person.person_code}</span>.
        </p>
      </div>

      <PersonForm
        departments={departments}
        managers={managers}
        initialData={person}
        personId={person.id}
      />
    </div>
  );
}
