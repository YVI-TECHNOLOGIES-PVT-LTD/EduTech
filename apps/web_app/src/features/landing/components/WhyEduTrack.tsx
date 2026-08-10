import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Globe, Palette, Activity, ArrowRight } from 'lucide-react';
import { WHY_EDUTRACK_DATA } from '../data/landing-content';

const iconMap: Record<string, React.ElementType> = {
  Cpu,
  Globe,
  Palette,
  Activity,
};

export const WhyEduTrack: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-10 sm:mb-14">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-100/80 px-3 py-1 rounded-full">
            Why Choose EduTrack
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            More than a school. <br className="hidden sm:inline" />
            <span className="text-indigo-900">A foundation for life.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            We offer an integrated educational environment that combines rigorous academic learning with character, leadership, and emotional well-being.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_EDUTRACK_DATA.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Cpu;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    {feature.badge && (
                      <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-900 transition-colors">
                    {feature.title}
                  </h3>
                  <div className="text-xs font-semibold text-amber-600 mb-3">
                    {feature.subtitle}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link
                    to={feature.linkHref || '/academics'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-indigo-900 transition-colors"
                  >
                    <span>{feature.linkText || 'Explore'}</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyEduTrack;
