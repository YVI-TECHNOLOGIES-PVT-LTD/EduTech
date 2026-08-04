import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Sparkles, Settings, FileText, ClipboardList, Database, CheckCircle, 
    ArrowUpRight, Users, Bell, ShieldCheck, AlertCircle, RefreshCw, BarChart2, CheckSquare, GraduationCap, Award, Clock 
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useAssessmentConfiguration } from '../hooks/useAssessmentConfiguration';
import { useWorkflowsList } from '../hooks/useWorkflows';
import { useQuestionFolders, useQuestions } from '../../question-bank/hooks/useQuestionBank';
import { useBlueprintAnalytics } from '../../blueprint-builder/hooks/useBlueprintBuilder';

export const AssessmentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    const { configurations } = useAssessmentConfiguration();
    const { data: workflows = [] } = useWorkflowsList();
    const { stats, folders } = useQuestionFolders();
    const { data: metrics } = useBlueprintAnalytics();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hr = currentTime.getHours();
        if (hr < 12) return "Good Morning";
        if (hr < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const activeConfig = configurations[0];
    const publishedWorkflows = workflows.filter(w => w.is_active).length;

    const cards = [
        { 
            label: 'Total Questions', 
            value: stats?.totalQuestions || 0, 
            icon: FileText, 
            color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', 
            trend: `Drafts: ${stats?.statusCounts?.DRAFT || 0}`, 
            link: '/app/assessment/questions' 
        },
        { 
            label: 'Total Blueprints', 
            value: metrics?.totalBlueprints || 0, 
            icon: ClipboardList, 
            color: 'text-violet-500 bg-violet-500/10 border-violet-500/20', 
            trend: `Published: ${metrics?.statusDistribution?.PUBLISHED || 0}`, 
            link: '/app/assessment/blueprints' 
        },
        { 
            label: 'Published Workflows', 
            value: publishedWorkflows, 
            icon: Settings, 
            color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', 
            trend: 'Dynamic approval chains', 
            link: '/app/assessment/settings' 
        },
        { 
            label: 'Active Configurations', 
            value: activeConfig ? (activeConfig.settings?.status || 'ACTIVE') : 'INACTIVE', 
            icon: ShieldCheck, 
            color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', 
            trend: `Folders count: ${folders.length}`, 
            link: '/app/assessment/settings' 
        },
    ];

    const actions = [
        { label: 'Settings & Workflows', icon: Settings, link: '/app/assessment/settings', desc: 'Rules & approval chains' },
        { label: 'Question Bank Manager', icon: FileText, link: '/app/assessment/questions', desc: 'Manage question entries' },
        { label: 'Blueprint Rules Builder', icon: ClipboardList, link: '/app/assessment/blueprints', desc: 'Manage exam blueprint rules' },
        { label: 'Template Layout Builder', icon: ClipboardList, link: '/app/assessment/templates', desc: 'Layout & section templates' },
        { label: 'Paper Generator Wizard', icon: Sparkles, link: '/app/assessment/papers', desc: 'Generate & publish exams' },
        { label: 'Evaluation Desk Portal', icon: CheckSquare, link: '/app/assessment/evaluation', desc: 'Grade & score exam scripts' },
        { label: 'Results Processing Center', icon: GraduationCap, link: '/app/assessment/results', desc: 'Calculate CGPA & publish reports' },
        { label: 'Quality & Analytics Desk', icon: BarChart2, link: '/app/assessment/analytics', desc: 'Accreditation compliance scorecards' },
        { label: 'Permanent Academic Records', icon: Award, link: '/app/academic-records', desc: 'CGPA history and graduation status' },
        { label: 'Attendance & Engagement', icon: Clock, link: '/app/attendance', desc: 'Manage daily student attendance registers' },
        { label: 'Asset attachments', icon: ShieldCheck, link: '/app/assessment/questions/assets', desc: 'Candidate proctoring media' },
    ];

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                        Assessment Governance Console
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {getGreeting()}, {user?.full_name || 'Administrator'}
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        System active | {formattedDate}
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-premium-md text-xs hover:scale-[1.01]">
                        <RefreshCw className="w-4 h-4" />
                        Sync Registry
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((c, i) => (
                    <div key={i} className="group relative bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${c.color}`}>
                                <c.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 py-0.5 px-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">{c.trend}</span>
                        </div>
                        <div className="mt-5 space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                                {c.label}
                            </p>
                            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                {c.value}
                            </span>
                        </div>
                        {c.link && (
                            <Link to={c.link} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-muted/60 hover:bg-primary hover:text-white rounded-lg text-muted-foreground">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            {/* Ingestion & Ratios grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Operations Toolkit */}
                <div className="md:col-span-2 bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <Database className="text-primary w-4.5 h-4.5" />
                            Assessment Operations Toolkit
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {actions.map((action, i) => (
                            <Link
                                key={i}
                                to={action.link}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-gray-50/20 dark:bg-muted/5 transition-all duration-200 group hover:bg-white dark:hover:bg-card hover:border-primary/20 hover:shadow-premium-md hover:scale-[1.01]"
                            >
                                <div className="w-10 h-10 bg-white dark:bg-muted/15 rounded-xl flex items-center justify-center border border-border/40 shadow-premium-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-colors">
                                    <action.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{action.label}</div>
                                    <div className="text-[10px] text-muted-foreground font-semibold truncate mt-0.5">{action.desc}</div>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* System Vitality Panel */}
                <div className="bg-gradient-to-br from-gray-950 to-slate-900 rounded-3xl p-6 text-white shadow-premium-xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-bl-full filter blur-xl"></div>
                    <div>
                        <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-wider">
                            <CheckCircle className="text-primary w-4.5 h-4.5" />
                            Ingestion Distribution
                        </h3>
                        <div className="space-y-4 relative z-10 text-xs">
                            <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5">
                                <span className="text-white/50 font-bold uppercase tracking-wider">Easy Questions</span>
                                <span className="font-black text-green-400">{stats?.difficultyDistribution?.EASY || 0} items</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5">
                                <span className="text-white/50 font-bold uppercase tracking-wider">Medium Questions</span>
                                <span className="font-black text-amber-400">{stats?.difficultyDistribution?.MEDIUM || 0} items</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5">
                                <span className="text-white/50 font-bold uppercase tracking-wider">Hard Questions</span>
                                <span className="font-black text-rose-400">{stats?.difficultyDistribution?.HARD || 0} items</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] text-white/40 bg-white/5 p-3 rounded-2xl border border-white/5">
                        <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                        Platform is fully synced and active under active year parameters.
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AssessmentDashboard;
