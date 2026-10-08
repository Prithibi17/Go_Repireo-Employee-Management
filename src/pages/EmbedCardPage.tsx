import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { IDCardDocument } from '@/components/documents/IDCardDocument';
import { PublicCardApiResponse } from '@/types';
import { ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';

export function EmbedCardPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const [searchParams] = useSearchParams();
  const side = searchParams.get('side') || 'both'; // 'both', 'front', 'back'

  const [data, setData] = useState<PublicCardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) return;
    setLoading(true);
    fetch(`/api/public/cards/${encodeURIComponent(identifier)}`)
      .then(async (res) => {
        const json: PublicCardApiResponse = await res.json();
        if (json.success && json.found) {
          setData(json);
        } else {
          setError(json.message || 'ID Card not found');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch ID card data');
      })
      .finally(() => setLoading(false));
  }, [identifier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading verified credential...</span>
        </div>
      </div>
    );
  }

  if (error || !data || !data.card || !data.person) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-sm font-semibold text-slate-800">Credential Not Found</p>
          <p className="text-xs text-slate-500 mt-1">
            {error || 'No active ID card was found for this identifier.'}
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-2 bg-slate-100 py-1 px-2 rounded">
            {identifier}
          </p>
        </div>
      </div>
    );
  }

  const { card, person, company } = data;

  // Map to format expected by IDCardDocument
  const cardObj: any = {
    id: card.id,
    card_number: card.card_number,
    status: card.status,
    issued_at: card.issued_at,
    valid_from: card.valid_from,
    valid_until: card.valid_until,
    public_verification_code: card.public_verification_code,
  };

  const personObj: any = {
    id: person.id,
    person_code: person.person_code,
    full_name: person.full_name,
    person_type: person.person_type,
    designation: person.designation,
    status: person.status,
    profile_photo_path: person.avatar_url,
    department: {
      name: person.department,
    },
  };

  const companyObj: any = {
    company_name: company?.name || 'Go_Repireo',
    legal_name: company?.legal_name,
    tagline: company?.tagline || 'Learn • Build • Grow',
    website: company?.website || 'https://gorepireo.in',
    support_email: company?.support_email || 'contact@gorepireo.in',
    logo_url: company?.logo_url || '/gorepireo-logo.png',
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      <div className="scale-[0.88] sm:scale-100 origin-top flex flex-col items-center">
        <IDCardDocument
          card={cardObj}
          person={personObj}
          company={companyObj}
          appUrl={window.location.origin}
          showActions={false}
        />

        {/* Embed Verification Footer */}
        <div className="mt-4 flex items-center justify-between w-full max-w-[580px] px-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-700">Official Go_Repireo Credential</span>
          </div>
          <a
            href={card.verification_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            <span>Verify Live</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
