import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinalAdmissionCTAProps {
  onStartAdmissionClick?: () => void;
  onTalkToEduAIClick?: () => void;
}

export const FinalAdmissionCTA: React.FC<FinalAdmissionCTAProps> = ({
  onStartAdmissionClick,
  onTalkToEduAIClick,
}) => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-300 border border-amber-400/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Academic Session 2026–27</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
        >
          Ready to begin their journey?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
        >
          Give your child a place to learn, grow, and become their absolute best. Applications for
          the upcoming session are open now.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4"
        >
          {onStartAdmissionClick ? (
            <Button
              size="lg"
              onClick={onStartAdmissionClick}
              className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-sm sm:text-base px-8 shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Start Application
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Link to="/enquiry" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-sm sm:text-base px-8 shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Submit Enquiry
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}

          {onTalkToEduAIClick && (
            <Button
              variant="outline"
              size="lg"
              onClick={onTalkToEduAIClick}
              className="w-full sm:w-auto border-indigo-400/40 bg-indigo-900/40 text-amber-300 hover:bg-indigo-900 hover:text-white font-bold text-sm sm:text-base px-6 cursor-pointer"
            >
              <Bot className="w-5 h-5 mr-2 text-amber-400" />
              Talk to EduAI
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default FinalAdmissionCTA;
