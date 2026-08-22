import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { ProfileService } from '../services/auth/ProfileService';
import { ChangePasswordForm } from '../modules/auth/pages/ChangePasswordPage';
import { useThemeContext, ThemeMode } from '@/context/ThemeContext';
import { useSettingsStore } from '../store/settings.store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PhoneInput } from '@/components/ui/phone-input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Lock,
  Camera,
  CheckCircle2,
  Sliders,
  Save,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Sun,
  Moon,
  Monitor,
  Globe,
  Bell,
  Eye,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { QUERY_KEYS } from '../lib/queryKeys';

type Tab = 'overview' | 'security' | 'settings';
type SettingsSection = 'appearance' | 'language' | 'notifications' | 'accessibility';

export const Profile = () => {
  const { user, refreshProfile, systemMode } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>('appearance');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [saved, setSaved] = useState(false);

  // Theme & settings store
  const { theme: appTheme, setTheme: setAppTheme } = useThemeContext();
  const {
    density,
    setDensity,
    language,
    setLanguage,
    dateFormat,
    setDateFormat,
    timezone,
    setTimezone,
    notifications,
    setNotificationPref,
    reducedMotion,
    toggleReducedMotion,
    highContrast,
    toggleHighContrast,
    resetToDefaults,
  } = useSettingsStore();

  // Synchronize state with context user details
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
      await ProfileService.updateProfile({ full_name: fullName, phone_number: phone });
      alert('Avatar uploaded successfully!');
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to upload avatar');
    }
  };

  const triggerFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      if (e.target.files?.[0]) {
        handleUploadAvatar(e.target.files[0]);
      }
    };
    input.click();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent dark:border-white rounded-full animate-spin" />
      </div>
    );
  }

  const primaryRole = user.roles?.[0] || 'USER';
  const displayRoleName = primaryRole.replace(/_/g, ' ').toUpperCase();

  // Create clean short ID (e.g. #USR-246534)
  const shortId = `USR-${user.id.substring(0, 6).toUpperCase()}`;

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      {/* ─── Page Title Header & Navigation Tabs ────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Profile
          </h1>
        </div>

        {/* Tab Headers styled like the clean horizontal reference line */}
        <div className="flex gap-6 border-b border-slate-100 dark:border-neutral-800 pb-0.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`text-xs font-bold pb-2 transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`text-xs font-bold pb-2 transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300'
            }`}
          >
            Security Settings
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`text-xs font-bold pb-2 transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300'
            }`}
          >
            Preferences & Settings
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ─── Left Column: Identity Sidebar Card (4 spans) ────────────────── */}
              <div className="lg:col-span-4 bg-white dark:bg-black border border-slate-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-5">
                {/* Avatar & Name Row (Aligned horizontally matching screenshot) */}
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <Avatar size="xl" className="border border-border shadow-xs">
                      <AvatarImage
                        src={
                          (user as any)?.avatar_url ||
                          (user as any)?.avatar ||
                          (user as any)?.image ||
                          (user as any)?.profile_photo_url
                        }
                        alt={fullName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={triggerFileSelect}
                      aria-label="Upload avatar"
                      className="absolute -bottom-1 -right-1 p-1 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg shadow-md hover:scale-105 transition-all"
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 truncate leading-snug">
                      {fullName || 'EduTrack User'}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 mt-0.5">
                      #{shortId}
                    </p>
                  </div>
                </div>

                {/* About Section */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
                  <h3 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    About
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Phone: {phone || 'Not Configured'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Email: {user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Account Details Section */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
                  <h3 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Account Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Role: {displayRoleName}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>School: EduTrack Global School</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0 animate-pulse ml-0.5 mr-0.5" />
                      <span className="capitalize">
                        Status: {user.login_status ? user.login_status.toLowerCase() : 'active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Right Column: Information Forms & Cards (8 spans) ───────────── */}
              <div className="lg:col-span-8 space-y-6">
                {/* Personal Information */}
                <div className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-neutral-800 pb-3">
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Personal Information
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="profile-fullName"
                        className="block text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5"
                      >
                        Full Name
                      </label>
                      <input
                        id="profile-fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-100 dark:border-neutral-800 rounded-lg text-xs font-semibold bg-slate-50/50 dark:bg-neutral-950 focus:bg-white focus:border-slate-900 dark:focus:bg-black dark:focus:border-neutral-700 focus:outline-none transition-all text-slate-955 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profile-phone"
                        className="block text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5"
                      >
                        Phone Number
                      </label>
                      <PhoneInput id="profile-phone" value={phone} onChange={setPhone} />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="profile-email"
                        className="block text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5"
                      >
                        Email Address
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-3 py-2 border border-slate-100/60 dark:border-neutral-800/80 rounded-lg text-xs font-semibold text-slate-400 dark:text-neutral-500 bg-slate-50 dark:bg-neutral-900/10 cursor-not-allowed"
                      />
                      <p className="text-[9px] text-slate-400 dark:text-neutral-500 mt-1">
                        System account email address cannot be edited online.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-neutral-900/20">
                    <button
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold rounded-lg text-xs shadow-xs disabled:opacity-60 transition-all cursor-pointer"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/40 border-t-white dark:border-slate-950/40 dark:border-t-slate-950 rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : saved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Organization Details */}
                <div className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-neutral-800 pb-3">
                    Workspace Context
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50/50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl">
                      <span className="text-[9px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wide">
                        School / Institution
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        EduTrack Global School
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50/50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl">
                      <span className="text-[9px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wide">
                        Tenant ID Reference
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5 truncate">
                        {user.school_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role & Access */}
                <div className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-neutral-800 pb-3">
                    Role & Access Capabilities
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-slate-100 dark:bg-neutral-900 rounded-lg text-slate-600 dark:text-neutral-300 mt-0.5">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-50">
                          {displayRoleName} Account Type
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Your profile is initialized under institutional registry rules. Your roles
                          dictate modules available in the primary sidebar navigation.
                        </p>
                      </div>
                    </div>

                    {user.permissions && user.permissions.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-neutral-800">
                        <span className="block text-[9px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                          Active System Permissions ({user.permissions.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {user.permissions.slice(0, 8).map((perm) => (
                            <span
                              key={perm}
                              className="bg-slate-50 dark:bg-neutral-950 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-neutral-800 text-[9px] font-bold px-2 py-0.5 rounded-md"
                            >
                              {perm}
                            </span>
                          ))}
                          {user.permissions.length > 8 && (
                            <span className="bg-slate-50/50 dark:bg-neutral-950/25 text-slate-400 dark:text-neutral-500 text-[9px] font-bold px-2 py-0.5 rounded-md">
                              +{user.permissions.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            /* ─── Security Settings Tab Panel ────────────────────────────────────────── */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Change Password Panel */}
              <div className="md:col-span-7 bg-white dark:bg-black border border-slate-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 dark:border-neutral-800 pb-3">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Change Account Password
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Modify password credentials. Enter your current credentials to approve the
                    request.
                  </p>
                </div>
                <ChangePasswordForm onSuccess={() => setActiveTab('overview')} />
              </div>

              {/* Security Controls Status Panel */}
              <div className="md:col-span-5 bg-white dark:bg-black border border-slate-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 dark:border-neutral-800 pb-3">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    Security Controls
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-200">
                        Two-Factor Authentication (2FA)
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                        Secure your account access with dynamic OTP verification codes.
                      </p>
                    </div>
                    <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[8px] font-bold px-2 py-0.5 rounded-md border border-red-500/20 shrink-0">
                      Inactive
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
                    <div>
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-200">
                        Single Sign-On (SSO)
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                        Log in using your school identity provider credentials.
                      </p>
                    </div>
                    <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[8px] font-bold px-2 py-0.5 rounded-md border border-orange-500/20 shrink-0">
                      Linked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            /* ─── Preferences & Theme Settings Tab Panel ───────────────────────────────── */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Settings Mini Sidebar Navigation */}
              <div className="md:col-span-3 bg-white dark:bg-black border border-slate-100 dark:border-neutral-800 rounded-xl p-3 shadow-xs space-y-1">
                {[
                  { id: 'appearance' as const, label: 'Appearance', icon: Sun },
                  { id: 'language' as const, label: 'Language & Region', icon: Globe },
                  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
                  { id: 'accessibility' as const, label: 'Accessibility', icon: Eye },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSettingsSection(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                      activeSettingsSection === id
                        ? 'bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 dark:text-neutral-400 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-neutral-800">
                  <button
                    onClick={resetToDefaults}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15 rounded-lg transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Defaults
                  </button>
                </div>
              </div>

              {/* Settings Content Area */}
              <div className="md:col-span-9 bg-white dark:bg-black border border-slate-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
                {activeSettingsSection === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                        Theme Mode Selection
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'light' as const, label: 'Light', icon: Sun },
                          { id: 'dark' as const, label: 'Dark', icon: Moon },
                          { id: 'system' as const, label: 'System', icon: Monitor },
                        ].map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setAppTheme(id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                              appTheme === id
                                ? 'border-slate-950 bg-slate-950/5 text-slate-950 font-bold dark:border-white dark:bg-white/10 dark:text-white'
                                : 'border-slate-100 bg-transparent hover:bg-slate-50 text-slate-500 dark:border-neutral-800 dark:hover:bg-neutral-900/60 dark:text-neutral-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 dark:border-neutral-900/20">
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                        Layout Spacing Density
                      </h4>
                      <div className="flex gap-2.5">
                        {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDensity(d)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                              density === d
                                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/80'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsSection === 'language' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                        Preferred Locale
                      </h4>
                      <div className="flex gap-2.5">
                        {[
                          { id: 'en' as const, label: '🇬🇧 English' },
                          { id: 'te' as const, label: '🇮🇳 Telugu' },
                        ].map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setLanguage(l.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              language === l.id
                                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/80'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-neutral-900/20">
                      <div>
                        <label
                          htmlFor="pref-date-format"
                          className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5"
                        >
                          Date Notation Format
                        </label>
                        <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as any)}>
                          <SelectTrigger
                            id="pref-date-format"
                            className="w-full h-9 text-xs font-semibold bg-card text-foreground"
                          >
                            <SelectValue placeholder="Select Date Format" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g. 29/06/2026)</SelectItem>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/29/2026)</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-29)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label
                          htmlFor="pref-timezone"
                          className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5"
                        >
                          Workspace Timezone
                        </label>
                        <Select value={timezone} onValueChange={(v) => setTimezone(v)}>
                          <SelectTrigger
                            id="pref-timezone"
                            className="w-full h-9 text-xs font-semibold bg-card text-foreground"
                          >
                            <SelectValue placeholder="Select Timezone" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Asia/Kolkata">
                              IST — Asia/Kolkata (UTC+5:30)
                            </SelectItem>
                            <SelectItem value="UTC">UTC — Coordinated Universal Time</SelectItem>
                            <SelectItem value="America/New_York">
                              EST — America/New_York (UTC-5:00)
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              GMT — Europe/London (UTC+0:00)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsSection === 'notifications' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                      Broadcast Alert Channels
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        {
                          id: 'email' as const,
                          label: 'Email Notifications',
                          desc: 'Receive periodic system reports and action items via email.',
                        },
                        {
                          id: 'push' as const,
                          label: 'Browser Push Alerts',
                          desc: 'Realtime updates for direct messages and system triggers.',
                        },
                        {
                          id: 'sms' as const,
                          label: 'SMS Service Alerts',
                          desc: 'Critical alert notifications dispatched directly to your mobile device.',
                        },
                      ].map(({ id, label, desc }) => (
                        <div
                          key={id}
                          className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50/50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-55">
                              {label}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {desc}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                            <input
                              id={`settings-pref-${id}`}
                              type="checkbox"
                              className="sr-only peer"
                              checked={notifications[id]}
                              onChange={(e) => setNotificationPref(id, e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-slate-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 dark:after:border-neutral-700 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950 dark:peer-checked:bg-white" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSettingsSection === 'accessibility' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                      Visual Adjustment Controls
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        {
                          id: 'reduced-motion',
                          label: 'Reduced Motion Mode',
                          desc: 'Minimize page layout entrance animations and graphic transitions.',
                          value: reducedMotion,
                          toggle: toggleReducedMotion,
                        },
                        {
                          id: 'high-contrast',
                          label: 'High Contrast Mode',
                          desc: 'Increase border outlines and text visibility parameters.',
                          value: highContrast,
                          toggle: toggleHighContrast,
                        },
                      ].map(({ id, label, desc, value, toggle }) => (
                        <div
                          key={id}
                          className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50/50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-55">
                              {label}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {desc}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                            <input
                              id={`access-${id}`}
                              type="checkbox"
                              className="sr-only peer"
                              checked={value}
                              onChange={toggle}
                            />
                            <div className="w-9 h-5 bg-slate-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 dark:after:border-neutral-700 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950 dark:peer-checked:bg-white" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Profile;
