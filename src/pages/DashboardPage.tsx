import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCheck, GraduationCap, Award, 
  ArrowUpRight, Clock, Plus, ChevronRight
} from 'lucide-react';
import { PersonAvatar, PersonStatusBadge, PersonTypeBadge, PersonCodeChip } from '@/components/ui/Badges';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, calculateDaysRemaining } from '@/lib/utils';

export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/metrics')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200/70 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-zinc-200/80" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-xl border border-zinc-200/80" />
      </div>
    );
  }

  const { metrics, endingSoon, recentPeople, recentCertificates } = data || {
    metrics: { totalPeople: 0, activeEmployees: 0, activeInterns: 0, certificatesIssued: 0 },
    endingSoon: [],
    recentPeople: [],
    recentCertificates: [],
  };

  const statCards = [
    {
      title: 'Total Personnel',
      value: metrics.totalPeople,
      icon: Users,
    },
    {
      title: 'Active Employees',
      value: metrics.activeEmployees,
      icon: UserCheck,
    },
    {
      title: 'Active Interns',
      value: metrics.activeInterns,
      icon: GraduationCap,
    },
    {
      title: 'Certificates Issued',
      value: metrics.certificatesIssued,
      icon: Award,
    },
  ];

  return (
    <div className="space-y-7">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Workforce Overview
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Real-time status of employees, interns, active identity cards, and certificates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/people/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Person
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-[12px] font-medium text-zinc-500">
                  {card.title}
                </span>
                <Icon className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Internships Ending Soon (Approx 30 Days) */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-[13px] font-medium text-zinc-900">
              Internships Ending Soon (30 Days)
            </h2>
          </div>
          <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/80">
            {endingSoon.length} Active
          </span>
        </div>

        {endingSoon.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-zinc-400">
            No active internships ending within the next 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-zinc-600">
              <thead className="bg-zinc-50/70 text-zinc-400 text-[11px] font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <tr>
                  <th className="py-2.5 px-4">Intern</th>
                  <th className="py-2.5 px-4">Role / Domain</th>
                  <th className="py-2.5 px-4">End Date</th>
                  <th className="py-2.5 px-4">Time Remaining</th>
                  <th className="py-2.5 px-4">Supervisor</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {endingSoon.map((item: any) => {
                  const days = calculateDaysRemaining(item.end_date);
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4 font-medium text-zinc-900">
                        <Link to={`/people/${item.person?.id}`} className="hover:text-zinc-600 flex items-center gap-2.5">
                          <PersonAvatar name={item.person?.full_name || 'Intern'} photoUrl={item.person?.profile_photo_path} size="sm" />
                          <span>{item.person?.full_name}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">{item.internship_title}</td>
                      <td className="py-3 px-4 text-zinc-700">{formatDate(item.end_date)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          days <= 7 
                            ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20' 
                            : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${days <= 7 ? 'bg-rose-600' : 'bg-amber-600'}`} />
                          {days > 0 ? `${days} days left` : 'Ending Today'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">{item.supervisor?.full_name || 'Management'}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/people/${item.person?.id}`}
                          className="inline-flex items-center text-[12px] font-medium text-zinc-900 hover:text-zinc-600"
                        >
                          Review
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5 opacity-60" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Recent People & Recent Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent People */}
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-zinc-900">
              Recent Personnel
            </h2>
            <Link
              to="/people"
              className="text-[12px] font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            >
              View directory
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-[13px] text-zinc-600">
              <thead className="bg-zinc-50/70 text-zinc-400 text-[11px] font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <tr>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentPeople.map((person: any) => (
                  <tr key={person.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <Link to={`/people/${person.id}`} className="flex items-center gap-2.5 text-zinc-900 hover:text-zinc-600">
                        <PersonAvatar name={person.full_name} photoUrl={person.profile_photo_path} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{person.full_name}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{person.designation}</p>
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
                      <PersonStatusBadge status={person.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Certificates */}
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-zinc-900">
              Recent Certificates
            </h2>
            <Link
              to="/certificates"
              className="text-[12px] font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </Link>
          </div>

          {recentCertificates.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-zinc-400 my-auto">
              No certificates issued yet. Complete an internship to issue official credentials.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-[13px] text-zinc-600">
                <thead className="bg-zinc-50/70 text-zinc-400 text-[11px] font-medium uppercase tracking-wider border-b border-zinc-200/60">
                  <tr>
                    <th className="py-2.5 px-4">Certificate No.</th>
                    <th className="py-2.5 px-4">Recipient</th>
                    <th className="py-2.5 px-4">Issue Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentCertificates.map((cert: any) => (
                    <tr key={cert.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <Link to={`/certificates/${cert.id}`} className="font-mono text-[11px] text-zinc-900 hover:underline">
                          {cert.certificate_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-900">
                        {cert.recipient_name_snapshot}
                      </td>
                      <td className="py-3 px-4 text-[12px] text-zinc-500">
                        {formatDate(cert.issue_date)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={cert.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
