import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  variant?: 'navbar' | 'compact' | 'landing';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { language, languageConfig, supportedLanguages, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 px-2.5 rounded-xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-xs gap-1.5 transition-colors cursor-pointer ${className}`}
          aria-label={`Current language: ${languageConfig.nativeName}. Click to change language`}
          title="Change language"
        >
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className={variant === 'compact' ? 'hidden sm:inline' : 'inline'}>
            {languageConfig.nativeName}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 bg-white dark:bg-black border border-border/80 dark:border-zinc-800 shadow-xl rounded-xl p-1 z-50 max-h-80 overflow-y-auto custom-scrollbar"
      >
        <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 py-1.5">
          Select Language / భాష / भाषा
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60 dark:bg-zinc-850" />

        {Object.values(supportedLanguages).map((lang) => {
          const isActive = language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              translate="no"
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors notranslate ${
                isActive
                  ? 'bg-foreground text-background font-extrabold'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{lang.nativeName}</span>
                <span
                  className={`text-[10px] font-normal ${
                    isActive ? 'text-background/80' : 'text-muted-foreground'
                  }`}
                >
                  ({lang.displayName})
                </span>
              </div>
              {isActive && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
