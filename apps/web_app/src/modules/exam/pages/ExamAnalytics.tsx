import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { BarChart3, Users, Award, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#6366F1'];

export const ExamAnalytics = () => {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [overview, setOverview] = useState<any>(null);
    const [grades, setGrades] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [top, setTop] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        apiClient.get('/exams').then(res => setExams(res.data));
    }, []);

    useEffect(() => {
        if (!selectedExamId) return;
        fetchAnalytics();
    }, [selectedExamId]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [ov, gr, sub, tp] = await Promise.all([
                apiClient.get('/exams/analytics/overview', { params: { examId: selectedExamId } }),
                apiClient.get('/exams/analytics/grades', { params: { examId: selectedExamId } }),
                apiClient.get('/exams/analytics/subjects', { params: { examId: selectedExamId } }),
                apiClient.get('/exams/analytics/top-performers', { params: { examId: selectedExamId } })
            ]);
            setOverview(ov.data);
            setGrades(gr.data);
            setSubjects(sub.data);
            setTop(tp.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    Performance Analytics
                </h1>
                <p className="text-gray-500 font-medium">Deep dive into exam performance and student outcomes.</p>
            </div>

            {/* Exam Selector - Full Width */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <select
                    className="w-full md:w-1/3 p-3 border rounded-xl bg-gray-50 font-medium text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedExamId}
                    onChange={e => setSelectedExamId(e.target.value)}
                >
                    <option value="">Select Exam for Insights...</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>

            {selectedExamId ? (
                loading ? (
                    <div className="p-8 sm:p-24 text-center text-gray-400 flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                        <span className="font-bold text-lg text-gray-900">Crunching Numbers...</span>
                        <span className="text-sm mt-1">Analyzing student performance data.</span>
                    </div>
                ) : overview ? (
                    <>
                        {/* 1. Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <KPI icon={Users} title="Total Students" value={overview?.totalStudents || 0} sub="Scheduled & Graded" />
                            <KPI icon={Award} title="Net Pass %" value={`${overview?.passPercentage || 0}%`} sub={`${overview?.passCount} Passed / ${overview?.failCount} Failed`} highlight />
                            <KPI icon={TrendingUp} title="Overall Avg" value={`${overview?.avgPercentage || 0}%`} sub="Across all subjects" />
                            <KPI icon={BookOpen} title="Subjects" value={subjects.length} sub="Included in Report" />
                        </div>

                        {/* 2. Visualizations */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Grade Distribution - Pie */}
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                                <h3 className="font-bold text-gray-900 mb-2">Grade Distribution</h3>
                                <p className="text-xs text-gray-400 mb-6 font-medium uppercase tracking-wider">Student grading curve</p>

                                <div className="flex-1 min-h-[350px] relative">
                                    {grades.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={grades}
                                                    dataKey="count"
                                                    nameKey="grade"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                >
                                                    {grades.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    itemStyle={{ fontWeight: 'bold', color: '#374151' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">No grade data available</div>
                                    )}
                                </div>
                            </div>

                            {/* Subject Performance - Bar */}
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                                <h3 className="font-bold text-gray-900 mb-2">Subject Performance</h3>
                                <p className="text-xs text-gray-400 mb-6 font-medium uppercase tracking-wider">Average score by subject</p>

                                <div className="flex-1 min-h-[350px] relative">
                                    {subjects.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={subjects} layout="vertical" margin={{ left: 40 }}>
                                                <XAxis type="number" domain={[0, 100]} hide />
                                                <YAxis dataKey="subjectName" type="category" width={100} tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar dataKey="average" fill="#4F46E5" radius={[0, 6, 6, 0]} barSize={24} background={{ fill: '#F3F4F6' }} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">No subject data available</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Deep Dive Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Top Performers */}
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <Award className="w-5 h-5 text-amber-500" /> Top Performers
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Highest scoring students</p>
                                    </div>
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest">Merit List</span>
                                </div>

                                {top.length > 0 ? (
                                    <div className="overflow-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-400 font-bold border-b border-gray-100 text-[10px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="pb-4 pl-2">Rank</th>
                                                    <th className="pb-4">Student</th>
                                                    <th className="pb-4 text-right">Total Marks</th>
                                                    <th className="pb-4 text-right">Percent</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {top.map((t, i) => (
                                                    <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 pl-2 font-black text-indigo-600 text-lg">#{i + 1}</td>
                                                        <td className="py-4">
                                                            <div className="font-bold text-gray-900">{t.student?.full_name}</div>
                                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{t.student?.admission?.student_code}</div>
                                                        </td>
                                                        <td className="py-4 text-right font-mono text-gray-600 font-medium">{t.total_obtained}</td>
                                                        <td className="py-4 text-right">
                                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold text-xs">
                                                                {t.percentage}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-12">Not enough data to determine rank</div>
                                )}
                            </div>

                            {/* Subject Difficulty Analysis */}
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="mb-8">
                                    <h3 className="font-bold text-gray-900">Subject Breakdown</h3>
                                    <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Performance by subject area</p>
                                </div>

                                {subjects.length > 0 ? (
                                    <div className="overflow-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-400 font-bold border-b border-gray-100 text-[10px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="pb-4">Subject</th>
                                                    <th className="pb-4 text-right">Avg</th>
                                                    <th className="pb-4 text-right">Pass Rate</th>
                                                    <th className="pb-4 text-right">Range</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {subjects.map((s, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 font-bold text-gray-700">{s.subjectName}</td>
                                                        <td className="py-4 text-right font-mono font-medium">{s.average}</td>
                                                        <td className="py-4 text-right">
                                                            <span className={`font-bold ${s.passPercentage > 80 ? 'text-emerald-600' : s.passPercentage < 50 ? 'text-red-500' : 'text-amber-600'}`}>
                                                                {s.passPercentage}%
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right text-gray-400 text-xs font-mono">
                                                            {s.lowest} - {s.highest}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-12">No subject breakdown available</div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white p-8 sm:p-24 rounded-3xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center opacity-70">
                        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="font-bold text-gray-900 text-lg">No Analytics Available</h3>
                        <p className="max-w-xs mx-auto text-sm mt-2 text-gray-500">
                            Results haven't been generated for this exam yet.
                        </p>
                    </div>
                )
            ) : (
                <div className="bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-8 sm:p-24 flex flex-col items-center justify-center text-center opacity-70">
                    <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="font-bold text-gray-500 text-xl">Select an exam to view insights</p>
                </div>
            )}
        </div>
    );
};

const KPI = ({ icon: Icon, title, value, sub, highlight }: any) => (
    <div className={`p-8 rounded-3xl border ${highlight ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-gray-100 text-gray-900 shadow-sm'} transition-transform hover:-translate-y-1 relative overflow-hidden group`}>
        {highlight && <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />}
        <div className="flex items-center gap-3 mb-4 opacity-80 relative z-10">
            <Icon className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
        </div>
        <div className="text-5xl font-black mb-2 tracking-tight relative z-10">{value}</div>
        <div className={`text-xs font-medium relative z-10 ${highlight ? 'text-indigo-100' : 'text-gray-500'}`}>{sub}</div>
    </div>
);
