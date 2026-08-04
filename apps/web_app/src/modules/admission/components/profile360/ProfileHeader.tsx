import React from 'react';
import { User, Phone, Mail, Award, Calendar } from 'lucide-react';
import type { Applicant360View } from '../../utils/applicant360.mapper';

interface ProfileHeaderProps {
    applicant: Pick<Applicant360View, 'name' | 'code' | 'email' | 'phone' | 'grade' | 'status' | 'candidateScore' | 'submittedAt'>;
}

export function ProfileHeader({ applicant }: ProfileHeaderProps) {
    const getStatusStyle = (status: string) => {
        const s = status.toUpperCase();
        if (s === 'ENROLLED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (s.includes('REJECT') || s.includes('BREACH')) return 'bg-rose-50 text-rose-700 border-rose-200';
        if (s.includes('PENDING') || s.includes('CHECK')) return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    };

    return (
        <div className="bg-white dark:bg-card p-6 border border-gray-150 dark:border-border/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md ring-4 ring-indigo-50">
                        {applicant.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">{applicant.name}</h2>
                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                {applicant.code}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 font-semibold">
                            <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" /> {applicant.email}
                            </span>
                            <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" /> {applicant.phone}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Applied Grade</span>
                        <span className="text-sm font-black text-gray-800 dark:text-gray-200">{applicant.grade}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-100 dark:bg-border" />
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Status Stage</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border tracking-wider mt-0.5 inline-block ${getStatusStyle(applicant.status)}`}>
                            {applicant.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-50 dark:border-border/10 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Submission Date: <strong className="text-gray-700 dark:text-gray-300">{applicant.submittedAt}</strong></span>
                </div>
                {applicant.candidateScore !== undefined && (
                    <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span>Aggregated Admission Score: <strong className="text-indigo-600 font-black">{applicant.candidateScore}/100</strong></span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfileHeader;
