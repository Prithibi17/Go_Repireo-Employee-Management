import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Person, Internship, IdCard, Certificate, CompanySettings, ActivityLog } from '@/types';
import { PersonAvatar, PersonStatusBadge, PersonTypeBadge } from '@/components/ui/Badges';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { IDCardDocument } from '@/components/documents/IDCardDocument';
import { CertificateDocument } from '@/components/documents/CertificateDocument';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate, formatDateTime } from '@/lib/utils';
import { 
  CreditCard, Award, CheckCircle2, Archive, 
  RefreshCw, Ban, Plus, Building2, Calendar, MapPin, 
  Mail, Phone, Clock, FileText, Activity, ShieldCheck, Trash2, Edit,
  TrendingUp, Sparkles, ArrowRight
} from 'lucide-react';

interface PersonProfileClientProps {
  person: Person;
  activeInternship?: Internship | null;
  activeIdCard?: IdCard | null;
  certificates: Certificate[];
  company: CompanySettings;
  activityLogs: ActivityLog[];
  userRole: string;
  onRefresh?: () => void;
}

export function PersonProfileClient({
  person,
  activeInternship,
  activeIdCard,
  certificates,
  company,
  activityLogs,
  userRole,
  onRefresh,
}: PersonProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'idcard' | 'certificates' | 'activity'>('overview');
  const [loading, setLoading] = useState(false);

  // Dialog States
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [promoteFormData, setPromoteFormData] = useState({
    designation: person.designation || 'Software Engineer',
    department_id: person.department_id || '',
    work_location: person.work_location || 'Kolkata, WB',
    employment_type: 'Full-time' as any,
    reissue_id_card: true,
  });

  const projectedEmpCode = person.person_code.startsWith('GRI-')
    ? 'GRE-' + person.person_code.slice(4)
    : (person.person_code.startsWith('GRE-') ? person.person_code : 'GRE-' + person.person_code);

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionDate, setCompletionDate] = useState(
    activeInternship?.end_date || new Date().toISOString().split('T')[0]
  );
  const [completionNotes, setCompletionNotes] = useState('');
  const [deactivateIdOnComplete, setDeactivateIdOnComplete] = useState(false);

  const [showGenerateIdDialog, setShowGenerateIdDialog] = useState(false);
  const [showRevokeIdDialog, setShowRevokeIdDialog] = useState(false);
  const [revokeIdReason, setRevokeIdReason] = useState('');

  const [showIssueCertDialog, setShowIssueCertDialog] = useState(false);
  const [certFormData, setCertFormData] = useState({
    recipient_name: person.full_name,
    role: activeInternship?.internship_title || person.designation,
    department: person.department?.name || 'Technology',
    domain: activeInternship?.domain || 'Software Development',
    project: activeInternship?.project_name || '',
    start_date: activeInternship?.start_date || person.joining_date,
    end_date: activeInternship?.final_end_date || activeInternship?.end_date || new Date().toISOString().split('T')[0],
    issue_date: new Date().toISOString().split('T')[0],
    signatory_name: company.signatory_name || 'Prithibi Mandi',
    signatory_designation: company.signatory_designation || 'Founder & CEO',
  });

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null);
  const [showDeleteCertDialog, setShowDeleteCertDialog] = useState(false);

  const handleDeleteCertificate = async () => {
    if (!certToDelete) return;
    setLoading(true);
    try {
      const res = await fetch('/api/certificates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate_id: certToDelete.id }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteCertDialog(false);
        setCertToDelete(null);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to delete certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleGenerateId = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/id-cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: person.id }),
      });
      const data = await res.json();
      if (data.success) {
        setShowGenerateIdDialog(false);
        setActiveTab('idcard');
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to generate ID card');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeId = async () => {
    if (!activeIdCard) return;
    setLoading(true);
    try {
      const res = await fetch('/api/id-cards/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: activeIdCard.id,
          reason: revokeIdReason || 'Administrative revocation',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRevokeIdDialog(false);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to revoke ID card');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToEmployee = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/people/${person.id}/promote-to-employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoteFormData),
      });
      const data = await res.json();
      if (data.success) {
        setShowPromoteDialog(false);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to promote intern to employee');
      }
    } catch {
      alert('Network error while promoting intern');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInternship = async () => {
    if (!activeInternship) return;
    setLoading(true);
    try {
      const res = await fetch('/api/internships/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internship_id: activeInternship.id,
          final_end_date: completionDate,
          completion_notes: completionNotes,
          deactivate_id_card: deactivateIdOnComplete,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCompleteDialog(false);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to complete internship');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!activeInternship) return;
    setLoading(true);
    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_id: person.id,
          internship_id: activeInternship.id,
          ...certFormData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowIssueCertDialog(false);
        setActiveTab('certificates');
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to issue certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/people/${person.id}/archive`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setShowArchiveDialog(false);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to archive person');
      }
    } finally {
      setLoading(false);
    }
  };

  const isEligibleForCert = person.person_type === 'INTERN' && person.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <PersonAvatar name={person.full_name} photoUrl={person.profile_photo_path} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{person.full_name}</h1>
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                  {person.person_code}
                </span>
                <PersonTypeBadge type={person.person_type} />
                <PersonStatusBadge status={person.status} />
              </div>
              <p className="text-sm font-semibold text-slate-700">{person.designation}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {person.department?.name || 'General Department'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {formatDate(person.joining_date)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {person.work_location || 'Kolkata, WB'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Generate or Reissue ID Card */}
            <button
              onClick={() => setShowGenerateIdDialog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              {activeIdCard ? 'Reissue ID Card' : 'Generate ID Card'}
            </button>

            {/* Complete Internship Action (Only for active interns) */}
            {person.person_type === 'INTERN' && person.status === 'ACTIVE' && (
              <button
                onClick={() => setShowCompleteDialog(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete Internship
              </button>
            )}

            {/* Generate Certificate Action (Available when completed) */}
            {person.person_type === 'INTERN' && (person.status === 'COMPLETED' || userRole === 'OWNER') && (
              <button
                onClick={() => setShowIssueCertDialog(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition"
              >
                <Award className="w-3.5 h-3.5" />
                Generate Certificate
              </button>
            )}

            {/* Promote Intern to Employee Action */}
            {person.person_type === 'INTERN' && (
              <button
                onClick={() => setShowPromoteDialog(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition"
                title="Promote Intern to Full-Time Employee"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Promote to Employee
              </button>
            )}

            {/* Edit Profile Action */}
            <Link
              to={`/people/${person.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition"
            >
              <Edit className="w-3.5 h-3.5 text-slate-600" />
              Edit Profile
            </Link>

            {/* Archive */}
            {person.status !== 'ARCHIVED' && (
              <button
                onClick={() => setShowArchiveDialog(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Archive Person"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completed Internship Promotion Banner */}
      {person.person_type === 'INTERN' && person.status === 'COMPLETED' && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-indigo-50 border border-emerald-200/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 text-xl shrink-0">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Internship Completed</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Ready for Full-Time
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                This candidate has completed their tenure. You can issue their certificate or promote them to full-time Employee with Staff ID <strong className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{projectedEmpCode}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowIssueCertDialog(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg shadow-xs transition"
            >
              Generate Certificate
            </button>
            <button
              onClick={() => setShowPromoteDialog(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Promote to Employee
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview & Details' },
          { id: 'idcard', label: `ID Card (${activeIdCard ? '1 Active' : 'None'})` },
          { id: 'certificates', label: `Certificates (${certificates.length})` },
          { id: 'activity', label: 'Activity & Audit Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Professional & Internship Info */}
            {person.person_type === 'INTERN' && activeInternship && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Internship Details</h2>
                  <PersonStatusBadge status={activeInternship.status} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Domain / Track:</span>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{activeInternship.domain}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">College / University:</span>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{activeInternship.college_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Course / Degree:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{activeInternship.course || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Mode & Stipend:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{activeInternship.mode} ({activeInternship.stipend || 'Unpaid / Certificate'})</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Internship Tenure:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {formatDate(activeInternship.start_date)} – {formatDate(activeInternship.final_end_date || activeInternship.end_date)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Assigned Project:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{activeInternship.project_name || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic & Contact Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">Contact & Address Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Company Email:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{person.company_email || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Personal Email:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{person.personal_email || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Phone Number:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{person.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Date of Birth:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formatDate(person.date_of_birth)}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-medium">Residential Address:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {[person.address_line, person.city, person.state, person.postal_code, person.country].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Private HR Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Internal Private HR</span>
              </div>
              <p className="text-[11px] text-slate-500">
                These fields are never exposed on ID cards or public verification pages.
              </p>

              <div className="space-y-3 text-xs pt-2">
                <div>
                  <span className="text-slate-400 font-medium">Emergency Contact:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{person.emergency_contact_name || 'Not provided'}</p>
                  <p className="text-slate-600 mt-0.5">{person.emergency_contact_phone || '—'}</p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-medium">Internal Notes:</span>
                  <p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                    {person.internal_notes || 'No notes added.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ID CARD */}
      {activeTab === 'idcard' && (
        <div className="space-y-6">
          {activeIdCard ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Official Go_Repireo ID Card</h2>
                    <StatusBadge status={activeIdCard.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Card Ref: <code className="font-mono font-bold text-slate-800">{activeIdCard.card_number}</code> • Issued: {formatDate(activeIdCard.issued_at)}
                  </p>
                </div>
                {activeIdCard.status === 'ACTIVE' && (
                  <button
                    onClick={() => setShowRevokeIdDialog(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Revoke ID Card
                  </button>
                )}
              </div>

              {/* Render ID Card with front and back */}
              <IDCardDocument
                card={activeIdCard}
                person={person}
                company={company}
                appUrl="https://go-repireo-employee-management.vercel.app"
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Active ID Card</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Issue an official company vertical ID card with encrypted QR verification for this person.
              </p>
              <button
                onClick={() => setShowGenerateIdDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate ID Card
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {certificates.length > 0 ? (
            <div className="space-y-8">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 font-mono">
                          {cert.certificate_number}
                        </h3>
                        <StatusBadge status={cert.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Issued: {formatDate(cert.issue_date)} • Role: {cert.role_snapshot} ({cert.department_snapshot})
                      </p>
                    </div>

                    {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                      <button
                        onClick={() => {
                          setCertToDelete(cert);
                          setShowDeleteCertDialog(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Certificate
                      </button>
                    )}
                  </div>

                  <CertificateDocument
                    certificate={cert}
                    company={company}
                    appUrl="https://go-repireo-employee-management.vercel.app"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <Award className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Certificates Issued</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                {person.status === 'COMPLETED'
                  ? 'The internship has been marked as completed. You can now issue an official certificate.'
                  : 'Certificates can be generated once the intern completes their internship tenure.'}
              </p>
              {person.person_type === 'INTERN' && (
                <button
                  onClick={() => setShowIssueCertDialog(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  <Award className="w-3.5 h-3.5" />
                  Generate Certificate
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVITY / AUDIT LOG */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Audit History & Activity Log
          </h2>

          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-500">No activity logged for this record yet.</p>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-l-2 border-blue-500 pl-4 py-1">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">
                      {log.action.replace('_', ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      By {log.actor_name} on {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= CONFIRMATION DIALOGS ================= */}

      {/* 1. Complete Internship Dialog */}
      <ConfirmDialog
        isOpen={showCompleteDialog}
        title="Complete Internship"
        description="Mark this internship tenure as successfully completed. This will update the status to COMPLETED and enable official certificate generation."
        confirmLabel="Complete Internship"
        variant="primary"
        isLoading={loading}
        onConfirm={handleCompleteInternship}
        onCancel={() => setShowCompleteDialog(false)}
      >
        <div className="space-y-3 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Final End Date</label>
            <input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Completion Remarks</label>
            <textarea
              rows={2}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g. Successfully completed full-stack tasks on time."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={deactivateIdOnComplete}
              onChange={(e) => setDeactivateIdOnComplete(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-slate-600 font-medium">Deactivate active ID card upon completion</span>
          </label>
        </div>
      </ConfirmDialog>

      {/* 2. Generate ID Card Dialog */}
      <ConfirmDialog
        isOpen={showGenerateIdDialog}
        title={activeIdCard ? 'Reissue ID Card' : 'Generate ID Card'}
        description={
          activeIdCard
            ? 'Reissuing will immediately revoke the current ID card. The physical QR on the old card will resolve to REVOKED, while a new tamper-proof QR is issued.'
            : 'Generate an official company ID card with a secure verification QR code.'
        }
        confirmLabel={activeIdCard ? 'Reissue Card' : 'Generate ID'}
        variant="primary"
        isLoading={loading}
        onConfirm={handleGenerateId}
        onCancel={() => setShowGenerateIdDialog(false)}
      />

      {/* 3. Revoke ID Dialog */}
      <ConfirmDialog
        isOpen={showRevokeIdDialog}
        title="Revoke ID Card?"
        description="The physical card's QR code will remain scannable, but its public verification page will immediately show that the ID is REVOKED."
        confirmLabel="Revoke ID"
        variant="danger"
        isLoading={loading}
        onConfirm={handleRevokeId}
        onCancel={() => setShowRevokeIdDialog(false)}
      >
        <div className="pt-2 text-xs">
          <label className="block font-semibold text-slate-700 mb-1">Reason for Revocation</label>
          <input
            type="text"
            required
            value={revokeIdReason}
            onChange={(e) => setRevokeIdReason(e.target.value)}
            placeholder="e.g. Lost physical card / Resignation / Early departure"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
          />
        </div>
      </ConfirmDialog>

      {/* 4. Issue Certificate Dialog */}
      <ConfirmDialog
        isOpen={showIssueCertDialog}
        title="Issue Internship Certificate"
        description="Prepare and issue an official corporate internship certificate. The certificate number will be generated in sequence and snapshot data permanently locked."
        confirmLabel="Issue Certificate"
        variant="primary"
        isLoading={loading}
        onConfirm={handleIssueCertificate}
        onCancel={() => setShowIssueCertDialog(false)}
      >
        <div className="space-y-3 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recipient Name</label>
            <input
              type="text"
              value={certFormData.recipient_name}
              onChange={(e) => setCertFormData({ ...certFormData, recipient_name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role Title</label>
              <input
                type="text"
                value={certFormData.role}
                onChange={(e) => setCertFormData({ ...certFormData, role: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={certFormData.department}
                onChange={(e) => setCertFormData({ ...certFormData, department: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Name (Optional)</label>
            <input
              type="text"
              value={certFormData.project}
              onChange={(e) => setCertFormData({ ...certFormData, project: e.target.value })}
              placeholder="e.g. Go_Repireo People Platform"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={certFormData.start_date}
                onChange={(e) => setCertFormData({ ...certFormData, start_date: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={certFormData.end_date}
                onChange={(e) => setCertFormData({ ...certFormData, end_date: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>
      </ConfirmDialog>

      {/* 5. Archive Dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        title="Archive Person Record?"
        description="Archiving will remove this person from active listings while safely preserving all historical ID credentials, certificates, and QR verification resolution."
        confirmLabel="Archive Record"
        variant="warning"
        isLoading={loading}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveDialog(false)}
      />

      {/* 6. Delete Certificate Dialog */}
      <ConfirmDialog
        isOpen={showDeleteCertDialog}
        title="Delete Certificate Permanently?"
        description={`Are you sure you want to completely delete certificate ${certToDelete?.certificate_number}? This will remove it from the system entirely so it no longer appears in the list or scans.`}
        confirmLabel="Delete Certificate"
        variant="danger"
        isLoading={loading}
        onConfirm={handleDeleteCertificate}
        onCancel={() => {
          setShowDeleteCertDialog(false);
          setCertToDelete(null);
        }}
      />

      {/* 7. Promote Intern to Full-Time Employee Dialog */}
      <ConfirmDialog
        isOpen={showPromoteDialog}
        title="Promote Intern to Full-Time Employee"
        description="Transition this candidate from Intern to full-time Employee status. Their Staff ID code will seamlessly update from GRI to GRE with the same 7-character suffix, and a new official Employee ID Card will be generated."
        confirmLabel="Confirm & Promote to Employee"
        variant="primary"
        isLoading={loading}
        onConfirm={handlePromoteToEmployee}
        onCancel={() => setShowPromoteDialog(false)}
      >
        <div className="space-y-4 pt-2 text-xs">
          {/* ID Transition Visualization */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Current Intern ID</p>
              <p className="font-mono text-sm font-bold text-slate-700">{person.person_code}</p>
            </div>
            <div className="flex items-center text-indigo-600 font-bold gap-1 text-xs">
              <span>Promoting</span>
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-[11px] text-indigo-600 font-semibold uppercase">New Employee ID</p>
              <p className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {projectedEmpCode}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Designation / Title</label>
              <input
                type="text"
                required
                value={promoteFormData.designation}
                onChange={(e) => setPromoteFormData({ ...promoteFormData, designation: e.target.value })}
                placeholder="e.g. Associate Software Engineer"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
              <select
                value={promoteFormData.employment_type}
                onChange={(e) => setPromoteFormData({ ...promoteFormData, employment_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Location</label>
            <input
              type="text"
              value={promoteFormData.work_location}
              onChange={(e) => setPromoteFormData({ ...promoteFormData, work_location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={promoteFormData.reissue_id_card}
              onChange={(e) => setPromoteFormData({ ...promoteFormData, reissue_id_card: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-700 font-medium">
              Immediately issue new official Employee ID Card with <strong className="font-mono">{projectedEmpCode}</strong>
            </span>
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
}
