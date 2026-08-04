import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, LayoutGrid, List, AlertCircle } from 'lucide-react';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import { usePipeline } from '../../hooks/usePipeline';
import { useAuth } from '../../../../context/AuthContext';
import { AdmissionPermissions } from '../../core/AdmissionPermissions';
import { PIPELINE_COLUMNS, formatStatusLabel } from '../../core/AdmissionStatusMapper';
import { ExportMenu } from '../../../common/reports/ExportMenu';
import { pipelineCardToExportRow } from '../../utils/pipeline.mapper';
import { Button } from '../../../../components/ui/button';
import { ROUTES } from '../../../../constants/routes';

export function PipelinePage() {
    const navigate = useNavigate();
    const { user, hasPermission, hasRole } = useAuth();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    const permCtx = {
        roles: user?.roles ?? [],
        hasPermission,
        hasRole,
    };

    const canAccess = AdmissionPermissions.canReviewApplications(permCtx);

    const {
        cards,
        isLoading,
        error,
        refetch,
        query,
        setQuery,
        statusFilter,
        setStatusFilter,
        handleStageTransition,
        transitioningIds,
    } = usePipeline(permCtx);

    const exportData = cards.map(pipelineCardToExportRow);

    if (!canAccess) {
        return (
            <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">You do not have permission to access the admission pipeline.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Admissions Pipeline Board
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold uppercase">
                        Single source of truth — live applications via Admission Engine
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                    <ExportMenu
                        title="Pipeline Report"
                        data={exportData}
                        columns={Object.keys(exportData[0] ?? { Student: '' })}
                    />
                    <div className="flex border rounded-xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400'}`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5 inline mr-1" /> Kanban
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400'}`}
                        >
                            <List className="w-3.5 h-3.5 inline mr-1" /> List
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search student, code, grade, status…"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                >
                    <option value="all">All stages</option>
                    {PIPELINE_COLUMNS.map(col => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Loading pipeline…</div>
            ) : error ? (
                <div className="py-16 text-center space-y-3">
                    <p className="text-sm text-rose-600 font-bold">Failed to load applications.</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                </div>
            ) : cards.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">No applications match your filters.</div>
            ) : viewMode === 'kanban' ? (
                <KanbanBoard
                    cards={cards}
                    transitioningIds={transitioningIds}
                    onStageTransition={handleStageTransition}
                    onCardClick={id => navigate(ROUTES.ADMISSION.REVIEW(id))}
                />
            ) : (
                <div className="bg-white dark:bg-card border rounded-2xl overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {['Code', 'Student', 'Grade', 'Stage', 'SLA', 'Docs', 'Updated'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 font-black uppercase text-[10px] text-gray-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {cards.map(card => (
                                <tr
                                    key={card.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(ROUTES.ADMISSION.REVIEW(card.id))}
                                >
                                    <td className="px-4 py-3 font-bold text-indigo-600">{card.code}</td>
                                    <td className="px-4 py-3 font-medium">{card.name}</td>
                                    <td className="px-4 py-3">{card.grade}</td>
                                    <td className="px-4 py-3">{formatStatusLabel(card.legacyStatus ?? card.status)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                            card.slaStatus === 'breached' ? 'bg-rose-50 text-rose-600' :
                                            card.slaStatus === 'warning' ? 'bg-amber-50 text-amber-600' :
                                            'bg-emerald-50 text-emerald-600'
                                        }`}>
                                            {card.slaStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 capitalize">{card.documentStatus}</td>
                                    <td className="px-4 py-3 text-gray-400">{card.updatedAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default PipelinePage;
