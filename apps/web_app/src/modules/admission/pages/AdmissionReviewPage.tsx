import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Admission, AdmissionDocument, AdmissionAuditLog } from '../admission.types';
import { useApplication, useWorkflow, useApplicationProgress, type WorkflowActionType } from '../hooks/useAdmission';
import { useAuth } from '../../../context/AuthContext';
import { mapStatusToEnterpriseLabel, mapStatusToColor, mapStatusToStep } from '../utils/statusMapper';
import {
    CheckCircle2,
    Clock,
    FileText,
    ShieldCheck,
    User,
    Phone,
    Mail,
    MapPin,
    School,
    ArrowLeft,
    ChevronRight,
    AlertCircle,
    Image as ImageIcon,
    FileSearch,
    CreditCard,
    Star,
    Trophy,
    GraduationCap,
    Send,
    ExternalLink,
    History,
    MoreVertical,
    Check
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import { Textarea } from '../../../components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '../../../components/ui/dialog';
import { toast } from 'sonner';
import { Switch } from '../../../components/ui/switch';
import { PaymentPendingPanel } from '../components/PaymentPendingPanel';

// Glassmorphism Utility
const GLASS_BASE = "backdrop-blur-xl bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl";
const GLASS_HOVER = "hover:bg-white/15 dark:hover:bg-white/5 transition-all duration-500 ease-out hover:border-white/30 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]";

export const AdmissionReviewPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { hasPermission, hasRole } = useAuth();
    const { application: app, isLoading: loading, refetch: fetchDetails } = useApplication(id);
    const { executeAction, isSubmitting: submitting } = useWorkflow(id);
    const { progress: progressData } = useApplicationProgress(id);
    const displayProgress = progressData?.progressPercent ?? 0;
    const [remarks, setRemarks] = useState('');
    const [showConfirm, setShowConfirm] = useState<{ type: string; action: () => void } | null>(null);

    const handleAction = async (action: string, data?: any) => {
        if (action === 'fetch') {
            fetchDetails();
            return;
        }
        try {
            await executeAction(action as WorkflowActionType, {
                remark: remarks,
                ...data,
                status: data?.status,
                fee_ids: data?.fee_ids,
                amount: data?.amount,
            });
            toast.success(`Action ${action.replace('_', ' ')} successful`);
            setRemarks('');
            fetchDetails();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Action failed');
        } finally {
            setShowConfirm(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading Mission Control...</p>
            </motion.div>
        </div>
    );

    if (!app) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Application Not Found</h2>
                <Button onClick={() => navigate('/app/admissions/review')} className="mt-4">Back to Queue</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f3f4f6]/50 dark:bg-[#020617] p-4 md:p-8 space-y-8">
            <StickyHeader app={app} onBack={() => navigate(-1)} progressPercent={displayProgress} />

            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
                <ApplicantSnapshot app={app} />
                <StatusRenderer app={app} remarks={remarks} setRemarks={setRemarks} submitting={submitting} handleAction={handleAction} />
            </div>

            <div className="mt-12">
                <AuditTimeline logs={app.admission_audit_logs || []} />
            </div>

            <Dialog open={!!showConfirm} onOpenChange={() => setShowConfirm(null)}>
                <DialogContent className="max-w-md bg-white/90 backdrop-blur-2xl border-white/20">
                    <DialogHeader>
                        <DialogTitle className="uppercase tracking-tight font-black">Confirm Execution</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to proceed with this {showConfirm?.type.replace('_', ' ')} action? This transition may be irreversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setShowConfirm(null)}>Cancel</Button>
                        <Button
                            className={showConfirm?.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                            onClick={() => showConfirm?.action()}
                        >
                            Proceed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const StickyHeader = ({ app, onBack, progressPercent }: { app: Admission; onBack: () => void; progressPercent: number }) => {
    const label = mapStatusToEnterpriseLabel(app.status);
    const color = mapStatusToColor(app.status);
    const step = mapStatusToStep(app.status);

    return (
        <header className={`sticky top-4 z-40 ${GLASS_BASE} p-4 md:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6`}>
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} className="rounded-xl hover:bg-black/5 dark:hover:bg-white/10">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        {app.student_name}
                        <Badge className={`${color} text-white border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest`}>
                            {label}
                        </Badge>
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">App ID: {app.id.toUpperCase()}</p>
                </div>
            </div>

            <div className="flex-1 max-w-md w-full px-4 text-center">
                <div className="flex justify-between mb-2 px-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Progress</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{Math.round(progressPercent)}% Complete</span>
                </div>
                <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className={`h-full ${color} shadow-[0_0_20px_rgba(59,130,246,0.3)]`}
                    />
                </div>
                <div className="flex justify-between mt-2 overflow-x-auto scrollbar-hide py-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                        <div key={s} className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${step >= s ? color : 'bg-gray-200 dark:bg-gray-800'}`} />
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-xl border-dashed">
                    <History className="w-4 h-4 mr-2" />
                    History
                </Button>
                <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                        <Avatar key={i} className="w-8 h-8 border-2 border-white dark:border-[#0f172a]">
                            <AvatarFallback className="text-[10px] bg-gray-100">ST</AvatarFallback>
                        </Avatar>
                    ))}
                </div>
            </div>
        </header>
    );
};

