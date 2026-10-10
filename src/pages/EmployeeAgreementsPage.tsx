import React, { useEffect, useState, useCallback } from 'react';
import { EmployeeAgreementListTable } from '@/components/documents/EmployeeAgreementListTable';
import { EmployeeAgreementFormModal } from '@/components/documents/EmployeeAgreementFormModal';
import { useAuth } from '@/context/AuthContext';
import { EmployeeAgreement } from '@/types';
import { Plus, FileCheck } from 'lucide-react';

export function EmployeeAgreementsPage() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<EmployeeAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadAgreements = useCallback(() => {
    setLoading(true);
    fetch('/api/employee-agreements')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAgreements(data.agreements || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  const canManage = Boolean(user && ['OWNER', 'ADMIN', 'PEOPLE_MANAGER'].includes(user.role));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-indigo-600" />
            Employee Agreements
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official 3-page Go_Repireo employee and internship agreements with intact legal terms and vector typography.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Agreement
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
          Loading employee agreements...
        </div>
      ) : (
        <EmployeeAgreementListTable
          agreements={agreements}
          canManage={canManage}
          onRefresh={loadAgreements}
          onCreateNew={() => setShowCreateModal(true)}
        />
      )}

      {/* Employee Agreement Form Modal */}
      {showCreateModal && (
        <EmployeeAgreementFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAgreements();
          }}
        />
      )}
    </div>
  );
}
