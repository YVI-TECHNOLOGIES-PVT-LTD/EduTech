import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accessibility,
  Globe,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Shield,
  Sun,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeMode, useThemeContext } from '@/context/ThemeContext';
import { useSettingsStore } from '@/store/settings.store';
import { cn } from '@/lib/utils';
import { ParentUnsupportedNotice } from '../components/ParentStates';

export const ParentSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeContext();
  const {
    density,
    setDensity,
    language,
    setLanguage,
    dateFormat,
    setDateFormat,
    timezone,
    setTimezone,
    reducedMotion,
    toggleReducedMotion,
    highContrast,
    toggleHighContrast,
    resetToDefaults,
  } = useSettingsStore();

  const handleReset = () => {
    resetToDefaults();
    setTheme('system');
    toast.success('Browser display preferences reset to defaults.');
  };

  return (
    <PageContainer data-testid="parent-settings-page">
      <PageHeader
        title="Settings"
        description="Manage browser display appearance, regional formatting, accessibility preferences, and account security."
        badge={
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
            Parent Preferences
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/app/parent/profile')}
              className="rounded-xl gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Profile &amp; Password</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="rounded-xl gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Display Defaults</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance */}
          <Card className="p-6 rounded-2xl border-border bg-card space-y-5">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Appearance &amp; Layout</h2>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Theme Mode
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id as ThemeMode)}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                      theme === id
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Display Density
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer',
                      density === d
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Language & Regional Formatting */}
          <Card className="p-6 rounded-2xl border-border bg-card space-y-5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Language &amp; Region</h2>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Interface Language
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'te', label: 'Telugu' },
                ].map((lang) => (
                  <Button
                    key={lang.id}
                    type="button"
                    size="sm"
                    variant={language === lang.id ? 'default' : 'outline'}
                    onClick={() => setLanguage(lang.id as any)}
                    className="rounded-xl text-xs"
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Date Format
                </div>
                <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as any)}>
                  <SelectTrigger className="h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Timezone
                </div>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">IST — Asia/Kolkata</SelectItem>
                    <SelectItem value="UTC">UTC — Coordinated Universal</SelectItem>
                    <SelectItem value="America/New_York">EST — America/New_York</SelectItem>
                    <SelectItem value="Europe/London">GMT — Europe/London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Accessibility & Account Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 rounded-2xl border-border bg-card space-y-4">
            <div className="flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Accessibility</h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: 'Reduced Motion',
                  desc: 'Minimize animations across transitions and dashboard cards.',
                  checked: reducedMotion,
                  onToggle: toggleReducedMotion,
                },
                {
                  label: 'High Contrast',
                  desc: 'Increase border and typography contrast for readability.',
                  checked: highContrast,
                  onToggle: toggleHighContrast,
                },
              ].map((pref) => (
                <div
                  key={pref.label}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-muted/40 border border-border/70"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">{pref.label}</div>
                    <div className="text-[11px] text-muted-foreground">{pref.desc}</div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={pref.checked ? 'default' : 'outline'}
                    onClick={pref.onToggle}
                    className="rounded-xl text-xs shrink-0"
                  >
                    {pref.checked ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-border bg-card space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">
                Account &amp; Guardian Access
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manage your signed-in guardian profile details, phone verification status, and account
              password on your My Profile page.
            </p>
            <div>
              <Button
                onClick={() => navigate('/app/parent/profile')}
                className="rounded-xl text-xs"
              >
                Open My Profile &amp; Security
              </Button>
            </div>
          </Card>
        </div>

        {/* Unsupported Server-Synced Notification Channel Preferences Notice */}
        <ParentUnsupportedNotice
          title="Server-Synced Notification Channel Preferences Not Available Yet"
          description="The preferences above control visual appearance and accessibility in this browser only. Server-synced per-channel delivery preferences (such as SMS, WhatsApp, or Email opt-out schedules) require dedicated preference tables not included in the frozen Stage-1 database."
          details={[
            'School notifications and alerts continue to be delivered in your Notifications feed and account inbox.',
            'To update guardian contact details on school record, please contact the school office or raise a Helpdesk request.',
          ]}
        />
      </div>
    </PageContainer>
  );
};

export default ParentSettingsPage;