const ApplicantSnapshot = ({ app }: { app: Admission }) => {
    return (
        <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${GLASS_BASE} p-8 sticky top-32 space-y-8`}
        >
            <div className="text-center space-y-4">
                <div className="relative inline-block">
                    <Avatar className="w-32 h-32 mx-auto border-4 border-white/50 shadow-2xl ring-4 ring-blue-500/10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.student_name}`} />
                        <AvatarFallback>{app.student_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Active Account" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{app.student_name}</h3>
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">{app.grade_applied_for}</p>
                </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Primary Dossier</h4>

                <div className="grid gap-5">
                    <DetailItem icon={<User className="w-4 h-4" />} label="DOB" value={new Date(app.date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                    <DetailItem icon={<Phone className="w-4 h-4" />} label="Guardian" value={app.parent_name || 'N/A'} />
                    <DetailItem icon={<Mail className="w-4 h-4" />} label="Email" value={app.parent_email || 'N/A'} />
                    <DetailItem icon={<MapPin className="w-4 h-4" />} label="Location" value={app.address || 'N/A'} />
                    <DetailItem icon={<School className="w-4 h-4" />} label="Prev. Institution" value={app.previous_school || 'N/A'} />
                </div>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <div className="flex items-center gap-3 text-blue-600 mb-3">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Academic Target</span>
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                    Applicant seeking entry into <span className="text-blue-600 font-black">{app.grade_applied_for}</span> for Academic Year {app.academic_years?.year_label || '2026-27'}. No disciplinary records flagged.
                </p>
            </div>
        </motion.aside>
    );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-4 group">
        <div className="p-2.5 bg-white/10 dark:bg-white/5 rounded-xl text-gray-400 group-hover:text-blue-500 transition-colors">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate max-w-[180px]">{value}</p>
        </div>
    </div>
);

const StatusRenderer = ({ app, remarks, setRemarks, submitting, handleAction }: any) => {
    return (
        <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={app.status}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "backOut" }}
                >
                    {(() => {
                        switch (app.status) {
                            case 'draft':
                            case 'submitted':
                                return <UnderReviewPanel {...{ app, remarks, setRemarks, submitting, handleAction }} />;
                            case 'under_review':
                            case 'docs_pending':
                                return <DocumentVerificationPanel {...{ app, remarks, setRemarks, submitting, handleAction }} />;
                            case 'docs_verified':
                            case 'document_verified':
                            case 'payment_pending':
                            case 'payment_correction':
                            case 'fee_pending':
                                return <PaymentPendingPanel {...{ app, remarks, setRemarks, submitting, handleAction }} />;
                            case 'payment_submitted':
                                return <PaymentVerifiedPanel {...{ app, remarks, setRemarks, submitting, handleAction }} />;
                            case 'payment_verified':
                            case 'fee_verified':
                                return <RecommendationPanel {...{ app, remarks, setRemarks, submitting, handleAction }} />;
                            case 'recommended':
                            case 'review_pending':
                            case 'merit_generated':
                            case 'interview':
                            case 'interview_completed':
                            case 'exam':
                            case 'exam_completed':
                                return <ApprovalPanel {...{ app, remarks, setRemarks, submitting, handleAction }} />;
                            case 'approved':
                            case 'offered':
                            case 'enrollment_pending':
                                return <EnrolledPanel {...{ app, loading: submitting, handleAction }} />;
                            case 'enrolled':
                                return <EnrolledSuccessState app={app} />;
                            case 'rejected':
                                return (
                                    <div className={`${GLASS_BASE} p-12 text-center space-y-4`}>
                                        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />
                                        <h2 className="text-2xl font-black uppercase text-gray-900">Application Rejected</h2>
                                        <p className="text-gray-500 max-w-md mx-auto">{app.rejection_reason}</p>
                                        <Button variant="outline" onClick={() => handleAction('review')} className="mt-4">Revoke Rejection</Button>
                                    </div>
                                );
                            case 'cancelled':
                                return (
                                    <div className={`${GLASS_BASE} p-12 text-center space-y-4`}>
                                        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
                                        <h2 className="text-2xl font-black uppercase text-gray-900">Application Cancelled</h2>
                                        <p className="text-gray-500 max-w-md mx-auto">This application has been cancelled by the applicant or officer.</p>
                                    </div>
                                );
                            default:
                                return <UnderReviewPanel {...{ app, remarks, setRemarks, submitting, handleAction }} />;
                        }
                    })()}
                </motion.div>
            </AnimatePresence>
        </motion.main>
    );
};

