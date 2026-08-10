import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, HeartHandshake, Award, Users } from 'lucide-react';
import { TRUST_METRICS_DATA } from '../data/landing-content';

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  HeartHandshake,
  Award,
  Users,
};

export const TrustMetrics: React.FC = () => {
  return (
    <section className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {TRUST_METRICS_DATA.map((metric, index) => {
            const IconComponent = iconMap[metric.iconName || 'Award'] || Award;
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`flex items-center gap-3 sm:gap-4 ${
                  index >= 2 ? 'pt-4 md:pt-0' : ''
                } ${index % 2 !== 0 ? 'pl-2 sm:pl-4 md:pl-6' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                  <IconComponent className="w-6 h-6 text-indigo-900" />
                </div>
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {metric.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-700">
                    {metric.label}
                  </div>
                  {metric.description && (
                    <div className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
                      {metric.description}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustMetrics;
