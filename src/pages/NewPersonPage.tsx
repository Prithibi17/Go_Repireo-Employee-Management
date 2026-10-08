import React, { useEffect, useState } from 'react';
import { PersonForm } from '@/components/people/PersonForm';
import { Department, Person } from '@/types';

export function NewPersonPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/departments').then((r) => r.json()),
      fetch('/api/people').then((r) => r.json()),
    ])
      .then(([deptData, peopleData]) => {
        if (deptData.success) setDepartments(deptData.departments);
        if (peopleData.success) {
          setManagers(peopleData.people.filter((p: Person) => p.person_type === 'EMPLOYEE'));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        Loading form...
      </div>
    );
  }

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