// --- PANELS ---

const UnderReviewPanel = ({ app, remarks, setRemarks, submitting, handleAction }: any) => (
    <div className={`${GLASS_BASE} p-8 space-y-8`}>
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Initial Review Phase</h3>
                <p className="text-sm font-medium text-gray-500">Validate baseline criteria and prepare for document audit.</p>
            </div>
            <div className="bg-blue-500/10 p-4 rounded-2xl">
                <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/10 space-y-4`}>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Checklist</h4>
                <div className="space-y-3">
                    <CheckItem label="Age eligibility verified" checked />
                    <CheckItem label="Previous school records attached" checked />
                    <CheckItem label="Parent contact details reachable" />
                    <CheckItem label="Medical disclosure provided" />
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal Assessment</h4>
                <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Document your initial findings here..."
                    className="min-h-[140px] bg-transparent border-white/20 rounded-2xl focus:ring-blue-500/20"
                />
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => handleAction('reject')} className="text-red-500 hover:bg-red-500/10 rounded-xl font-bold">Reject Application</Button>
            <Button
                onClick={() => handleAction('review')}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20"
            >
                {submitting ? 'Processing...' : 'Move to Document Verification'}
                <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    </div>
);

const DocumentVerificationPanel = ({ app, remarks, setRemarks, submitting, handleAction }: any) => {
    const documents: AdmissionDocument[] = app.admission_documents || [];

    return (
        <div className={`${GLASS_BASE} p-8 space-y-8`}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Technical Dossier Audit</h3>
                    <p className="text-sm font-medium text-gray-500">Perform rigorous validation of all legal and academic credentials.</p>
                </div>
                <div className="bg-indigo-500/10 p-4 rounded-2xl">
                    <FileSearch className="w-8 h-8 text-indigo-600" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.length > 0 ? documents.map(doc => (
                    <motion.div
                        whileHover={{ y: -5 }}
                        key={doc.id}
                        className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 bg-black/5 dark:bg-white/5"
                    >
                        {doc.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img src={doc.file_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={doc.document_type} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                                <FileText className="w-12 h-12" />
                                <span className="text-[10px] font-black uppercase tracking-widest">PDF Document</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                            <p className="text-xs font-black text-white uppercase tracking-widest truncate">{doc.document_type.replace('_', ' ')}</p>
                            <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                <Button size="sm" variant="secondary" className="h-7 text-[9px] font-black rounded-lg" asChild>
                                    <a href={doc.file_url} target="_blank" rel="noreferrer">PREVIEW</a>
                                </Button>
                                <Button size="sm" className="h-7 text-[9px] font-black rounded-lg bg-green-600 hover:bg-green-700">VERIFY</Button>
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-3xl">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No documents uploaded yet</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Comments</h4>
                <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Mandatory notes for the next stage..."
                    className="bg-transparent border-white/20 rounded-2xl"
                />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                <Button variant="ghost" onClick={() => handleAction('reject')} className="text-red-500 font-bold">Reject & Request Resubmission</Button>
                <Button
                    onClick={() => handleAction('verify')}
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20"
                >
                    {submitting ? 'Finalizing...' : 'Authorize & Move to Payment'}
                </Button>
            </div>
        </div>
    );
};

const PaymentVerifiedPanel = ({ app, remarks, setRemarks, submitting, handleAction }: any) => (
    <div className={`${GLASS_BASE} p-8 space-y-8`}>
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Revenue Verification</h3>
                <p className="text-sm font-medium text-gray-500">Finance team reconciliation of admission fee capture.</p>
            </div>
            <div className="bg-purple-500/10 p-4 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-purple-600" />
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <DataBox label="Payment Mode" value={app.payment_mode || 'N/A'} />
                    <DataBox label="Transaction ID" value={app.payment_reference || 'N/A'} />
                    <DataBox label="Amount Captured" value={`₹${app.payment_amount}`} />
                    <DataBox label="Date" value={app.payment_date ? new Date(app.payment_date).toLocaleDateString() : 'N/A'} />
                </div>

                <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase">Payment Receipt Proof</h4>
                        <p className="text-xs text-gray-500 mb-2">Attached by parent on {new Date(app.payment_date!).toLocaleDateString()}</p>
                        {app.payment_proof && (
                            <Button size="sm" variant="link" className="p-0 h-auto text-purple-600 font-bold" asChild>
                                <a href={app.payment_proof} target="_blank" rel="noreferrer">OPEN IN NEW TAB <ExternalLink className="w-3 h-3 ml-1" /></a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-6 border border-white/10 space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Finance Approval</h4>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border-2 border-purple-500 flex items-center justify-center bg-purple-500">
                            <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">Funds cleared in Bank</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border-2 border-purple-500 flex items-center justify-center bg-purple-500">
                            <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">Receipt Ledgered</span>
                    </div>
                </div>
                <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Finance internal note..."
                    className="bg-transparent border-white/20 text-xs"
                />
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
            <Button variant="ghost" className="text-yellow-600 font-bold" onClick={() => handleAction('verify_fee', { status: 'correction' })}>Request Correction</Button>
            <Button
                onClick={() => handleAction('verify_fee', { status: 'verified' })}
                disabled={submitting}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-12 h-12 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-purple-500/20"
            >
                {submitting ? 'Verifying...' : 'VERIFY & FORWARD TO RECOMMENDATION'}
            </Button>
        </div>
    </div>
);

const RecommendationPanel = ({ app, remarks, setRemarks, submitting, handleAction }: any) => (
    <div className={`${GLASS_BASE} p-8 space-y-8`}>
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Final Recommendation</h3>
                <p className="text-sm font-medium text-gray-500">Senior officer sign-off before House of Institution (HOI) approval.</p>
            </div>
            <div className="bg-indigo-500/10 p-4 rounded-2xl">
                <Send className="w-8 h-8 text-indigo-600" />
            </div>
        </div>

        <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <BadgeCheckIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide">Candidate Qualification Score</h4>
                    <p className="text-xs text-gray-500">Based on documents, interaction, and fee clearance.</p>
                </div>
            </div>

            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 fill-indigo-600 text-indigo-600" />)}
                <span className="ml-4 text-2xl font-black text-indigo-600">HIGH PRIORITY</span>
            </div>

            <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Final recommendation note for the HOI..."
                className="min-h-[120px] bg-white/5 border-white/20 rounded-2xl"
            />
        </div>

        <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => handleAction('reject')} className="text-red-500 font-bold">Deny Admission</Button>
            <Button
                onClick={() => handleAction('recommend')}
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-12 h-12 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-500/20"
            >
                {submitting ? 'Submitting...' : 'FORWARD TO HOI FOR APPROVAL'}
            </Button>
        </div>
    </div>
);

const ApprovalPanel = ({ app, remarks, setRemarks, submitting, handleAction }: any) => (
    <div className={`${GLASS_BASE} p-8 space-y-8 border-green-500/20`}>
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">HOI Final Approval</h3>
                <p className="text-sm font-medium text-gray-500">Granting formal admission and authorizing student master creation.</p>
            </div>
            <div className="bg-green-500/10 p-4 rounded-2xl">
                <Trophy className="w-8 h-8 text-green-600" />
            </div>
        </div>

        <div className="bg-green-600/5 border border-green-500/20 rounded-3xl p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
                <h4 className="text-2xl font-black text-gray-900">Authorizing Admission</h4>
                <p className="text-sm text-gray-500 max-w-lg mx-auto">
                    By clicking approve, you confirm that {app.student_name} has met all institutional requirements. A formal offer letter will be generated automatically.
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Badge variant="outline" className="px-4 py-2 border-green-500/30 text-green-700 bg-green-500/5 uppercase font-black text-[9px] tracking-widest">Grade: {app.grade_applied_for}</Badge>
                <Badge variant="outline" className="px-4 py-2 border-green-500/30 text-green-700 bg-green-500/5 uppercase font-black text-[9px] tracking-widest">Batch: {app.academic_years?.year_label || '2026-27'}</Badge>
                <Badge variant="outline" className="px-4 py-2 border-green-500/30 text-green-700 bg-green-500/5 uppercase font-black text-[9px] tracking-widest">Scholarship: N/A</Badge>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">HOI Remarks (Final)</h4>
            <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Formal approval remarks..."
                className="max-w-2xl mx-auto border-white/20 rounded-2xl bg-white/5"
            />
        </div>

        <div className="flex justify-center gap-4 pt-6">
            <Button variant="ghost" onClick={() => handleAction('reject')} className="text-red-500 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs">REJECT</Button>
            <Button
                onClick={() => handleAction('approve')}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-16 h-14 font-black uppercase tracking-widest text-xs shadow-2xl shadow-green-500/30"
            >
                {submitting ? 'Authorizing...' : 'FINALIZE ADMISSION'}
            </Button>
        </div>
    </div>
);

const EnrolledPanel = ({ app, loading, handleAction }: any) => (
    <div className={`${GLASS_BASE} p-12 text-center space-y-8 border-emerald-500/30 shadow-emerald-500/10`}>
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-emerald-500/10 rounded-full mx-auto flex items-center justify-center"
        >
            <GraduationCap className="w-12 h-12 text-emerald-600" />
        </motion.div>

        <div className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Admission Approved!</h2>
            <p className="text-gray-500 max-w-md mx-auto font-medium">
                The application lifecycle is complete. The next step is to initialize the student's Master Record and assign them to a section.
            </p>
        </div>

        <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl max-w-sm mx-auto space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Designation</p>
            <p className="text-sm font-bold text-gray-900">GRADE: {app.grade_applied_for}</p>
            <Progress value={100} className="h-2 bg-emerald-500/10" />
            <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/10">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Roll No Preview</span>
                <span className="text-xs font-black text-emerald-600">PENDING ENROL</span>
            </div>
        </div>

        <Button
            onClick={() => handleAction('enrol')}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-12 h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20"
        >
            {loading ? 'Initializing Master...' : 'ENABLE STUDENT RECORD (ENROL)'}
        </Button>
    </div>
);

const EnrolledSuccessState = ({ app }: { app: Admission }) => (
    <div className={`${GLASS_BASE} p-16 text-center space-y-8 border-blue-500/30 relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-12"
        >
            <div className="space-y-4">
                <div className="w-20 h-20 bg-blue-500 rounded-2xl rotate-12 mx-auto flex items-center justify-center shadow-2xl">
                    <CheckCircle2 className="w-12 h-12 text-white -rotate-12" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">STUDENT ENROLLED</h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Mission Control: Deployment Successful</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <SuccessLink icon={<User className="w-5 h-5" />} label="STUDENT PROFILE" description="Manage personal details & identity" />
                <SuccessLink icon={<School className="w-5 h-5" />} label="SECTION ALLOCATION" description="Assign class, section & roll number" />
                <SuccessLink icon={<FileText className="w-5 h-5" />} label="PARENT DOSSIER" description="Manage parent communications" />
            </div>

            <Button variant="outline" className="rounded-2xl border-blue-500/20 h-12 px-8 font-black uppercase tracking-widest text-[10px]" asChild>
                <a href="/app/students">RETURN TO STUDENT DIRECTORY</a>
            </Button>
        </motion.div>
    </div>
);

