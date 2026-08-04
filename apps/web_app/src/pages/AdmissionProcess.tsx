import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, FileText, Users, ClipboardCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { EXTERNAL_URLS } from "@/lib/public-constants";

const steps = [
  { icon: FileText, title: "Submit Application", description: "Complete the online application form with required documents." },
  { icon: ClipboardCheck, title: "Entrance Assessment", description: "Take our aptitude test to assess academic readiness." },
  { icon: Users, title: "Interview", description: "Meet with our admissions team for a personal interview." },
  { icon: CreditCard, title: "Enrollment", description: "Complete enrollment and fee payment to secure your seat." },
];

export default function AdmissionProcess() {
  return (
    <div className="overflow-hidden">
      <section className="relative pt-32 pb-20 bg-hero-gradient">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">Admissions</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Admission <span className="text-gold">Process</span></h1>
            <p className="text-lg text-white/80">A simple, transparent process to join our academic community.</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <AnimatedSection key={step.title} delay={index * 0.1} className="flex gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-gold font-bold">{index + 1}</div>
                  {index < steps.length - 1 && <div className="w-0.5 h-full bg-gold/30 mt-2" />}
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md flex-1">
                  <h3 className="font-display text-xl font-bold text-primary mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection className="text-center mt-12">
            <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
              <Button variant="cta" size="xl">Start Your Application <ArrowRight className="w-5 h-5" /></Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
