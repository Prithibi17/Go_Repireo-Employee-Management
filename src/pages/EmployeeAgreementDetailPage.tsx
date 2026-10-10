import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EmployeeAgreementDocument } from '@/components/documents/EmployeeAgreementDocument';
import { useAuth } from '@/context/AuthContext';
import { EmployeeAgreement, ActivityLog } from '@/types';
import { ArrowLeft, Activity } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export function EmployeeAgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [agreement, setAgreement] = useState<EmployeeAgreement | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAgreement = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/employee-agreements/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAgreement(data.agreement);
          setActivityLogs(data.activityLogs || []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadAgreement();
  }, [loadAgreement]);

  if (loading && !agreement) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading employee agreement...</div>;
  }

  if (!agreement) {
    return <div className="p-8 text-center text-sm text-rose-500">Employee agreement not found.</div>;
  }

  const canManage = Boolean(user && ['OWNER', 'ADMIN', 'PEOPLE_MANAGER'].includes(user.role));

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/employee-agreements"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Employee Agreement: {agreement.agreement_number}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Recipient: <strong className="text-slate-700">{agreement.recipient_title} {agreement.recipient_name}</strong> &bull; Date: <strong className="text-slate-700">{agreement.agreement_date}</strong>
            </p>
          </div>
        </div>

        {agreement.person_id && (
          <Link
            to={`/people/${agreement.person_id}`}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View Employee Profile &rarr;
          </Link>
        )}
      </div>

      {/* Main 3-Page Document Facsimile & Actions */}
      <EmployeeAgreementDocument
        agreement={agreement}
        canManage={canManage}
        onRefresh={loadAgreement}
      />

      {/* Activity Logs */}
      {activityLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Audit Trail
          </h3>
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="border-l-2 border-indigo-500 pl-3 py-1">
                <p className="text-xs font-bold text-slate-800">{log.action.replace(/_/g, ' ')}</p>
                <p className="text-[11px] text-slate-500">
                  By {log.actor_name} on {formatDateTime(log.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
