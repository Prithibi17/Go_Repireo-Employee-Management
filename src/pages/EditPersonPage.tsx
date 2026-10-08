import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PersonForm } from '@/components/people/PersonForm';
import { Department, Person } from '@/types';
import { ArrowLeft } from 'lucide-react';

export function EditPersonPage() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/people/${id}`).then((r) => r.json()),
      fetch('/api/departments').then((r) => r.json()),
      fetch('/api/people').then((r) => r.json()),
    ])
      .then(([personData, deptData, peopleData]) => {
        if (personData.success) setPerson(personData.person);
        if (deptData.success) setDepartments(deptData.departments);
        if (peopleData.success) {
          setManagers(peopleData.people.filter((p: Person) => p.person_type === 'EMPLOYEE' && p.id !== id));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading person details...</div>;
  }

  if (!person) {
    return <div className="p-8 text-center text-sm text-red-500">Person not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <Link
          to={`/people/${person.id}`}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Edit Profile: {person.full_name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Staff ID: <span className="font-mono font-semibold text-slate-700">{person.person_code}</span> • Permanent Identifier
          </p>
        </div>
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
