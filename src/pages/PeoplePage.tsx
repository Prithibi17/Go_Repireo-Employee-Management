import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Eye, CreditCard, ChevronRight } from 'lucide-react';
import { PeopleFilterBar } from '@/components/people/PeopleFilterBar';
import { PersonAvatar, PersonStatusBadge, PersonTypeBadge } from '@/components/ui/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { Department, Person } from '@/types';

export function PeoplePage() {
  const [searchParams] = useSearchParams();
  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDepartments(data.departments);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = searchParams.toString();
    fetch(`/api/people${query ? `?${query}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPeople(data.people);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            People
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Directory of employees, interns, active assignments and ID cards.
          </p>
        </div>
        <Link
          to="/people/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Person
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <PeopleFilterBar departments={departments} />

      {/* People Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
          Loading people directory...
        </div>
      ) : people.length === 0 ? (
        <EmptyState
          title="No people records found"
          description="Try modifying your filters, search keyword, or add a new person to the directory."
          actionHref="/people/new"
          actionLabel="Add New Person"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Person</th>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Department / Designation</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {people.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link href={`/people/${person.id}`} className="flex items-center gap-3 hover:text-blue-600">
                        <PersonAvatar name={person.full_name} photoUrl={person.profile_photo_path} size="sm" />
                        <div>
                          <p className="truncate group-hover:underline">{person.full_name}</p>
                          <p className="text-[11px] text-slate-400 font-normal">{person.company_email || person.personal_email || 'No email'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                      {person.person_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <PersonTypeBadge type={person.person_type} />
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">{person.designation}</p>
                      <p className="text-xs text-slate-500">{person.department?.name || 'General'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDate(person.joining_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <PersonStatusBadge status={person.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/people/${person.id}`}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Profile
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
