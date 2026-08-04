import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfileStore } from '../store/profile.store';
import { useSettingsStore } from '../store/settings.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '../services/auth/ProfileService';
import { ChangePasswordForm } from '../features/auth/ChangePasswordPage';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Building, FileText, Shield, Bell, Palette,
    Monitor, Globe, Save, Edit2, CheckCircle2, Clock, Hash, Camera,
    Award, Calendar, BookOpen, CreditCard, Activity, MapPin, Laptop,
    HelpCircle, Lock, ShieldCheck, Check, Printer, Share2, Download,
    ExternalLink, ChevronRight, CheckSquare, Settings, Heart, AlertTriangle,
    Eye, Trash2, ShieldAlert, Key, Smartphone
} from 'lucide-react';
import { QUERY_KEYS } from '../lib/queryKeys';

// ─── Sparkline Graph Component ──────────────────────────────────────────────────
const Sparkline = ({ points, color = "text-primary" }: { points: number[], color?: string }) => {
    const width = 100;
    const height = 30;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;
    
    const coordinates = points.map((p, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((p - minVal) / range) * height;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg className={`w-16 h-6 ${color}`} viewBox={`0 0 ${width} ${height}`}>
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={coordinates}
            />
        </svg>
    );
};

// ─── Helper for Role-Specific Details ──────────────────────────────────────────
const getRoleDetails = (role: string, name: string) => {
    const isStudent = role === 'STUDENT';
    const isParent = role === 'PARENT';

    if (isStudent) {
        return {
            idLabel: "Student ID",
            idValue: "STU-2026-9871",
            deptLabel: "Class & Section",
            deptValue: "Grade 10 - A",
            campus: "Main Campus, Block A",
            rollNo: "Roll No: 24",
            guardian: "Rajesh Sharma",
            bloodGroup: "O+",
            dob: "15 May 2012",
            gender: "Male",
            nationality: "Indian",
            languages: ["English", "Hindi", "Telugu"],
            address: "H-45, Phase 2, RR Village, Hyderabad, Telangana - 500072",
            emergencyContact: "+91 98765 43210",
        };
    }

    if (isParent) {
        return {
            idLabel: "Parent ID",
            idValue: "PAR-2026-4432",
            deptLabel: "Relation",
            deptValue: "Father / Guardian",
            campus: "Secondary Support Desk",
            rollNo: "Ward ID: STU-2026-9871",
            guardian: "Sathish (Self)",
            bloodGroup: "A+",
            dob: "08 Oct 1982",
            gender: "Male",
            nationality: "Indian",
            languages: ["English", "Hindi", "Telugu"],
            address: "H-45, Phase 2, RR Village, Hyderabad, Telangana - 500072",
            emergencyContact: "+91 90000 12345",
        };
    }

    // Default for Faculty, Admin, Principal, Finance, Admission Officer, etc.
    return {
        idLabel: "Employee ID",
        idValue: `EMP-${role.substring(0,3).toUpperCase()}-0871`,
        deptLabel: "Department",
        deptValue: role === 'ADMIN' ? "IT Operations" : role === 'FINANCE' ? "Finance & Accounts" : "Academic Management",
        campus: "Administration Block",
        rollNo: "Room: Admin 204",
        guardian: "N/A",
        bloodGroup: "B+",
        dob: "21 Dec 1988",
        gender: "Male",
        nationality: "Indian",
        languages: ["English", "Hindi", "Telugu"],
        address: "Miyapur Cross Road, Hyderabad, Telangana - 500049",
        emergencyContact: "+91 98123 45678",
    };
};

type Tab = 'overview' | 'personal' | 'academic' | 'documents' | 'timeline' | 'activity' | 'security' | 'preferences' | 'edit';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal', icon: Heart },
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
];

