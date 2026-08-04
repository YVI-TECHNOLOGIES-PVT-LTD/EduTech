import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApplication, useWorkflow, type WorkflowActionType } from '../hooks/useAdmission';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import { useAuth } from '../../../context/AuthContext';
import { mapStatusToEnterpriseLabel } from '../utils/statusMapper';
import {
    ArrowLeft, CheckCircle, XCircle, Clock,
    User, Phone, Mail, MapPin, School,
    FileText, MessageSquare, ShieldCheck,
    Briefcase
} from 'lucide-react';
import { PaymentPendingPanel } from '../components/PaymentPendingPanel';
import { AdmissionPaymentPanel } from '../components/AdmissionPaymentPanel';
import { AdmissionTimeline, getAdmissionTimelineSteps } from '../components/AdmissionTimeline';


interface ApplicationDetailsProps {
    id?: string;
    mode?: 'page' | 'drawer';
    onActionSuccess?: () => void;
}

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
    id: propId,
    mode = 'page',
    onActionSuccess
}) => {
    const { id: paramId } = useParams();
    const id = propId || paramId;
    const navigate = useNavigate();
    const { hasRole, hasPermission, user } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };
    const { application: app, isLoading: loading, refetch: fetchDetails } = useApplication(id);
    const { executeAction } = useWorkflow(id);
    const [remark, setRemark] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const isStaff = AdmissionPermissions.isStaff(permCtx);

    const handleActionComplete = async () => {
        await fetchDetails();
        setRemark('');
        if (onActionSuccess) onActionSuccess();
    };

    const handleAction = async (action: 'review' | 'recommend' | 'approve' | 'reject' | 'verify') => {
        if (!remark && action !== 'review') {
            alert('Please provide a remark');
            return;
        }
        setActionLoading(true);
        try {
            await executeAction(action as WorkflowActionType, { remark });
            await handleActionComplete();
        } catch (error) {
            console.error(`${action} failed`, error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDecideLogin = async (status: 'APPROVED' | 'REJECTED' | 'BLOCKED') => {
        if (!remark && status !== 'APPROVED') {
            alert('Please provide a reason in the remarks field.');
            return;
        }
        setActionLoading(true);
        try {
            await executeAction('decide_login', { remark, status });
            await handleActionComplete();
        } catch (error) {
            console.error('Login decision failed', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleInitiatePayment = async (amount: number) => {
        setActionLoading(true);
        try {
            await executeAction('initiate_payment', { amount });
            await fetchDetails();
        } catch (error) {
            console.error('Initiate payment failed', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitPayment = async (data: { mode: string; reference: string; proof_url?: string }) => {
        setActionLoading(true);
        try {
            await executeAction('submit_payment', data);
            await fetchDetails();
        } catch (error) {
            console.error('Submit payment failed', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyFee = async (status: 'verified' | 'correction', remarks: string) => {
        setActionLoading(true);
        try {
            await executeAction('verify_fee', { remark: remarks, status });
            await handleActionComplete();
        } catch (error) {
            console.error('Verify fee failed', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEnrol = async () => {
        if (!confirm('Are you sure you want to enrol this applicant as a student? This will create their student profile.')) return;
        setActionLoading(true);
        try {
            await executeAction('enrol');
            if (onActionSuccess) onActionSuccess();
            await fetchDetails();
            alert('Applicant successfully enrolled as student!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Enrolment failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading application details...</div>;
    if (!app) return <div className="p-8 text-center text-red-500">Application not found</div>;

    // Filter audit logs for non-staff
    const publicActions = [
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCS_VERIFIED', 
        'PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 
        'PAYMENT_CORRECTION', 'RECOMMENDED', 'APPROVED', 'REJECTED', 'ENROLLED'
    ];
    const filteredLogs = app.admission_audit_logs?.filter(log =>
        isStaff || publicActions.includes(log.action.toUpperCase())
    ) || [];

    return (
        <div className={`${mode === 'page' ? 'p-6 max-w-5xl mx-auto' : 'h-full flex flex-col'}`}>
            {mode === 'page' && (
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            )}

            <div className={`flex flex-col ${mode === 'page' ? 'md:flex-row' : ''} gap-6 ${mode === 'drawer' ? 'overflow-y-auto p-6 scrollbar-hide' : ''}`}>
                {/* Main Info */}
                <div className="flex-1 space-y-6">
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{app.student_name}</h1>
                                <p className="text-gray-500 mt-1">Application ID: {app.id}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100`}>
                                    {mapStatusToEnterpriseLabel(app.status)}
                                </span>
                                {app.applicant && (
                                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${app.applicant.login_status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' :
                                        app.applicant.login_status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                        Login: {app.applicant.login_status}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Student Profile</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span>DOB: {new Date(app.date_of_birth).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span>Gender: {app.gender}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <School className="w-4 h-4 text-gray-400" />
                                        <span>Grade: {app.grade_applied_for}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Parent Details</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span>{app.parent_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{app.parent_phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span>{app.parent_email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-50">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Address</h3>
                            <div className="flex items-start gap-3 text-gray-700">
                                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                                <span>{app.address || 'No address provided'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Audit Logs */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Application Timeline
                        </h3>
                        <div className="space-y-6">
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="relative pl-8 border-l-2 border-gray-100 last:border-0 pb-6 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900 uppercase tracking-tight text-sm">{log.action.replace('_', ' ')}</p>
                                            <p className="text-gray-600 text-sm mt-1">{log.remarks}</p>
                                            {isStaff && (
                                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {log.users?.full_name || 'Staff Member'}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Status (Visible to Parent if payment enabled or billing initialized) */}
                    {!isStaff && (app.payment_enabled || (app.status !== 'draft' && app.status !== 'submitted' && app.status !== 'under_review')) && (
                        <AdmissionPaymentPanel
                            app={app}
                            onPaymentSubmit={handleSubmitPayment}
                            actionLoading={actionLoading}
                        />
                    )}
                </div>

                {/* Actions Sidebar */}
                <div className="w-full md:w-80 space-y-6">
                    {/* Visual Application Timeline */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            Processing Timeline
                        </h3>
                        <AdmissionTimeline steps={getAdmissionTimelineSteps(app.status, app.admission_audit_logs)} />
                    </div>

                    {isStaff && (
                        <>
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                Take Action
                            </h3>
                            <div className="space-y-4">
                                {app.status === 'approved' && hasPermission('admission.enrol') && (
                                    <div className="space-y-4">
                                        {app.applicant?.login_status !== 'APPROVED' && (
                                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
                                                <strong>Admission approved</strong>, but login access is still <strong>{app.applicant?.login_status}</strong>. Approve login below to enable enrollment.
                                            </div>
                                        )}
                                        <button
                                            onClick={handleEnrol}
                                            disabled={actionLoading || app.applicant?.login_status !== 'APPROVED'}
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                                        >
                                            <Briefcase className="w-5 h-5" />
                                            Manual Enrollment
                                        </button>
                                    </div>
                                )}

                                {AdmissionPermissions.canDecideLogin(permCtx) && app.applicant && app.applicant.login_status !== 'APPROVED' && (
                                    <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                                        <p className="text-sm font-bold text-gray-600 mb-2">Login Access Control</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDecideLogin('APPROVED')}
                                                disabled={actionLoading}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-all"
                                            >
                                                Approve Login
                                            </button>
                                            <button
                                                onClick={() => handleDecideLogin('REJECTED')}
                                                disabled={actionLoading || !remark}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-50"
                                            >
                                                Reject Login
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {app.status !== 'enrolled' && app.status !== 'rejected' && (
                                    <>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            placeholder="Add your remarks or reason for rejection..."
                                            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none h-32"
                                        />

                                        <div className="grid gap-2">
                                            {app.status === 'submitted' && hasPermission('admission.review') && (
                                                <button
                                                    onClick={() => handleAction('review')}
                                                    disabled={actionLoading}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-100"
                                                >
                                                    Start Review
                                                </button>
                                            )}

                                            {app.status === 'under_review' && hasPermission('admission.review') && (
                                                <button
                                                    onClick={() => handleAction('verify')}
                                                    disabled={actionLoading}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-100"
                                                >
                                                    Verify Documents
                                                </button>
                                            )}

                                            {(app.status === 'docs_verified' || app.status === 'payment_pending' || app.status === 'payment_correction') && hasPermission('admission.review') && (
                                                <div className="pt-4 border-t border-gray-100">
                                                    <PaymentPendingPanel
                                                        app={app}
                                                        handleAction={(action: string) => {
                                                            if (action === 'fetch') fetchDetails();
                                                            if (onActionSuccess) onActionSuccess();
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {app.status === 'payment_submitted' && hasPermission('admission.approve') && (
                                                <div className="space-y-2 border-t pt-4">
                                                    <p className="text-sm font-bold text-gray-600">Payment Verification</p>
                                                    <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                                                        <p>Mode: {app.payment_mode}</p>
                                                        <p>Ref: {app.payment_reference}</p>
                                                        {app.payment_proof && <a href={app.payment_proof} target="_blank" rel="noreferrer" className="text-blue-600 underline">View Proof</a>}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleVerifyFee('verified', remark || 'Payment verified')}
                                                            disabled={actionLoading}
                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition-all"
                                                        >
                                                            Verify
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyFee('correction', remark || 'Need correction')}
                                                            disabled={actionLoading || !remark}
                                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg text-sm transition-all shadow-sm"
                                                        >
                                                            Correction
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {app.status === 'payment_verified' && hasPermission('admission.recommend') && (
                                                <button
                                                    onClick={() => handleAction('recommend')}
                                                    disabled={actionLoading}
                                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-100"
                                                >
                                                    Recommend to HOI
                                                </button>
                                            )}

                                            {app.status === 'recommended' && hasPermission('admission.approve') && (
                                                <button
                                                    onClick={() => handleAction('approve')}
                                                    disabled={actionLoading}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-100"
                                                >
                                                    Final Approve
                                                </button>
                                            )}

                                            {['submitted', 'under_review', 'docs_verified', 'payment_pending', 'payment_submitted', 'payment_verified', 'recommended'].includes(app.status) && hasPermission('admission.reject') && (
                                                <button
                                                    onClick={() => handleAction('reject')}
                                                    disabled={actionLoading}
                                                    className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-100 font-bold py-3 rounded-xl transition-all"
                                                >
                                                    Reject Application
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
                                <MessageSquare className="w-4 h-4" />
                                Internal Notes
                            </div>
                            <p className="text-xs text-indigo-600 leading-relaxed">
                                {isStaff ? "These remarks are visible to all staff members but restricted for parents based on action type." : ""}
                            </p>
                        </div>
                    </>)}
                </div>
            </div>
        </div>
    );
};
