import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, HelpCircle, Calendar, FileText, CheckCircle, Award, UserCheck } from 'lucide-react';
import { ADMISSION_JOURNEY_STEPS } from '../data/landing-content';

interface AdmissionJourneyProps {
  onEnquireClick?: () => void;
}

export const AdmissionJourney: React.FC<AdmissionJourneyProps> = ({ onEnquireClick }) => {
  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
            Admission Journey
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Your journey starts here. <br />
            <span className="text-indigo-900">7 transparent steps to join EduTrack.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Our admissions process is designed to be welcoming, transparent, and supportive for parents and prospective students alike.
          </p>
        </div>

        {/* 7-Step Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4">
          {ADMISSION_JOURNEY_STEPS.map((step, index) => {
            return (
              <motion.div
                key={step.stepNumber}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative"
              >
                {/* Step Badge */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80">
                      {step.stepNumber}
                    </span>
                    {index < ADMISSION_JOURNEY_STEPS.length - 1 && (
                      <span className="hidden xl:block text-slate-300 group-hover:text-indigo-500 font-bold">
                        →
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-900 transition-colors">
                    {step.title}
                  </h3>
                  <div className="text-[11px] font-bold text-indigo-900 mb-2">
                    {step.subtitle}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Optional Step Action */}
                <div className="pt-4 mt-3 border-t border-slate-100">
                  {step.title === 'Enquire' && onEnquireClick ? (
                    <button
                      onClick={onEnquireClick}
                      className="text-xs font-bold text-indigo-900 hover:text-indigo-900 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Quick Enquiry</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : step.ctaHref ? (
                    <Link
                      to={step.ctaHref}
                      className="text-xs font-bold text-indigo-900 hover:text-indigo-900 flex items-center gap-1 transition-colors"
                    >
                      <span>{step.ctaText || 'Learn More'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Stage {step.stepNumber}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Global CTA Box Below Steps */}
        <div className="mt-10 sm:mt-12 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto text-center sm:text-left">
          <div>
            <div className="text-sm font-bold text-slate-900">
              Ready to submit your child's application?
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Session 2026–27 applications are currently being evaluated on a rolling basis.
            </div>
          </div>
          <Link to="/admissions/apply" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all hover:scale-[1.02] cursor-pointer">
              Apply Online Now →
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AdmissionJourney;
