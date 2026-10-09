import React, { useEffect, useState, useCallback } from 'react';
import { OfferLetterListTable } from '@/components/documents/OfferLetterListTable';
import { OfferLetterFormModal } from '@/components/documents/OfferLetterFormModal';
import { useAuth } from '@/context/AuthContext';
import { OfferLetter } from '@/types';
import { Plus } from 'lucide-react';

export function OfferLettersPage() {
  const { user } = useAuth();
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadOfferLetters = useCallback(() => {
    setLoading(true);
    fetch('/api/offer-letters')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOfferLetters(data.offerLetters || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOfferLetters();
  }, [loadOfferLetters]);

  const canManage = Boolean(user && ['OWNER', 'ADMIN', 'PEOPLE_MANAGER'].includes(user.role));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Offer Letters
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official Go_Repireo job and internship offer letters rendered in high-fidelity vector PDF.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Offer Letter
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
          Loading offer letters...
        </div>
      ) : (
        <OfferLetterListTable
          offerLetters={offerLetters}
          canManage={canManage}
          onRefresh={loadOfferLetters}
          onCreateNew={() => setShowCreateModal(true)}
        />
      )}

      {/* Offer Letter Form Modal */}
      {showCreateModal && (
        <OfferLetterFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadOfferLetters();
          }}
        />
      )}
    </div>
  );
}
