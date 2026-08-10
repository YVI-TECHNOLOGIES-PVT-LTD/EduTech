import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, GraduationCap, Award, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onStartAdmissionClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartAdmissionClick }) => {
  return (
    <section className="relative bg-transparent text-white overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background Decorative Pattern & Gradient Glows */}
      <div className="absolute inset-0 bg-hero-pattern opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/30 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Admissions Open · 2026–27</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
            >
              Where curious minds become{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                confident futures.
              </span>
            </motion.h1>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              A modern learning environment built around academic excellence, character development, creativity, and future-ready thinking.
            </motion.p>

            {/* Action CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2"
            >
              {onStartAdmissionClick ? (
                <Button
                  size="lg"
                  onClick={onStartAdmissionClick}
                  className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-sm sm:text-base px-7 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Start Admission
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Link to="/admissions/apply" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-sm sm:text-base px-7 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    Start Admission
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}

              <Link to="/academics" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white font-semibold text-sm sm:text-base px-6"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Explore Academics
                </Button>
              </Link>
            </motion.div>

            {/* Key Trust Signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm font-semibold text-slate-300"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />
                <span>CBSE Affiliated</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-amber-400" />
                <span>25+ Years Excellence</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-amber-400" />
                <span>5,200+ Students</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Visual Centerpiece */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto max-w-md lg:max-w-none"
            >
              {/* Outer Glow Card Container */}
              <div className="relative rounded-3xl p-1 bg-gradient-to-br from-indigo-500/30 via-amber-500/20 to-slate-800 shadow-2xl">
                <div className="bg-slate-900 rounded-[22px] overflow-hidden relative">
                  {/* Hero Campus Image */}
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                    alt="EduTrack Campus Environment"
                    className="w-full h-[380px] sm:h-[440px] object-cover object-center transform hover:scale-105 transition-transform duration-700 bg-slate-800"
                  />

                  {/* Gradient Overlay on Image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top Rated Campus Badge */}
                  <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700/80 hidden sm:flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">Top Rated Campus</div>
                      <div className="text-[11px] font-medium text-slate-300">Parent Satisfaction 98%</div>
                    </div>
                  </div>

                  {/* Image Badge / Caption Overlay */}
                  <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shrink-0 shadow">
                        25+
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">
                          25 Years of Educational Leadership
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">
                          Inspiring curious learners & future leaders
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
