import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeContext, ThemeMode } from '@/context/ThemeContext';
import { useSettingsStore } from '../store/settings.store';
import {
  Palette,
  Globe,
  Bell,
  Shield,
  Clock,
  Eye,
  Monitor,
  Sun,
  Moon,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

type SettingsSection =
  'appearance' | 'language' | 'notifications' | 'security' | 'datetime' | 'accessibility';

const SECTIONS: { id: SettingsSection; label: string; icon: React.ElementType; desc: string }[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    desc: 'Theme, density, and interface mode',
  },
  {
    id: 'language',
    label: 'Language & Region',
    icon: Globe,
    desc: 'Language, date format, timezone',
  },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email, push, and SMS alerts' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Password and session management' },
  {
    id: 'datetime',
    label: 'Date & Time',
    icon: Clock,
    desc: 'Date format and timezone preferences',
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: Eye,
    desc: 'Motion, contrast, and visual aids',
  },
];

// ─── Section: Appearance ──────────────────────────────────────────────────────
function AppearanceSection() {
  const { theme, setTheme } = useThemeContext();
  const { density, setDensity } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`theme-${id}`}
              type="button"
              onClick={() => setTheme(id as ThemeMode)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === id
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border/80 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">
          Layout Density
        </label>
        <div className="flex gap-2">
          {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
            <button
              key={d}
              id={`density-${d}`}
              type="button"
              onClick={() => setDensity(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                density === d
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Controls spacing between interface elements.
        </p>
      </div>
    </div>
  );
}

// ─── Section: Language & Region ───────────────────────────────────────────────
function LanguageSection() {
  const { language, setLanguage, dateFormat, setDateFormat, timezone, setTimezone } =
    useSettingsStore();

  return (
    <div className="space-y-6 max-w-sm">
      <div>
        <label className="block text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">
          Language
        </label>
        <div className="flex gap-2">
          {[
            { id: 'en', label: '🇬🇧 English' },
            { id: 'te', label: '🇮🇳 Telugu' },
          ].map((l) => (
            <button
              key={l.id}
              id={`lang-${l.id}`}
              type="button"
              onClick={() => setLanguage(l.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                language === l.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">
          Date Format
        </label>
        <select
          id="date-format"
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value as any)}
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-medium bg-card text-foreground focus:border-primary focus:outline-none"
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 29/06/2026)</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/29/2026)</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-29)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">
          Timezone
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-medium bg-card text-foreground focus:border-primary focus:outline-none"
        >
          <option value="Asia/Kolkata">IST — Asia/Kolkata (UTC+5:30)</option>
          <option value="UTC">UTC — Coordinated Universal Time</option>
          <option value="America/New_York">EST — America/New_York (UTC-5:00)</option>
          <option value="Europe/London">GMT — Europe/London (UTC+0:00)</option>
        </select>
      </div>
    </div>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────
function NotificationsSection() {
  const { notifications, setNotificationPref } = useSettingsStore();
  const prefs = [
    { id: 'email' as const, label: 'Email Notifications', desc: 'Receive ERP updates via email' },
    {
      id: 'push' as const,
      label: 'Push Notifications',
      desc: 'Browser push alerts for important events',
    },
    { id: 'sms' as const, label: 'SMS Alerts', desc: 'Critical fee and attendance alerts via SMS' },
  ];

  return (
    <div className="space-y-3 max-w-md">
      {prefs.map(({ id, label, desc }) => (
        <div
          key={id}
          className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/80"
        >
          <div>
            <p className="text-sm font-bold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              id={`settings-notif-${id}`}
              type="checkbox"
              className="sr-only peer"
              checked={notifications[id]}
              onChange={(e) => setNotificationPref(id, e.target.checked)}
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      ))}
    </div>
  );
}

// ─── Section: Accessibility ───────────────────────────────────────────────────
function AccessibilitySection() {
  const { reducedMotion, toggleReducedMotion, highContrast, toggleHighContrast } =
    useSettingsStore();

  return (
    <div className="space-y-3 max-w-md">
      {[
        {
          id: 'reduced-motion',
          label: 'Reduced Motion',
          desc: 'Disable animations for better focus',
          value: reducedMotion,
          toggle: toggleReducedMotion,
        },
        {
          id: 'high-contrast',
          label: 'High Contrast',
          desc: 'Increase text and border contrast for visibility',
          value: highContrast,
          toggle: toggleHighContrast,
        },
      ].map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/80"
        >
          <div>
            <p className="text-sm font-bold text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              id={`access-${item.id}`}
              type="checkbox"
              className="sr-only peer"
              checked={item.value}
              onChange={item.toggle}
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      ))}
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const { resetToDefaults } = useSettingsStore();

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return <AppearanceSection />;
      case 'language':
        return <LanguageSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'accessibility':
        return <AccessibilitySection />;
      case 'security':
        return (
          <div className="text-sm text-muted-foreground bg-card p-4 rounded-xl border border-border max-w-sm">
            To change your password, visit{' '}
            <a href="/app/profile" className="text-primary font-bold hover:underline">
              Profile → Security tab
            </a>
            .
          </div>
        );
      case 'datetime':
        return <LanguageSection />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your ERP preferences and security.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-52 shrink-0 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`settings-nav-${id}`}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                activeSection === id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">{label}</span>
              {activeSection !== id && <ChevronRight className="w-3 h-3 ml-auto opacity-40" />}
            </button>
          ))}

          <div className="pt-4 border-t border-border/80">
            <button
              id="settings-reset"
              onClick={resetToDefaults}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-card rounded-2xl border border-border/80 shadow-sm p-6">
          {SECTIONS.find((s) => s.id === activeSection) && (
            <div className="mb-5 pb-4 border-b border-border/80">
              <h2 className="text-sm font-black text-foreground">
                {SECTIONS.find((s) => s.id === activeSection)!.label}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {SECTIONS.find((s) => s.id === activeSection)!.desc}
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
