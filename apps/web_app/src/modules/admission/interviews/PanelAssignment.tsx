import { useState } from 'react';
import type { InterviewRecord } from '../utils/interview.mapper';
import type { InterviewAction } from '../utils/interview.workflow';
import { Button } from '../../../components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';

interface PanelAssignmentProps {
    record: InterviewRecord | null;
    canAssign?: boolean;
    isSubmitting?: boolean;
    onAction: (action: InterviewAction, payload?: Record<string, unknown>) => void;
}

export function PanelAssignment({ record, canAssign, isSubmitting, onAction }: PanelAssignmentProps) {
    const [panelId, setPanelId] = useState('');
    const [interviewDate, setInterviewDate] = useState('');
    const [roomName, setRoomName] = useState('');

    if (!record) {
        return (
            <div className="border border-dashed rounded-2xl p-6 text-center text-sm text-gray-400">
                Select a candidate to assign a panel.
            </div>
        );
    }

    if (record.status !== 'pending' && record.panelMembers) {
        return (
            <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-black uppercase text-gray-400">Panel Assignment</h3>
                <div className="grid gap-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-3.5 h-3.5" /> {record.panelMembers}
                    </div>
                    {record.room && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-3.5 h-3.5" /> {record.room}
                        </div>
                    )}
                    {record.interviewDate && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-3.5 h-3.5" /> {record.interviewDate}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-400">Assign Interview Panel</h3>
            {canAssign ? (
                <>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400">Panel ID (UUID)</label>
                        <input
                            type="text"
                            value={panelId}
                            onChange={e => setPanelId(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-xl text-xs"
                            placeholder="admission_interview_panels.id"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400">Interview Date & Time</label>
                        <input
                            type="datetime-local"
                            value={interviewDate}
                            onChange={e => setInterviewDate(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-xl text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400">Room</label>
                        <input
                            type="text"
                            value={roomName}
                            onChange={e => setRoomName(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-xl text-xs"
                            placeholder="Conference Room A"
                        />
                    </div>
                    <Button
                        size="sm"
                        className="h-8 text-[10px] bg-indigo-600 text-white"
                        disabled={isSubmitting || !panelId || !interviewDate || !roomName}
                        onClick={() =>
                            onAction('assign_panel', {
                                panelId,
                                interviewDate: new Date(interviewDate).toISOString(),
                                roomName,
                            })
                        }
                    >
                        Assign Panel
                    </Button>
                </>
            ) : (
                <p className="text-xs text-gray-400">You do not have permission to assign panels.</p>
            )}
        </div>
    );
}

export default PanelAssignment;
