import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const GLASS = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-sm';

export const FinanceSettings = () => {
    const [settings, setSettings] = useState<any>({
        receipt_prefix: 'RCPT',
        demand_prefix: 'DEM',
        currency: 'INR',
        currency_symbol: '₹',
        late_fee_enabled: false,
        late_fee_percentage: 0,
        grace_days: 0,
        default_payment_window_days: 30,
        receipt_footer: '',
        school_year_label: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/fees/settings');
            setSettings(data);
        } catch {
            toast.error('Failed to load finance settings');
        } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await apiClient.put('/fees/settings', settings);
            setSettings(data);
            toast.success('Settings updated successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update settings');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-6 animate-pulse">
                <div className="h-10 w-64 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="h-96 bg-slate-200 dark:bg-white/10 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <Settings className="w-6 h-6 text-emerald-500" /> Settings
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Configure global financial engine parameters</p>
                </div>
            </div>

            <div className={`${GLASS} p-6 max-w-2xl space-y-6`}>
                <div className="grid grid-cols-2 gap-4">
                    {/* Prefix settings */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Receipt Number Prefix</label>
                        <input value={settings.receipt_prefix || ''}
                            onChange={e => setSettings((s: any) => ({ ...s, receipt_prefix: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Demand Number Prefix</label>
                        <input value={settings.demand_prefix || ''}
                            onChange={e => setSettings((s: any) => ({ ...s, demand_prefix: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>

                    {/* Currency Settings */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Currency (ISO)</label>
                        <input value={settings.currency || ''}
                            onChange={e => setSettings((s: any) => ({ ...s, currency: e.target.value }))}
                            placeholder="INR"
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Currency Symbol</label>
                        <input value={settings.currency_symbol || ''}
                            onChange={e => setSettings((s: any) => ({ ...s, currency_symbol: e.target.value }))}
                            placeholder="₹"
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                </div>

                <hr className="border-slate-200 dark:border-white/10" />

                {/* Billing settings */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Default Payment Window (Days)</label>
                        <input type="number" value={settings.default_payment_window_days ?? 30}
                            onChange={e => setSettings((s: any) => ({ ...s, default_payment_window_days: parseInt(e.target.value) || 30 }))}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">School Year Label</label>
                        <input value={settings.school_year_label || ''}
                            onChange={e => setSettings((s: any) => ({ ...s, school_year_label: e.target.value }))}
                            placeholder="e.g. 2026-27"
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                </div>

                <hr className="border-slate-200 dark:border-white/10" />

                {/* Late fee settings */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold">Enable Late Fee Penalty</p>
                            <p className="text-xs text-slate-400">Automatically calculate and post penalty for overdue demands</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.late_fee_enabled || false}
                                onChange={e => setSettings((s: any) => ({ ...s, late_fee_enabled: e.target.checked }))}
                                className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    {settings.late_fee_enabled && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Late Fee Percentage (%)</label>
                                <input type="number" step="0.01" value={settings.late_fee_percentage ?? 0}
                                    onChange={e => setSettings((s: any) => ({ ...s, late_fee_percentage: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Grace Days</label>
                                <input type="number" value={settings.grace_days ?? 0}
                                    onChange={e => setSettings((s: any) => ({ ...s, grace_days: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-slate-200 dark:border-white/10" />

                {/* Footer text */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Receipt Footer Note</label>
                    <textarea value={settings.receipt_footer || ''}
                        onChange={e => setSettings((s: any) => ({ ...s, receipt_footer: e.target.value }))}
                        rows={3} placeholder="Thank you for your payment. Keep this copy for audit purposes."
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
                </div>

                <div className="flex gap-3">
                    <button onClick={fetchSettings} className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Reset</button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-emerald-50 to-teal-600 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-emerald-200 dark:hover:shadow-emerald-950/20 transition-all disabled:opacity-50">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};
