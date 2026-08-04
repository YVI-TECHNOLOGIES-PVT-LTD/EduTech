import type { MeritRecord } from '../utils/merit.mapper';

interface MeritRankingProps {
    records: MeritRecord[];
}

export function MeritRanking({ records }: MeritRankingProps) {
    if (!records.length) {
        return <p className="text-xs text-gray-400 py-4 text-center">No merit rankings available. Generate merit list first.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="text-[10px] font-black uppercase text-gray-400 border-b">
                        <th className="text-left py-2 pr-3">Rank</th>
                        <th className="text-left py-2 pr-3">Candidate</th>
                        <th className="text-left py-2 pr-3">Program</th>
                        <th className="text-left py-2 pr-3">Final Score</th>
                        <th className="text-left py-2 pr-3">Seat</th>
                        <th className="text-left py-2">Category</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {records.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 pr-3 font-black text-violet-600">{row.rank ?? '—'}</td>
                            <td className="py-2.5 pr-3 font-bold">{row.candidate}</td>
                            <td className="py-2.5 pr-3">{row.program}</td>
                            <td className="py-2.5 pr-3 font-bold">{row.finalMeritScore ?? '—'}</td>
                            <td className="py-2.5 pr-3">
                                <span className="text-[9px] font-black uppercase">{row.seatStatus}</span>
                            </td>
                            <td className="py-2.5">{row.category ?? row.waitlistGroup ?? '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default MeritRanking;
