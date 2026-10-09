import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { PeopleFilterBar } from '@/components/people/PeopleFilterBar';
import { PersonAvatar, PersonStatusBadge, PersonTypeBadge, PersonCodeChip } from '@/components/ui/Badges';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Personnel Directory
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Internal directory of employees, interns, departments, and credentials.
          </p>
        </div>
        <Link
          to="/people/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Person
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <PeopleFilterBar departments={departments} />

      {/* People Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-zinc-200/80 p-8 text-center text-[13px] text-zinc-400">
          Loading directory...
        </div>
      ) : people.length === 0 ? (
        <EmptyState
          title="No records found"
          description="Try modifying your filters, search keyword, or add a new person to the directory."
          actionHref="/people/new"
          actionLabel="Add New Person"
        />
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px] text-zinc-600">
              <thead className="bg-zinc-50/70 text-zinc-400 text-[11px] font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <tr>
                  <th className="py-2.5 px-4">Person</th>
                  <th className="py-2.5 px-4">Staff ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Department / Designation</th>
                  <th className="py-2.5 px-4">Joining Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {people.map((person) => (
                  <tr key={person.id} className="hover:bg-zinc-50/60 transition-colors group">
                    <td className="py-3 px-4 font-medium text-zinc-900">
                      <Link to={`/people/${person.id}`} className="flex items-center gap-2.5 hover:text-zinc-600">
                        <PersonAvatar name={person.full_name} photoUrl={person.profile_photo_path} size="sm" />
                        <div>
                          <p className="truncate font-medium">{person.full_name}</p>
                          <p className="text-[11px] text-zinc-400 font-normal">{person.company_email || person.personal_email || 'No email'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <PersonCodeChip code={person.person_code} />
                    </td>
                    <td className="py-3 px-4">
                      <PersonTypeBadge type={person.person_type} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-zinc-900">{person.designation}</p>
                      <p className="text-[11px] text-zinc-400">{person.department?.name || 'General'}</p>
                    </td>
                    <td className="py-3 px-4 text-[12px] text-zinc-600">
                      {formatDate(person.joining_date)}
                    </td>
                    <td className="py-3 px-4">
                      <PersonStatusBadge status={person.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/people/${person.id}`}
                          className="px-2.5 py-1 text-[12px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 opacity-60" />
                          View
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
