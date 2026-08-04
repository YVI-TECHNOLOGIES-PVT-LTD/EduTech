import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { useAssessmentConfiguration } from '../hooks/useAssessmentConfiguration';
import { useToast } from '../../../../components/ui/use-toast';
import { 
    ShieldCheck, Loader2, Settings, Hourglass, CheckSquare, Eye, Lock, 
    RefreshCw, Shuffle, BookOpen, Bell, ShieldAlert, Award
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';

export function ConfigurationPanel() {
    const { configurations, isLoading, updateConfig, isUpdating } = useAssessmentConfiguration();
    const { toast } = useToast();
    const [activeSubTab, setActiveSubTab] = useState<'general' | 'duration' | 'marking' | 'security' | 'publishing' | 'notifications'>('general');

    const config = configurations[0];

    const [maxUpload, setMaxUpload] = useState(10);
    const [autosave, setAutosave] = useState(10);
    const [heartbeat, setHeartbeat] = useState(30);
    const [timezone, setTimezone] = useState('UTC');
    const [retentionTelemetry, setRetentionTelemetry] = useState(90);
    const [retentionAttempts, setRetentionAttempts] = useState(7);

    // Settings fields
    const [duration, setDuration] = useState(60);
    const [passingMarks, setPassingMarks] = useState(40);
    const [negativeMarking, setNegativeMarking] = useState(false);
    const [negativeValue, setNegativeValue] = useState(0);
    const [browserLock, setBrowserLock] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleOptions, setShuffleOptions] = useState(false);
    const [emailOnScheduled, setEmailOnScheduled] = useState(true);
    const [emailOnGraded, setEmailOnGraded] = useState(true);
    const [attemptLimit, setAttemptLimit] = useState(1);
    const [evaluationType, setEvaluationType] = useState('AUTO');

    // Sync state with loaded configuration
    const [loadedId, setLoadedId] = useState<string | null>(null);
    if (config && config.id !== loadedId) {
        setLoadedId(config.id!);
        setMaxUpload(config.max_upload_size_mb);
        setAutosave(config.autosave_interval_secs);
        setHeartbeat(config.default_heartbeat_secs);
        setTimezone(config.timezone);
        setRetentionTelemetry(config.retention_telemetry_days);
        setRetentionAttempts(config.retention_attempts_years);

        const settings = config.settings || {};
        setDuration(settings.durationMinutes ?? 60);
        setPassingMarks(settings.passingMarks ?? 40);
        setNegativeMarking(settings.negativeMarking ?? false);
        setNegativeValue(settings.negativeMarkingValue ?? 0);
        setBrowserLock(settings.browserLock ?? false);
        setFullscreen(settings.fullscreenEnforcement ?? false);
        setShuffleQuestions(settings.shuffleQuestions ?? false);
        setShuffleOptions(settings.shuffleOptions ?? false);
        setEmailOnScheduled(settings.notifications?.emailOnScheduled ?? true);
        setEmailOnGraded(settings.notifications?.emailOnGraded ?? true);
        setAttemptLimit(settings.attemptLimit ?? 1);
        setEvaluationType(settings.evaluationType ?? 'AUTO');
    }

    const handleSave = async () => {
        if (!config?.id) return;
        try {
            const payload = {
                max_upload_size_mb: maxUpload,
                autosave_interval_secs: autosave,
                default_heartbeat_secs: heartbeat,
                timezone,
                retention_telemetry_days: retentionTelemetry,
                retention_attempts_years: retentionAttempts,
                settings: {
                    ...config.settings,
                    durationMinutes: duration,
                    passingMarks,
                    negativeMarking,
                    negativeMarkingValue: negativeValue,
                    browserLock,
                    fullscreenEnforcement: fullscreen,
                    shuffleQuestions,
                    shuffleOptions,
                    attemptLimit,
                    evaluationType,
                    notifications: {
                        emailOnScheduled,
                        emailOnGraded
                    }
                }
            };

            await updateConfig({
                configId: config.id,
                payload
            });

            toast({
                title: 'Success',
                description: 'Assessment configuration settings saved successfully.'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update settings.'
            });
        }
    };

    if (isLoading) {
        return (
            <Card className="rounded-2xl border border-gray-100 shadow-sm col-span-2">
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-2 text-sm text-gray-500 font-bold">Loading configuration settings...</span>
                </CardContent>
            </Card>
        );
    }

    const subTabs = [
        { key: 'general', label: 'General', icon: Settings },
        { key: 'duration', label: 'Duration', icon: Hourglass },
        { key: 'marking', label: 'Marking', icon: Award },
        { key: 'security', label: 'Security & Lock', icon: Lock },
        { key: 'publishing', label: 'Autosave & Shuffle', icon: Shuffle },
        { key: 'notifications', label: 'Notifications', icon: Bell },
    ] as const;

    return (
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white col-span-2">
            <CardHeader className="border-b border-gray-50 pb-4">
                <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Active Platform Configurations
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                    Define maximum file upload constraints, autosave frequencies, and server telemetries checkups.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar SubTabs */}
                    <div className="lg:w-1/4 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-gray-100 pr-0 lg:pr-4">
                        {subTabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveSubTab(tab.key)}
                                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                                        activeSubTab === tab.key 
                                            ? 'bg-primary/10 text-primary' 
                                            : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Content Fields Form */}
                    <div className="flex-1 space-y-5 min-h-[300px]">
                        {activeSubTab === 'general' && (
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Max Upload Size (MB)</Label>
                                    <Input
                                        type="number"
                                        value={maxUpload}
                                        onChange={(e) => setMaxUpload(Number(e.target.value))}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">System Timezone</Label>
                                    <Input
                                        type="text"
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Telemetry Retention (Days)</Label>
                                    <Input
                                        type="number"
                                        value={retentionTelemetry}
                                        onChange={(e) => setRetentionTelemetry(Number(e.target.value))}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Attempts Retention (Years)</Label>
                                    <Input
                                        type="number"
                                        value={retentionAttempts}
                                        onChange={(e) => setRetentionAttempts(Number(e.target.value))}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'duration' && (
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">Default Exam Duration (Minutes)</Label>
                                    <Input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">System Heartbeat Frequencies (Seconds)</Label>
                                    <Input
                                        type="number"
                                        value={heartbeat}
                                        onChange={(e) => setHeartbeat(Number(e.target.value))}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'marking' && (
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Passing Cutoff Percentage (%)</Label>
                                    <Input
                                        type="number"
                                        value={passingMarks}
                                        onChange={(e) => setPassingMarks(Number(e.target.value))}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Evaluation Strategy</Label>
                                    <Select value={evaluationType} onValueChange={setEvaluationType}>
                                        <SelectTrigger className="rounded-xl border-gray-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AUTO" className="text-xs font-bold">Automatic Marking</SelectItem>
                                            <SelectItem value="MANUAL" className="text-xs font-bold">Manual Evaluation</SelectItem>
                                            <SelectItem value="HYBRID" className="text-xs font-bold">Hybrid Marking</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 flex items-center justify-between border border-gray-50 bg-gray-50/50 p-4 rounded-2xl mt-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black text-gray-900">Apply Negative Marking</Label>
                                        <p className="text-[10px] text-gray-400 font-bold">Penalize candidate score on incorrect response inputs.</p>
                                    </div>
                                    <Switch checked={negativeMarking} onCheckedChange={setNegativeMarking} />
                                </div>
                                {negativeMarking && (
                                    <div className="space-y-1 col-span-2 animate-fadeIn">
                                        <Label className="text-xs font-bold text-gray-700">Negative Marks Value</Label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            value={negativeValue}
                                            onChange={(e) => setNegativeValue(Number(e.target.value))}
                                            className="rounded-xl border-gray-200"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSubTab === 'security' && (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Attempt Threshold Limit per Candidate</Label>
                                    <Input
                                        type="number"
                                        value={attemptLimit}
                                        onChange={(e) => setAttemptLimit(Number(e.target.value))}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                                <div className="flex items-center justify-between border border-gray-50 bg-gray-50/50 p-4 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black text-gray-900">Enforce Browser Safe Lock</Label>
                                        <p className="text-[10px] text-gray-400 font-bold">Disable candidate tab actions or browser window switches.</p>
                                    </div>
                                    <Switch checked={browserLock} onCheckedChange={setBrowserLock} />
                                </div>
                                <div className="flex items-center justify-between border border-gray-50 bg-gray-50/50 p-4 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black text-gray-900">Fullscreen Enforcement</Label>
                                        <p className="text-[10px] text-gray-400 font-bold">Force exam screen into fullscreen with immediate suspension triggers.</p>
                                    </div>
                                    <Switch checked={fullscreen} onCheckedChange={setFullscreen} />
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'publishing' && (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-700">Browser Autosave Intervals (Seconds)</Label>
                                    <Input
                                        type="number"
                                        value={autosave}
                                        onChange={(e) => setAutosave(Number(e.target.value))}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                                <div className="flex items-center justify-between border border-gray-50 bg-gray-50/50 p-4 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black text-gray-900">Shuffle Questions</Label>
                                        <p className="text-[10px] text-gray-400 font-bold">Randomize questions order for different students.</p>
                                    </div>
                                    <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
                                </div>
                                <div className="flex items-center justify-between border border-gray-50 bg-gray-50/50 p-4 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black text-gray-900">Shuffle Options</Label>
                                        <p className="text-[10px] text-gray-400 font-bold">Randomize MCQ options order for different students.</p>
                                    </div>
                                    <Switch checked={shuffleOptions} onCheckedChange={setShuffleOptions} />
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'notifications' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border border-gray-50 bg-gray-50/50 p-4 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black text-gray-900">Send Email on Scheduled</Label>
                                        <p className="text-[10px] text-gray-400 font-bold">Send mail alerts immediately once a slot is published.</p>
                                    </div>
                                    <Switch checked={emailOnScheduled} onCheckedChange={setEmailOnScheduled} />
                                </div>
                                <div className="flex items-center justify-between border border-gray-50 bg-gray-50/50 p-4 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-black text-gray-900">Send Email on Graded</Label>
                                        <p className="text-[10px] text-gray-400 font-bold">Send result notifications to students and parents once graded.</p>
                                    </div>
                                    <Switch checked={emailOnGraded} onCheckedChange={setEmailOnGraded} />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-gray-50">
                            <Button
                                onClick={handleSave}
                                disabled={isUpdating}
                                className="bg-primary text-white flex items-center gap-1.5 rounded-xl text-xs font-black px-5 shadow-premium-sm"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" /> Save Configuration
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
export default ConfigurationPanel;
