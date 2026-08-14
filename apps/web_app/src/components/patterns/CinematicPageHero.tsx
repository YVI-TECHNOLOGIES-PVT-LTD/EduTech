import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeroMetadataItem {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}

export interface CinematicPageHeroProps {
  eyebrow?: string;
  title: string;
  accentText?: string;
  description?: string;
  backgroundImage: string;
  imagePosition?: string;
  metadataItems?: (string | HeroMetadataItem)[];
  badgeText?: string;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const CinematicPageHero: React.FC<CinematicPageHeroProps> = ({
  eyebrow,
  title,
  accentText,
  description,
  backgroundImage,
  imagePosition = 'object-center',
  metadataItems = [],
  badgeText,
  primaryAction,
  secondaryAction,
  className,
}) => {
  return (
    <section className={cn('relative w-full min-h-[540px] lg:min-h-[640px] flex items-center justify-center overflow-hidden bg-[#042A2B] text-white', className)}>
      {/* Background Image with Scale Animation */}
      <motion.div
        initial={{ scale: 1.05, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 z-0"
      >
        <img
          src={backgroundImage}
          alt={title}
          className={cn('w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]', imagePosition)}
        />
        {/* Layered Cinematic Deep Teal Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#042A2B]/95 via-[#063F40]/85 to-[#063F40]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#042A2B] via-transparent to-transparent opacity-90" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Hero Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24 flex flex-col justify-between min-h-[500px]">
        <div className="max-w-3xl space-y-6">
          {/* Eyebrow / Badge */}
          {eyebrow && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-[#E7B76A] text-xs font-bold border border-[#E7B76A]/30 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E7B76A]" />
              <span className="uppercase tracking-[0.18em] text-[10px] font-black">{eyebrow}</span>
            </motion.div>
          )}

          {badgeText && !eyebrow && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-[#E7B76A] text-xs font-bold border border-[#E7B76A]/30 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E7B76A]" />
              <span className="uppercase tracking-[0.18em] text-[10px] font-black">{badgeText}</span>
            </motion.div>
          )}

          {/* Main Editorial Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05]"
          >
            {title}{' '}
            {accentText && (
              <span className="text-[#E7B76A] underline decoration-[#E7B76A]/40 decoration-wavy decoration-2">
                {accentText}
              </span>
            )}
          </motion.h1>

          {/* Supporting Copy */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm sm:text-base lg:text-lg text-emerald-100/90 leading-relaxed font-normal max-w-2xl"
            >
              {description}
            </motion.p>
          )}

          {/* Optional Action Buttons */}
          {(primaryAction || secondaryAction) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className="px-6 py-3 bg-[#E7B76A] hover:bg-[#d8a658] text-[#063F40] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center space-x-2"
                >
                  <span>{primaryAction.label}</span>
                  <ArrowRight className="w-4 h-4 text-[#063F40]" />
                </button>
              )}
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 backdrop-blur-md transition-all"
                >
                  {secondaryAction.label}
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Bottom Metadata Trust Bar */}
        {metadataItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="pt-10 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs font-bold text-emerald-100/80"
          >
            {metadataItems.map((item, index) => {
              const label = typeof item === 'string' ? item : item.label;
              return (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-[#E7B76A] text-sm">•</span>}
                  <span className="inline-flex items-center space-x-1.5">
                    {typeof item !== 'string' && item.icon}
                    <span>{label}</span>
                  </span>
                </React.Fragment>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CinematicPageHero;
