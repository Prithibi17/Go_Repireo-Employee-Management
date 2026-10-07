import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { DataService } from '@/services/dataService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PersonAvatar, PersonTypeBadge } from '@/components/ui/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { CreditCard, Eye, Plus } from 'lucide-react';

export default async function IdCardsPage() {
  const cards = await DataService.getIdCards();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ID Cards
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official Go_Repireo employee and intern identification credentials with digital QR verification.
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No ID cards generated yet"
          description="Go to any employee or intern profile to issue their official identification card."
          actionHref="/people"
          actionLabel="View People Directory"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Card Holder</th>
                  <th className="py-3 px-4">Person ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Issued</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <Link href={`/people/${card.person?.id}`} className="flex items-center gap-3 font-semibold text-slate-900 hover:text-blue-600">
                        <PersonAvatar name={card.person?.full_name || 'Holder'} photoUrl={card.person?.profile_photo_path} size="sm" />
                        <div>
                          <p className="truncate group-hover:underline">{card.person?.full_name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{card.card_number}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                      {card.person?.person_code}
                    </td>
                    <td className="py-3.5 px-4">
                      {card.person && <PersonTypeBadge type={card.person.person_type} />}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {card.person?.designation}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDate(card.valid_from)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDate(card.valid_until)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={card.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/id-cards/${card.id}`}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View / Print
                      </Link>
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
