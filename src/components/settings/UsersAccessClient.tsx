import React, { useEffect, useState } from 'react';
import { Profile, UserRole, EnrolledFaceAccount } from '@/types';
import { ShieldCheck, CheckCircle2, ScanFace, Camera, Sparkles } from 'lucide-react';
import { FaceEnrollModal } from '@/components/auth/FaceEnrollModal';

interface UsersAccessClientProps {
  profiles: Profile[];
  currentUserId: string;
  isOwner: boolean;
  onRefresh?: () => void;
}

export function UsersAccessClient({ profiles, currentUserId, isOwner, onRefresh }: UsersAccessClientProps) {
  const [loading, setLoading] = useState(false);
  const [enrolledFaces, setEnrolledFaces] = useState<EnrolledFaceAccount[]>([]);
  const [selectedUserForFace, setSelectedUserForFace] = useState<{ email: string; name: string } | null>(null);

  const fetchEnrolledFaces = () => {
    fetch('/api/auth/face-accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.accounts)) {
          setEnrolledFaces(data.accounts);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchEnrolledFaces();
  }, []);

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to update user role');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Users & Access Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage system administrators, HR managers, and dual-factor Face ID credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedUserForFace({ email: 'samyaksingh1845@gmail.com', name: 'Samyak Singh' })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Camera className="w-3.5 h-3.5" />
          Assign Face to User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              System Authorized Members
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {profiles.length} Users Enrolled • {enrolledFaces.length} Face IDs Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Face Recognition</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Role Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((profile) => {
                const faceCredential = enrolledFaces.find(
                  (f) => f.email.toLowerCase() === profile.email.toLowerCase()
                );

                return (
                  <tr key={profile.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                        {profile.full_name.charAt(0)}
                      </div>
                      <div>
                        <p>{profile.full_name}</p>
                        {profile.id === currentUserId && (
                          <span className="text-[10px] text-blue-600 font-semibold">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{profile.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        {profile.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {faceCredential ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Enrolled</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUserForFace({ email: profile.email, name: profile.full_name })
                            }
                            className="ml-1 text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                          >
                            Update
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserForFace({ email: profile.email, name: profile.full_name })
                          }
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-medium transition cursor-pointer"
                        >
                          <ScanFace className="w-3 h-3 text-slate-500" />
                          Assign Face
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isOwner ? (
                        <select
                          disabled={loading}
                          value={profile.role}
                          onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                          className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          <option value="OWNER">OWNER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="PEOPLE_MANAGER">PEOPLE_MANAGER</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400">Owner restricted</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Face Enrollment Modal */}
      {selectedUserForFace && (
        <FaceEnrollModal
          isOpen={Boolean(selectedUserForFace)}
          onClose={() => setSelectedUserForFace(null)}
          defaultEmail={selectedUserForFace.email}
          defaultName={selectedUserForFace.name}
          onSuccess={() => {
            setSelectedUserForFace(null);
            fetchEnrolledFaces();
          }}
        />
      )}
    </div>
  );
}

