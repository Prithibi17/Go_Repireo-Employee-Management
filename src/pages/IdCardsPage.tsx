import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PersonAvatar, PersonTypeBadge, PersonCodeChip } from '@/components/ui/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { CreditCard, Eye } from 'lucide-react';
import { IdCard } from '@/types';

export function IdCardsPage() {
  const [cards, setCards] = useState<IdCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/id-cards')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCards(data.cards);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Identity Cards
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Active employee and intern identification credentials with cryptographic QR verification.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-zinc-200/80 p-8 text-center text-[13px] text-zinc-400">
          Loading credentials...
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No credentials generated yet"
          description="Navigate to any personnel profile to issue an official identity card."
          actionHref="/people"
          actionLabel="View Personnel Directory"
        />
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-zinc-600">
              <thead className="bg-zinc-50/70 text-zinc-400 text-[11px] font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <tr>
                  <th className="py-2.5 px-4">Card Holder</th>
                  <th className="py-2.5 px-4">Staff ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Issued</th>
                  <th className="py-2.5 px-4">Valid Until</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-zinc-50/60 transition-colors group">
                    <td className="py-3 px-4">
                      <Link to={`/people/${card.person?.id}`} className="flex items-center gap-2.5 font-medium text-zinc-900 hover:text-zinc-600">
                        <PersonAvatar name={card.person?.full_name || 'Holder'} photoUrl={card.person?.profile_photo_path} size="sm" />
                        <div>
                          <p className="truncate font-medium">{card.person?.full_name}</p>
                          <p className="font-mono text-[10px] text-zinc-400">{card.card_number}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      {card.person && <PersonCodeChip code={card.person.person_code} />}
                    </td>
                    <td className="py-3 px-4">
                      {card.person && <PersonTypeBadge type={card.person.person_type} />}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-800">
                      {card.person?.designation}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-zinc-500">
                      {formatDate(card.valid_from)}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-zinc-500">
                      {formatDate(card.valid_until)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={card.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/id-cards/${card.id}`}
                        className="px-2.5 py-1 text-[12px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 opacity-60" />
                        View
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
