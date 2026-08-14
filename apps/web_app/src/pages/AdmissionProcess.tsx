import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, FileText, Users, ClipboardCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { EXTERNAL_URLS } from "@/lib/public-constants";
import { Card } from '@/components/ui/card';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const steps = [
  { icon: FileText, title: "Submit Application", description: "Complete the online application form with required documents." },
  { icon: ClipboardCheck, title: "Entrance Assessment", description: "Take our aptitude test to assess academic readiness." },
  { icon: Users, title: "Interview", description: "Meet with our admissions team for a personal interview." },
  { icon: CreditCard, title: "Enrollment", description: "Complete enrollment and fee payment to secure your seat." },
];

export default function AdmissionProcess() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="ADMISSION JOURNEY"
        title="A Clearer, Simpler Path to Enrollment"
        accentText="Path to Enrollment"
        description="A simple, transparent process to join our academic community."
        backgroundImage="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[55%_center]"
        metadataItems={["Enquiry", "Application", "Verification", "Enrollment"]}
        primaryAction={{
          label: "Start Application",
          href: EXTERNAL_URLS.ADMISSION_REGISTRATION,
        }}
      />

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <AnimatedSection key={step.title} delay={index * 0.1} className="flex gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-900/40 shrink-0">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
                </div>
                <Card className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex-1 space-y-1.5">
                  <h3 className="font-bold text-xl text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection className="text-center mt-12">
            <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
              <Button size="xl" className="font-bold shadow-lg inline-flex items-center space-x-2">
                <span>Start Your Application</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

