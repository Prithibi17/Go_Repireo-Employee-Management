import React from 'react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { DataService } from '@/services/dataService';
import { IDCardDocument } from '@/components/documents/IDCardDocument';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, User } from 'lucide-react';

interface IdCardDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IdCardDetailPage({ params }: IdCardDetailPageProps) {
  const { id } = await params;
  const card = await DataService.getIdCardById(id);

  if (!card || !card.person) {
    notFound();
  }

  const company = await DataService.getCompanySettings();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/id-cards"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {card.card_number}
              </h1>
              <StatusBadge status={card.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued for <span className="font-semibold text-slate-700">{card.person.full_name}</span> ({card.person.person_code})
            </p>
          </div>
        </div>

        <Link
          href={`/people/${card.person.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition"
        >
          <User className="w-3.5 h-3.5" />
          View Profile
        </Link>
      </div>

      {/* ID Card Renderer */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <IDCardDocument
          card={card}
          person={card.person}
          company={company}
          appUrl={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
        />
      </div>
    </div>
  );
}
