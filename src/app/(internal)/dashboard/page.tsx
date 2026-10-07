import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { DataService } from '@/services/dataService';
import { 
  Users, UserCheck, GraduationCap, Award, 
  ArrowUpRight, Clock, Plus, ChevronRight, AlertCircle
} from 'lucide-react';
import { PersonAvatar, PersonStatusBadge, PersonTypeBadge } from '@/components/ui/Badges';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, calculateDaysRemaining } from '@/lib/utils';

export default async function DashboardPage() {
  const data = await DataService.getDashboardMetrics();
  const { metrics, endingSoon, recentPeople, recentCertificates } = data;

  const statCards = [
    {
      title: 'Total People',
      value: metrics.totalPeople,
      icon: Users,
      color: 'text-slate-900',
      bg: 'bg-white',
      border: 'border-slate-200',
    },
    {
      title: 'Active Employees',
      value: metrics.activeEmployees,
      icon: UserCheck,
      color: 'text-indigo-600',
      bg: 'bg-white',
      border: 'border-slate-200',
    },
    {
      title: 'Active Interns',
      value: metrics.activeInterns,
      icon: GraduationCap,
      color: 'text-teal-600',
      bg: 'bg-white',
      border: 'border-slate-200',
    },
    {
      title: 'Certificates Issued',
      value: metrics.certificatesIssued,
      icon: Award,
      color: 'text-blue-600',
      bg: 'bg-white',
      border: 'border-slate-200',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Employee Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage Go_Repireo employees, interns, official ID credentials and certificates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/people/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Person
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`p-5 rounded-xl border ${card.border} ${card.bg} shadow-xs flex items-center justify-between`}
            >
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-slate-50 border border-slate-100 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Internships Ending Soon (Approx 30 Days) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Internships Ending Soon (Next 30 Days)
            </h2>
          </div>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {endingSoon.length} Active
          </span>
        </div>

        {endingSoon.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No active internships ending within the next 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">Intern</th>
                  <th className="py-3 px-4">Role / Domain</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Days Remaining</th>
                  <th className="py-3 px-4">Supervisor</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {endingSoon.map((item) => {
                  const days = calculateDaysRemaining(item.end_date);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <Link href={`/people/${item.person?.id}`} className="hover:underline flex items-center gap-2.5">
                          <PersonAvatar name={item.person?.full_name || 'Intern'} photoUrl={item.person?.profile_photo_path} size="sm" />
                          <span>{item.person?.full_name}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">{item.internship_title}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{formatDate(item.end_date)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          days <= 7 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {days > 0 ? `${days} days left` : 'Ending Today'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{item.supervisor?.full_name || 'Founder Desk'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/people/${item.person?.id}`}
                          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Review & Complete
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent People */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent People
            </h2>
            <Link
              href="/people"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPeople.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <Link href={`/people/${person.id}`} className="flex items-center gap-2.5 font-medium text-slate-900 hover:underline">
                        <PersonAvatar name={person.full_name} photoUrl={person.profile_photo_path} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{person.full_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{person.designation}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                      {person.person_code}
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Certificates
            </h2>
            <Link
              href="/certificates"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCertificates.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 my-auto">
              No certificates issued yet. Complete an internship to issue official certificates.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-3 px-4">Certificate No.</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                        <Link href={`/certificates/${cert.id}`} className="hover:underline text-blue-600">
                          {cert.certificate_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {cert.recipient_name_snapshot}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
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
