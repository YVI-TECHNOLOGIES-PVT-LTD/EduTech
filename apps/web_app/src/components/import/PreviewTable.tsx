import React from 'react';

export const PreviewTable: React.FC<{ rows: any[] }> = ({ rows }) => {
    if (!rows || rows.length === 0) return null;

    const headers = Object.keys(rows[0]).filter(k => !k.startsWith('_'));
    const previewRows = rows.slice(0, 5);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">Preview Data</span>
                <span className="text-xs text-gray-400">Showing first {previewRows.length} rows</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-gray-100">
                        <tr>
                            {headers.map(h => (
                                <th key={h} className="px-4 py-3 font-bold text-gray-700 capitalize whitespace-nowrap bg-gray-50/50">
                                    {h.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {previewRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                {headers.map(h => (
                                    <td key={h} className="px-4 py-2.5 text-gray-600 whitespace-nowrap max-w-[200px] truncate">
                                        {String(row[h])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
