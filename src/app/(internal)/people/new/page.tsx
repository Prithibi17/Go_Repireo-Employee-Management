import React from 'react';
import { DataService } from '@/services/dataService';
import { PersonForm } from '@/components/people/PersonForm';

export default async function NewPersonPage() {
  const departments = await DataService.getDepartments();
  const allPeople = await DataService.getPeople();
  const managers = allPeople.filter((p) => p.person_type === 'EMPLOYEE');

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Add Person
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Create an official employee or intern identity record at Go_Repireo.
        </p>
      </div>

      <PersonForm departments={departments} managers={managers} />
    </div>
  );
}
