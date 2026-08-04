import React from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { QuickActionButton } from './QuickActionButton';
import { 
    FilePlus, 
    UserPlus, 
    CheckSquare, 
    Calendar, 
    CreditCard, 
    Award, 
    Coins, 
    Settings, 
    PhoneCall, 
    FileText, 
    Users,
    ClipboardList,
    BookOpen
} from 'lucide-react';

export const QuickActions: React.FC = () => {
    const { user } = useAuth();
    const roles = user?.roles || [];

    const isReceptionist = roles.some(r => ['RECEPTIONIST', 'FRONT_DESK'].includes(r.toUpperCase()));
    const isCounselor = roles.some(r => ['COUNSELOR', 'COUNSELLOR'].includes(r.toUpperCase()));
    const isAdmissionOfficer = roles.some(r => r.toUpperCase() === 'ADMISSION_OFFICER');
    const isExamCell = roles.some(r => ['EXAM_CELL', 'EXAM_CELL_ADMIN'].includes(r.toUpperCase()));
    const isFinance = roles.some(r => ['FINANCE_OFFICER', 'ACCOUNTANT'].includes(r.toUpperCase()));
    const isPrincipal = roles.some(r => ['PRINCIPAL', 'HOI', 'HEAD_OF_INSTITUTE'].includes(r.toUpperCase()));
    const isAdmin = roles.some(r => r.toUpperCase() === 'ADMIN');

    // Build role-specific actions
    const getActions = () => {
        if (isAdmin) {
            return [
                { label: 'Review Admissions', href: '/app/admissions/review', icon: CheckSquare, color: 'bg-blue-50 border-blue-100 text-blue-600', description: 'Check submitted registration forms' },
                { label: 'System Settings', href: '/app/settings', icon: Settings, color: 'bg-purple-50 border-purple-100 text-purple-600', description: 'Configure academic constraints' },
                { label: 'Academic Setup', href: '/app/academic/classes', icon: BookOpen, color: 'bg-emerald-50 border-emerald-100 text-emerald-600', description: 'Configure classroom settings' },
                { label: 'Bulk Operations', href: '/app/admin/bulk', icon: ClipboardList, color: 'bg-amber-50 border-amber-100 text-amber-600', description: 'Execute master updates' }
            ];
        }
        if (isReceptionist) {
            return [
                { label: 'New Inquiry', href: '/app/admissions/inquiries', icon: FilePlus, color: 'bg-blue-50 border-blue-100 text-blue-600', description: 'Register visitor walk-ins' },
                { label: 'Visitor Register', href: '/app/admissions/inquiries', icon: Users, color: 'bg-purple-50 border-purple-100 text-purple-600', description: 'Log front-desk guests' },
                { label: 'Schedule Visit', href: '/app/admissions/inquiries', icon: Calendar, color: 'bg-amber-50 border-amber-100 text-amber-600', description: 'Book visitor appointment' }
            ];
        }
        if (isCounselor) {
            return [
                { label: 'Call Lead', href: '/app/admissions/inquiries', icon: PhoneCall, color: 'bg-blue-50 border-blue-100 text-blue-600', description: 'Track callbacks schedule' },
                { label: 'View Leads', href: '/app/admissions/inquiries', icon: FileText, color: 'bg-amber-50 border-amber-100 text-amber-600', description: 'Manage assigned funnel' }
            ];
        }
        if (isAdmissionOfficer) {
            return [
                { label: 'Verify Documents', href: '/app/admissions/review', icon: CheckSquare, color: 'bg-emerald-50 border-emerald-100 text-emerald-600', description: 'Check pending checklists' },
                { label: 'Review Application', href: '/app/admissions/review', icon: FileText, color: 'bg-indigo-50 border-indigo-100 text-indigo-600', description: 'Verify form fields' },
                { label: 'Enroll Student', href: '/app/admissions/review', icon: UserPlus, color: 'bg-blue-50 border-blue-100 text-blue-600', description: 'Promote applicant to student' }
            ];
        }
        if (isFinance) {
            return [
                { label: 'Verify Payment', href: '/app/fees/payments', icon: CreditCard, color: 'bg-emerald-50 border-emerald-100 text-emerald-600', description: 'Reconcile offline collection' },
                { label: 'Fee Ledger', href: '/app/fees/structures', icon: Coins, color: 'bg-amber-50 border-amber-100 text-amber-600', description: 'Verify invoice configurations' }
            ];
        }
        if (isPrincipal) {
            return [
                { label: 'Approve Merit', href: '/app/admissions/review', icon: Award, color: 'bg-rose-50 border-rose-100 text-rose-600', description: 'Authorize class rankings lists' },
                { label: 'Release Offers', href: '/app/admissions/review', icon: FilePlus, color: 'bg-blue-50 border-blue-100 text-blue-600', description: 'Trigger admission letters dispatch' }
            ];
        }
        if (isExamCell) {
            return [
                { label: 'Schedule Exam', href: '/app/exam-admin/manage', icon: Calendar, color: 'bg-blue-50 border-blue-100 text-blue-600', description: 'Create scheduled slots' }
            ];
        }
        // Fallback default shortcuts
        return [];

    };

    const actions = getActions();

    return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm space-y-4">
            <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Quick Operational Actions
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                    Shortcuts to navigate into existing functional modules directly
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {actions.map((act, idx) => (
                    <QuickActionButton
                        key={idx}
                        label={act.label}
                        icon={act.icon}
                        href={act.href}
                        color={act.color}
                        description={act.description}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
