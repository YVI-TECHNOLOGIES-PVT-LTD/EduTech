import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Baby, BookOpen, Compass, GraduationCap } from 'lucide-react';
import { ACADEMIC_STAGES_DATA } from '../data/landing-content';

const iconMap: Record<string, React.ElementType> = {
  Baby,
  BookOpen,
  Compass,
  GraduationCap,
};

export const AcademicExperience: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState(ACADEMIC_STAGES_DATA[0].id);

  const activeStage = ACADEMIC_STAGES_DATA.find((s) => s.id === activeTabId) || ACADEMIC_STAGES_DATA[0];

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Academic Experience
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Learning at EduTrack. <br />
            <span className="text-indigo-900">A pathway designed for every stage.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            From early exploratory play to university guidance, our academic framework nurtures intellect, curiosity, and individual potential.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {ACADEMIC_STAGES_DATA.map((stage) => {
            const isActive = stage.id === activeTabId;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveTabId(stage.id)}
                className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {stage.title}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10"
            >
              {/* Left Column: Stage Overview */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full">
                    {activeStage.grades}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {activeStage.ageRange}
                  </span>
                </div>

                <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                  {activeStage.title}
                </h3>

                <div className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                  {activeStage.tagline}
                </div>

                <p className="text-base text-slate-300 leading-relaxed">
                  {activeStage.description}
                </p>

                {/* Highlights List */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  {activeStage.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    to="/academics"
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md hover:scale-[1.02]"
                  >
                    <span>Explore Stage Curriculum</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Stage Graphic */}
              <div className="lg:col-span-5">
                <div className="bg-slate-800/80 rounded-2xl p-8 border border-slate-700/80 text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-lg">
                    {React.createElement(iconMap[activeStage.icon] || BookOpen, {
                      className: 'w-10 h-10 text-amber-300',
                    })}
                  </div>
                  <div className="text-xl font-bold text-white font-display">
                    {activeStage.title}
                  </div>
                  <p className="text-xs text-slate-400">
                    Comprehensive academic foundation customized for {activeStage.ageRange}.
                  </p>
                  <div className="pt-2 text-xs font-semibold text-amber-400">
                    {activeStage.grades}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default AcademicExperience;
