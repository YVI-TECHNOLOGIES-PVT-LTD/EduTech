import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, LogOut, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PendingApprovalPage = () => {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-2">Login Access Pending</h1>
                <p className="text-gray-500 mb-8">
                    Hello, <span className="font-bold text-gray-800">{user?.full_name}</span>. Your account registration is complete, but your login access is currently <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold uppercase tracking-wider">{user?.login_status}</span>.
                </p>

                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-left">
                        <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            What happens next?
                        </h3>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            A school administrator will review your application and approve your dashboard access. You will be able to access all features once your login is <span className="font-bold underline">APPROVED</span>.
                        </p>
                    </div>

                    {user?.login_decision_reason && user.login_status === 'REJECTED' && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-left">
                            <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                Rejection Reason
                            </h3>
                            <p className="text-sm text-red-700 leading-relaxed">
                                {user.login_decision_reason}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-3 pt-4">
                        <Link
                            to="/app/admissions/my"
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100"
                        >
                            <FileText className="w-5 h-5" />
                            View Admission Status
                        </Link>

                        <button
                            onClick={() => signOut()}
                            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-bold py-3 rounded-xl transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-xs text-gray-400">
                    If you believe this is an error, please contact the school administration.
                </p>
            </div>
        </div>
    );
};