// ─── Sub-Component: ProfileHero ───────────────────────────────────────────────
export function ProfileHero({ user, role }: { user: any, role: string }) {
    const greeting = () => {
        const hr = new Date().getHours();
        if (hr < 12) return 'Good Morning';
        if (hr < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="relative h-64 bg-gradient-to-r from-navy via-blue-900 to-indigo-950 rounded-3xl overflow-hidden shadow-xl border border-white/10">
            {/* Overlay Patterns */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Header info */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
                <span className="backdrop-blur-md bg-white/10 border border-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    AY 2026-27
                </span>
                <span className="flex items-center gap-1.5 backdrop-blur-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Online
                </span>
            </div>

            <div className="absolute bottom-16 left-8 flex items-end gap-6">
                <div className="space-y-1 text-white">
                    <p className="text-xs font-medium text-white/70 uppercase tracking-widest">{greeting()},</p>
                    <h1 className="text-3xl font-black tracking-tight">{user.full_name || 'Sathish'}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-gold text-navy text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {role}
                        </span>
                        <span className="text-xs text-white/60">• EduTrack Global School</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-Component: ProfileAvatar ─────────────────────────────────────────────
export function ProfileAvatar({ user, onUpload }: { user: any, onUpload: (file: File) => void }) {
    const triggerFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
            if (e.target.files?.[0]) {
                onUpload(e.target.files[0]);
            }
        };
        input.click();
    };

    return (
        <div className="relative group">
            <div className="w-32 h-32 bg-white rounded-3xl p-1.5 shadow-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-navy to-indigo-900 rounded-2xl flex items-center justify-center text-white text-4xl font-black relative overflow-hidden group">
                    {user.full_name?.charAt(0) || '?'}
                    {/* Hover mask */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={triggerFile}>
                        <Camera className="w-8 h-8 text-white animate-bounce" />
                    </div>
                </div>
            </div>
            <button 
                onClick={triggerFile}
                className="absolute -bottom-2 -right-2 p-2 bg-gold hover:bg-gold-dark text-navy rounded-2xl shadow-lg border-2 border-white transition-all transform hover:scale-105"
            >
                <Camera className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Sub-Component: ProfileProgress ───────────────────────────────────────────
export function ProfileProgress({ percentage = 92 }: { percentage?: number }) {
    const radius = 30;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-2xl">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        stroke="#e2e8f0"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        stroke="hsl(var(--primary))"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <span className="absolute text-xs font-black text-navy">{percentage}%</span>
            </div>
            <div>
                <p className="text-xs font-black text-navy">Profile Strength</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Complete steps for full verification.</p>
            </div>
        </div>
    );
}

// ─── Sub-Component: ProfileBadge ──────────────────────────────────────────────
export function ProfileBadge({ label, type = "default" }: { label: string, type?: "gold" | "navy" | "default" }) {
    const styles = {
        gold: "bg-gold/15 text-gold-dark border-gold/30",
        navy: "bg-navy/10 text-navy border-navy/20",
        default: "bg-gray-100 text-gray-600 border-gray-200"
    };

    return (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${styles[type]}`}>
            {label}
        </span>
    );
}

// ─── Sub-Component: ProfileQuickLinks ─────────────────────────────────────────
export function ProfileQuickLinks() {
    const links = [
        { label: 'Campus Support Desk', icon: HelpCircle, link: '#' },
        { label: 'ERP User Manual', icon: FileText, link: '#' },
        { label: 'Security Center', icon: Shield, link: '#' },
    ];

    return (
        <div className="space-y-2">
            {links.map((link, idx) => (
                <a key={idx} href={link.link} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex items-center gap-2">
                        <link.icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{link.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                </a>
            ))}
        </div>
    );
}

// ─── Sub-Component: ProfileStats ──────────────────────────────────────────────
export function ProfileStats({ role }: { role: string }) {
    const isStudent = role === 'STUDENT';

    const studentStats = [
        { label: "Attendance Rate", value: "98.2%", trend: "+1.2% this term", points: [90, 92, 95, 94, 98] },
        { label: "Pending Fees", value: "$120.00", trend: "Due by next Monday", points: [150, 150, 120, 120, 120] },
        { label: "GPA Average", value: "3.85 / 4.0", trend: "+0.15 grade increase", points: [3.5, 3.6, 3.8, 3.7, 3.85] },
        { label: "Behavior Rating", value: "95 / 100", trend: "Exemplary conduct badge", points: [90, 95, 95, 95, 95] },
    ];

    const staffStats = [
        { label: "Available Leaves", value: "14 Days", trend: "4 Sick leaves remaining", points: [15, 15, 14, 14, 14] },
        { label: "Pending Approvals", value: "3 Requests", trend: "Requires board verify", points: [5, 4, 3, 3, 3] },
        { label: "Active Timetable", value: "24 Hours/wk", trend: "6 Classes scheduled", points: [20, 24, 24, 24, 24] },
        { label: "Active Student Count", value: "128 Students", trend: "+8 new additions", points: [120, 120, 128, 128, 128] },
    ];

    const activeStats = isStudent ? studentStats : staffStats;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeStats.map((stat, idx) => (
                <div key={idx} className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-xl font-black text-navy mt-1">{stat.value}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <span className="text-[9px] font-bold text-gray-500 leading-tight">{stat.trend}</span>
                        <Sparkline points={stat.points} color={isStudent ? "text-primary" : "text-amber-500"} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Sub-Component: ProfileActions ────────────────────────────────────────────
export function ProfileActions({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
    const actions = [
        { label: 'Edit Profile', icon: Edit2, action: () => onTabChange('edit' as any) },
        { label: 'Change Password', icon: Lock, action: () => onTabChange('security') },
        { label: 'Preferences', icon: Palette, action: () => onTabChange('preferences') },
        { label: 'Print Profile', icon: Printer, action: () => window.print() },
    ];

    return (
        <div className="flex flex-wrap gap-2.5">
            {actions.map((act, idx) => (
                <button
                    key={idx}
                    onClick={act.action}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:border-primary hover:bg-gray-50 text-xs font-bold text-navy rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
                >
                    <act.icon className="w-3.5 h-3.5 text-gray-500" />
                    {act.label}
                </button>
            ))}
        </div>
    );
}

// ─── Tab Content: Personal ────────────────────────────────────────────────────
function PersonalTab({ details }: { details: any }) {
    const fields = [
        { icon: Calendar, label: 'Date of Birth', value: details.dob },
        { icon: Heart, label: 'Blood Group', value: details.bloodGroup },
        { icon: User, label: 'Gender', value: details.gender },
        { icon: Globe, label: 'Nationality', value: details.nationality },
        { icon: MapPin, label: 'Residential Address', value: details.address },
        { icon: Phone, label: 'Emergency Contact No', value: details.emergencyContact },
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Demographics & Contact Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
                {fields.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                            <f.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">{f.label}</p>
                            <p className="text-xs font-bold text-navy mt-1 leading-relaxed">{f.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Tab Content: Academic ────────────────────────────────────────────────────
function AcademicTab({ role, details }: { role: string, details: any }) {
    const isStudent = role === 'STUDENT';

    if (isStudent) {
        const subjects = [
            { code: "MATH-10", name: "Mathematics", grade: "A+" },
            { code: "SCI-10", name: "General Science", grade: "A" },
            { code: "ENG-10", name: "English Language", grade: "B+" },
            { code: "HIS-10", name: "Social Studies & History", grade: "A" },
        ];

        return (
            <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Enrolled Course Parameters</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-xs text-gray-500 font-medium">Academic Program</span>
                                <span className="text-xs font-bold text-navy">High School Certificate</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-xs text-gray-500 font-medium">Grade & Class</span>
                                <span className="text-xs font-bold text-navy">{details.deptValue}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-xs text-gray-500 font-medium">Roll Number</span>
                                <span className="text-xs font-bold text-navy">{details.rollNo}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Assigned Advisors</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-xs text-gray-500 font-medium">Class Teacher</span>
                                <span className="text-xs font-bold text-navy">Mrs. Ananya Sen</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-xs text-gray-500 font-medium">Academic Counselor</span>
                                <span className="text-xs font-bold text-navy">Dr. Ramesh Chandra</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Active Subjects & Term Grades</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {subjects.map((sub, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{sub.code}</p>
                                    <p className="text-xs font-bold text-navy mt-0.5">{sub.name}</p>
                                </div>
                                <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-1 rounded-lg">
                                    Grade: {sub.grade}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Default academic view for staff/faculty
    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Teaching Assignments</h4>
                <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs text-gray-500 font-medium">Primary Subject</span>
                        <span className="text-xs font-bold text-navy">Advanced Mathematics</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs text-gray-500 font-medium">Primary Department</span>
                        <span className="text-xs font-bold text-navy">{details.deptValue}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs text-gray-500 font-medium">Workstation Location</span>
                        <span className="text-xs font-bold text-navy">{details.rollNo}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Teaching Timetable / Schedule</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        { time: "09:00 AM - 10:30 AM", class: "Grade 10 - Section A", day: "Mon / Wed" },
                        { time: "11:00 AM - 12:30 PM", class: "Grade 9 - Section C", day: "Tue / Thu" },
                        { time: "02:00 PM - 03:30 PM", class: "Grade 12 - Section B", day: "Friday" },
                    ].map((sched, idx) => (
                        <div key={idx} className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{sched.day}</p>
                            <p className="text-xs font-bold text-navy">{sched.class}</p>
                            <p className="text-[10px] font-bold text-primary mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {sched.time}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Tab Content: Documents ──────────────────────────────────────────────────
function DocumentsTab() {
    const [docs, setDocs] = useState([
        { name: "Passport Document Log", type: "Passport", status: "Verified", date: "Jan 12, 2026" },
        { name: "Student Birth Certificate", type: "Birth Certificate", status: "Verified", date: "Jan 12, 2026" },
        { name: "Transfer Certificate copy", type: "Transfer Certificate", status: "Pending", date: "Jan 15, 2026" },
        { name: "Government Identity card (Aadhar)", type: "Aadhar", status: "Verified", date: "Jan 12, 2026" },
    ]);

    const handleUploadDummy = () => {
        alert("Upload successful! Document submitted for review.");
        setDocs(prev => [
            ...prev,
            { name: "New Medical Certificate log", type: "Medical Certificate", status: "Pending", date: "Just now" }
        ]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Document Registry Logs</h3>
                <button 
                    onClick={handleUploadDummy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-navy hover:bg-navy-dark text-white text-xs font-bold rounded-xl transition-all"
                >
                    Upload Document
                </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {docs.map((doc, idx) => (
                    <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-400">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-navy">{doc.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{doc.type} • Uploaded {doc.date}</p>
                            </div>
                        </div>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                            doc.status === 'Verified' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                            {doc.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Tab Content: Timeline ────────────────────────────────────────────────────
function TimelineTab() {
    const events = [
        { title: "Profile Credentials Initialized", desc: "Security setup by campus registrar", time: "Jan 10, 2026 • 09:12 AM" },
        { title: "Admission Record Created", desc: "Import verification status approved", time: "Jan 12, 2026 • 02:44 PM" },
        { title: "Profile Security Updates", desc: "Password credentials set by user", time: "Jan 15, 2026 • 10:15 AM" },
        { title: "Registration Fee Logged", desc: "Finance verification ledger cleared", time: "Jan 18, 2026 • 04:30 PM" },
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Account Activity Timeline</h3>
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 py-2">
                {events.map((ev, idx) => (
                    <div key={idx} className="relative pl-6">
                        <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm" />
                        <div>
                            <p className="text-xs font-bold text-navy">{ev.title}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{ev.desc}</p>
                            <p className="text-[9px] font-bold text-primary mt-1">{ev.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Tab Content: Activity ────────────────────────────────────────────────────
function ActivityTab() {
    const logs = [
        { event: "Login Session Opened", device: "Chrome / Windows 11", location: "Hyderabad, IN", time: "Today 09:42 AM" },
        { event: "Change Password Form opened", device: "Chrome / Windows 11", location: "Hyderabad, IN", time: "Yesterday 03:22 PM" },
        { event: "Preferences Updated", device: "Safari / iOS Mobile", location: "Hyderabad, IN", time: "June 28, 2026" },
        { event: "Timeline recovered", device: "Chrome / macOS", location: "Mumbai, IN", time: "June 25, 2026" },
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Active Devices & Security Logs</h3>
            <div className="space-y-3">
                {logs.map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-gray-400 shadow-sm">
                                <Laptop className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-navy">{log.event}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{log.device} • {log.location}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{log.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Tab Content: Security ────────────────────────────────────────────────────
function SecurityTab({ onSuccess }: { onSuccess: () => void }) {
    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Change Account Password</h3>
                <ChangePasswordForm onSuccess={onSuccess} />
            </div>

            <div className="space-y-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-black text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Account Security Controls
                </h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-700">Two-Factor Authentication (2FA)</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Protect account access with custom OTP validation.</p>
                        </div>
                        <span className="bg-red-50 text-red-600 text-[8px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                            Inactive
                        </span>
                    </div>

                    <div className="flex justify-between items-start pt-3 border-t border-gray-200">
                        <div>
                            <p className="text-xs font-bold text-gray-700">Security Questions</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Recover account credentials securely.</p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            Configured
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab Content: Preferences ─────────────────────────────────────────────────
function PreferencesTab() {
    const { theme, setTheme, language, setLanguage, notifications, setNotificationPref } = useSettingsStore();

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                {/* Theme */}
                <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-gray-400" /> Theme Selection
                    </label>
                    <div className="flex gap-2">
                        {(['light', 'dark', 'system'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                                    theme === t 
                                        ? 'bg-navy text-white shadow-md' 
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language */}
                <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-gray-400" /> Locale / Language
                    </label>
                    <div className="flex gap-2">
                        {[
                            { id: 'en', label: '🇬🇧 English' },
                            { id: 'te', label: '🇮🇳 Telugu' }
                        ].map(l => (
                            <button
                                key={l.id}
                                onClick={() => setLanguage(l.id as 'en' | 'te')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    language === l.id 
                                        ? 'bg-navy text-white shadow-md' 
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notification checkboxes */}
            <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-gray-400" /> Broadcast System Alerts
                </label>
                <div className="space-y-2">
                    {[
                        { id: 'email' as const, label: 'Email Notifications' },
                        { id: 'push' as const, label: 'Push Notifications' },
                        { id: 'sms' as const, label: 'SMS Alerts' },
                    ].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs font-bold text-gray-700">{item.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    id={`notif-pref-${item.id}`}
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={!!notifications[item.id]}
                                    onChange={e => setNotificationPref(item.id, e.target.checked)}
                                />
                                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy" />
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Profile Page Component ──────────────────────────────────────────────
export const Profile = () => {
    const { user, refreshProfile } = useAuth();
    const queryClient = useQueryClient();
    
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [phone, setPhone] = useState(user?.phone_number || '');
    const [saved, setSaved] = useState(false);

    // Sync state to current logged in user profile
    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setPhone(user.phone_number || '');
        }
    }, [user]);

    const updateMutation = useMutation({
        mutationFn: () => ProfileService.updateProfile({ full_name: fullName, phone_number: phone }),
        onSuccess: async () => {
            setSaved(true);
            await refreshProfile();
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
            setTimeout(() => setSaved(false), 3000);
        },
    });

    const handleUploadAvatar = async (file: File) => {
        if (!user?.id) return;
        try {
            const publicUrl = await ProfileService.uploadAvatar(file, user.id);
            // Patch profile with new avatar URL
            await ProfileService.updateProfile({ full_name: fullName, phone_number: phone }); // standard API save
            alert("Avatar uploaded successfully!");
            await refreshProfile();
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to upload avatar");
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const primaryRole = user.roles?.[0] || 'ADMIN';
    const roleDetails = getRoleDetails(primaryRole, user.full_name || 'Sathish');

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Section 1: Hero Cover */}
            <ProfileHero user={user} role={primaryRole} />

            <div className="grid lg:grid-cols-4 gap-6 items-start">
                {/* Section 2: Floating Profile Card & Quick Info (1 column) */}
                <div className="lg:col-span-1 space-y-6 -mt-20 px-4 lg:px-0">
                    <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-5 text-center flex flex-col items-center">
                        <ProfileAvatar user={user} onUpload={handleUploadAvatar} />

                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-navy">{user.full_name}</h2>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{roleDetails.idValue}</p>
                            <p className="text-xs text-gray-500 font-bold">{roleDetails.deptValue}</p>
                        </div>

                        {/* Profile Strength circular Progress */}
                        <div className="w-full">
                            <ProfileProgress percentage={92} />
                        </div>

                        {/* Barcode & QR mock */}
                        <div className="w-full pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
                            <div className="w-32 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                <span className="text-[8px] font-black tracking-widest text-gray-400">|||||| ||| |||| ||</span>
                            </div>
                            <span className="text-[9px] font-black text-gray-400 tracking-widest">{roleDetails.idValue}</span>
                        </div>
                    </div>

                    {/* Left side Quick Details card */}
                    <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-4">
                        <h3 className="text-xs font-black text-navy uppercase tracking-wider">Quick Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-xs text-gray-400 font-bold">Email</span>
                                <span className="text-xs font-bold text-navy truncate max-w-[140px]">{user.email}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-xs text-gray-400 font-bold">Phone</span>
                                <span className="text-xs font-bold text-navy">{user.phone_number || 'None'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-xs text-gray-400 font-bold">Campus</span>
                                <span className="text-xs font-bold text-navy truncate max-w-[140px]">{roleDetails.campus}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area (3 columns on desktop) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Section 3: Quick Action Buttons */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <ProfileActions onTabChange={setActiveTab} />
                    </div>

                    {/* Section 4: Statistics Cards */}
                    <ProfileStats role={primaryRole} />

                    {/* Section 5: Animated Tab Panel Layout */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                        {/* Tab Headers */}
                        <div className="flex gap-1 border-b border-gray-150 overflow-x-auto pb-1 scrollbar-hide">
                            {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    id={`profile-tab-${id}`}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                                        activeTab === id 
                                            ? 'border-primary text-primary' 
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content Display */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="min-h-[250px]"
                            >
                                {activeTab === 'overview' && (
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-6">
                                            {/* Details card */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Core Demographics</h3>
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Full Name</p>
                                                        <p className="text-sm font-bold text-navy mt-1">{user.full_name}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Primary Email</p>
                                                        <p className="text-sm font-bold text-navy mt-1 truncate">{user.email}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">{roleDetails.idLabel}</p>
                                                        <p className="text-sm font-bold text-navy mt-1">{roleDetails.idValue}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">{roleDetails.deptLabel}</p>
                                                        <p className="text-sm font-bold text-navy mt-1">{roleDetails.deptValue}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Permissions Grid */}
                                            {user.permissions && user.permissions.length > 0 && (
                                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                    <h3 className="text-xs font-black text-gray-505 uppercase tracking-wide mb-3">Active System Permissions ({user.permissions.length})</h3>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {user.permissions.slice(0, 10).map(perm => (
                                                            <span key={perm} className="bg-white border border-gray-200 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                                                {perm}
                                                            </span>
                                                        ))}
                                                        {user.permissions.length > 10 && (
                                                            <span className="bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                                                +{user.permissions.length - 10} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-1 space-y-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">
                                            <div>
                                                <h3 className="text-xs font-black text-navy uppercase tracking-wider mb-3">Admissions Support</h3>
                                                <ProfileQuickLinks />
                                            </div>
                                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                <h4 className="text-xs font-black text-primary uppercase tracking-wide">Quick tip</h4>
                                                <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                                                    Keep preferences and time zones aligned to stay updated with campus notices.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'personal' && <PersonalTab details={roleDetails} />}
                                {activeTab === 'academic' && <AcademicTab role={primaryRole} details={roleDetails} />}
                                {activeTab === 'documents' && <DocumentsTab />}
                                {activeTab === 'timeline' && <TimelineTab />}
                                {activeTab === 'activity' && <ActivityTab />}
                                {activeTab === 'security' && <SecurityTab onSuccess={() => setActiveTab('overview')} />}
                                {activeTab === 'preferences' && <PreferencesTab />}

                                {activeTab === 'edit' && (
                                    <div className="max-w-md space-y-5">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Edit Core Profile Details</h3>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                                            <input
                                                id="profile-full-name"
                                                type="text"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:bg-white focus:border-primary focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Phone Number</label>
                                            <input
                                                id="profile-phone"
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder="+91 XXXXX XXXXX"
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:bg-white focus:border-primary focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                                            <input
                                                type="email"
                                                value={user.email}
                                                disabled
                                                className="w-full px-4 py-2.5 border border-gray-100 rounded-xl text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">Email cannot be modified online. Contact IT team.</p>
                                        </div>
                                        <button
                                            id="profile-save"
                                            onClick={() => updateMutation.mutate()}
                                            disabled={updateMutation.isPending}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-md shadow-primary/20 hover:bg-primary/95 transition-all disabled:opacity-60"
                                        >
                                            {updateMutation.isPending ? (
                                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                                            ) : saved ? (
                                                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                                            ) : (
                                                <><Save className="w-4 h-4" /> Save Changes</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