const SuccessLink = ({ icon, label, description }: any) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className="p-6 bg-white/5 border border-white/10 rounded-3xl text-left space-y-3 cursor-pointer group"
    >
        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors w-fit">
            {icon}
        </div>
        <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{label}</h4>
        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{description}</p>
    </motion.div>
);

const AuditTimeline = ({ logs }: { logs: AdmissionAuditLog[] }) => (
    <div className={`${GLASS_BASE} p-8`}>
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                <History className="w-5 h-5 text-blue-600" />
                System Audit Logs
            </h3>
            <Badge variant="outline" className="border-white/20 text-[10px] uppercase font-black tracking-widest">{logs.length} Entries</Badge>
        </div>

        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-transparent">
            {logs.map((log, idx) => (
                <div key={log.id} className="relative flex items-center justify-between gap-6 pl-10 group">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-[#0f172a] border-4 border-blue-500 shadow-xl flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>

                    <div className="flex-1 grid md:grid-cols-[1fr_2fr_1fr] items-center gap-6 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{log.action.replace('_', ' ')}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 italic">"{log.remarks || 'No notes recorded'}"</p>
                        <div className="flex justify-end items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.users?.full_name || 'System Auto'}</span>
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- UTILS ---

const CheckItem = ({ label, checked = false }: { label: string; checked?: boolean }) => (
    <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-white/20 bg-white/5'}`}>
            {checked && <Check className="w-3 h-3 text-white" />}
        </div>
        <span className={`text-xs font-bold ${checked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{label}</span>
    </div>
);

const DataBox = ({ label, value }: { label: string; value: string }) => (
    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xs font-black text-gray-900 dark:text-gray-200">{value}</p>
    </div>
);

function XCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    )
}

function BadgeCheckIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
