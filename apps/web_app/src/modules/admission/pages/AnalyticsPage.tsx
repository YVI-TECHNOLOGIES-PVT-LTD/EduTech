import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Filter, Calendar, Award } from 'lucide-react';
import { useMasterData } from '../context/MasterDataContext';

export function AnalyticsPage() {
    const [admissionType, setAdmissionType] = useState('all');
    const [grade, setGrade] = useState('all');
    const { grades, quotas } = useMasterData();

    const funnelData = [
        { name: 'Inquiry', count: 120 },
        { name: 'Application', count: 85 },
        { name: 'Exam Attended', count: 68 },
        { name: 'Interview Passed', count: 54 },
        { name: 'Merit Offered', count: 42 },
        { name: 'Payment Done', count: 35 },
        { name: 'Enrolled', count: 32 },
    ];

    const sourceData = [
        { name: 'Direct/Walkin', value: 45 },
        { name: 'Website', value: 35 },
        { name: 'Referral', value: 15 },
        { name: 'Social Media', value: 25 },
    ];

    const typeData = [
        { name: 'Regular', value: 65, color: '#3B82F6' },
        { name: 'RTE', value: 15, color: '#10B981' },
        { name: 'Management', value: 10, color: '#8B5CF6' },
        { name: 'Staff Quota', value: 4, color: '#F59E0B' },
        { name: 'Scholarship', value: 6, color: '#EC4899' },
    ];

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Admission Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Deep analysis of admission pipelines and conversions.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-700">2026-2027 Cycle</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mr-2">
                    <Filter className="w-4 h-4" /> Filters:
                </div>
                <div className="flex gap-2">
                    <select
                        id="admission-type-filter"
                        value={admissionType}
                        onChange={e => setAdmissionType(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none bg-white"
                    >
                        <option value="all">All Admission Types</option>
                        {quotas.map(q => (
                            <option key={q} value={q}>{q}</option>
                        ))}
                    </select>

                    <select
                        id="grade-filter"
                        value={grade}
                        onChange={e => setGrade(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none bg-white"
                    >
                        <option value="all">All Grades</option>
                        {grades.map(g => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Funnel chart */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Pipeline Conversion Yield</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                                <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sources Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Lead Source Distribution</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Admission types distribution */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Admission Categories breakdown</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Statistics Table */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-primary" /> Key Performance Indexes
                        </h2>
                        <div className="space-y-4">
                            {[
                                { label: 'Overall Admission Yield', desc: 'Inquiry converted to enrolled student', value: '22.5%' },
                                { label: 'Offer Acceptance Rate', desc: 'Proportion of generated offers accepted', value: '80.0%' },
                                { label: 'Average Processing Velocity', desc: 'Inquiry conversion to final handoff duration', value: '18 days' },
                                { label: 'RTE Quota Allocation', desc: 'Percentage of seats filled under RTE criteria', value: '15.0%' },
                            ].map((stat, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{stat.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{stat.desc}</p>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsPage;
