import React, { useState, useEffect } from 'react';
import { Award, UserCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { admissionApi } from '../../../admission.api';
import { toast } from 'sonner';

interface EnrollmentWorkspaceProps {
  applications?: any[];
  isLoading?: boolean;
  refetch?: () => void;
}

export function EnrollmentWorkspace({ refetch: parentRefetch }: EnrollmentWorkspaceProps) {
  const [approvedApps, setApprovedApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [rollNo, setRollNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadApproved = async () => {
    setIsLoading(true);
    try {
      const res = await admissionApi.getApprovedApplications();
      const list = res.data || res || [];
      setApprovedApps(list);
      if (list.length > 0 && !selectedAppId) {
        setSelectedAppId(list[0].application_id);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load approved applications inbox');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApproved();
  }, []);

  const activeApp = approvedApps.find((a) => a.application_id === selectedAppId) || null;

  const handleEnroll = async () => {
    if (!selectedAppId) return;
    setIsSubmitting(true);
    try {
      const res = await admissionApi.enrollCandidate(selectedAppId, {
        section_id: selectedSectionId || undefined,
        roll_number: rollNo || undefined,
        remarks: remarks || undefined,
      });
      const data = res.data || res;
      if (data.is_existing) {
        toast.info(`Candidate already enrolled (Admission No: ${data.student?.admission_no})`);
      } else {
        toast.success(
          `Candidate successfully enrolled! Generated Admission No: ${data.student?.admission_no}`,
        );
      }
      await loadApproved();
      if (parentRefetch) parentRefetch();
    } catch (e: any) {
      toast.error(e?.message || 'Enrollment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Queue List */}
      <div className="bg-white dark:bg-card p-5 border rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600" /> Approved Candidates Queue
          </h3>
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-[10px] font-black text-indigo-700">
            {approvedApps.length}
          </span>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-xs text-gray-400 animate-pulse p-4 text-center">
              Loading approved inbox...
            </p>
          ) : approvedApps.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-bold">No approved applications pending enrollment desk.</p>
            </div>
          ) : (
            approvedApps.map((app) => {
              const isSelected = selectedAppId === app.application_id;
              return (
                <div
                  key={app.application_id}
                  onClick={() => {
                    setSelectedAppId(app.application_id);
                    setSelectedSectionId('');
                    setRollNo('');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                      : 'hover:bg-gray-50 border-gray-150 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs truncate">{app.student_name}</p>
                    {app.is_enrolled && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                        Enrolled
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase mt-1">
                    <span>
                      #{app.application_number} • {app.grade_name}
                    </span>
                    <span className="text-indigo-600">{app.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Provisioning & Identity Panel */}
      <div className="lg:col-span-2 bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-5">
        {activeApp ? (
          <>
            <div className="pb-3 border-b flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-gray-900">{activeApp.student_name}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">
                  App ID: #{activeApp.application_number} • Grade: {activeApp.grade_name}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={loadApproved} className="h-8 gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Re-sync Inbox
              </Button>
            </div>

            {/* Candidate & Parent Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Parent Contact
                </span>
                <p className="font-semibold text-gray-800 mt-0.5">{activeApp.contact_name}</p>
                <p className="text-gray-500 text-[11px]">{activeApp.contact_phone}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Academic Year</span>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {activeApp.academic_year_name || 'Current Year'}
                </p>
                <p className="text-gray-500 text-[11px]">{activeApp.grade_name}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Enrollment Status
                </span>
                <p className="font-bold text-emerald-600 mt-0.5">
                  {activeApp.is_enrolled
                    ? `Enrolled (${activeApp.student?.admission_no})`
                    : 'Pending Onboarding'}
                </p>
              </div>
            </div>

            {/* Section & Roll Number Form */}
            <div className="p-4 border rounded-xl bg-indigo-50/30 space-y-4">
              <h4 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" /> Section & Academic Allocation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Assigned Section (Schema Mapped)
                  </label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full border rounded-lg p-2.5 bg-white h-9 text-xs"
                  >
                    <option value="">-- Select Section --</option>
                    {activeApp.available_sections?.map((sec: any) => (
                      <option key={sec.section_id} value={sec.section_id}>
                        Section {sec.section_name} (Cap: {sec.capacity || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Roll Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="e.g. 01"
                    className="w-full border rounded-lg p-2.5 bg-white h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                size="sm"
                onClick={handleEnroll}
                disabled={isSubmitting}
                className="text-xs bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4 gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting
                  ? 'Processing Enrollment...'
                  : activeApp.is_enrolled
                    ? 'Re-confirm Enrollment'
                    : 'Finalize & Create Student Master'}
              </Button>
            </div>

            {/* Enrollment Confirmation Result Card */}
            {activeApp.is_enrolled && activeApp.student && (
              <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/40 space-y-3 text-xs">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" /> Enrollment Confirmation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-700 font-medium">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">
                      Admission No
                    </span>
                    <span className="font-black text-gray-900 text-sm">
                      {activeApp.student.admission_no}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">
                      Student ID
                    </span>
                    <span className="font-mono text-gray-800 text-[11px] truncate block">
                      {activeApp.student.student_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">
                      Parent Link
                    </span>
                    <span className="font-bold text-emerald-700 uppercase text-[10px]">
                      Linked & Primary
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">
                      Academic Status
                    </span>
                    <span className="font-bold text-emerald-700 uppercase text-[10px]">
                      Active Enrolled
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-bold">
              Select an approved candidate from the queue to process enrollment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnrollmentWorkspace;
