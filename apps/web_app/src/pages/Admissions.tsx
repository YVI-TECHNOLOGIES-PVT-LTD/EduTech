import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Calendar,
  FileText,
  Users,
  DollarSign,
  Clock,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { EXTERNAL_URLS } from "@/lib/public-constants";
import { Card } from '@/components/ui/card';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const admissionHighlights = [
  {
    icon: Calendar,
    title: "Rolling Admissions",
    description: "We accept applications year-round with multiple intake periods.",
  },
  {
    icon: FileText,
    title: "Simple Process",
    description: "Streamlined application with online submission and tracking.",
  },
  {
    icon: Users,
    title: "Personal Interviews",
    description: "One-on-one sessions to understand each student's potential.",
  },
  {
    icon: DollarSign,
    title: "Financial Aid",
    description: "Merit-based scholarships and need-based financial assistance.",
  },
];

const importantDates = [
  { event: "Early Admission Opens", date: "October 1, 2026" },
  { event: "Early Admission Deadline", date: "December 15, 2026" },
  { event: "Regular Admission Opens", date: "January 1,  2026" },
  { event: "Regular Admission Deadline", date: "March 31,  2026" },
  { event: "Financial Aid Applications", date: "April 15,  2026" },
  { event: "New Academic Year Begins", date: "August 15,  2026" },
];

const whyJoin = [
  "World-class faculty and small class sizes",
  "State-of-the-art facilities and technology",
  "Comprehensive extracurricular programs",
  "Diverse and inclusive community",
  "Individual attention and mentorship",
];

export default function Admissions() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="ADMISSIONS 2026-27"
        title="Your Journey Into EduTrack Starts Here"
        accentText="Starts Here"
        description="Join a community of learners where every student is valued, challenged, and supported to achieve their fullest potential."
        backgroundImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[60%_center]"
        metadataItems={["Enquiry", "Application", "Enrollment"]}
        primaryAction={{
          label: "Start Application",
          href: EXTERNAL_URLS.ADMISSION_REGISTRATION,
        }}
      />

      {/* Highlights */}
      <section className="relative -mt-10 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {admissionHighlights.map((item) => (
              <StaggerItem key={item.title}>
                <Card className="p-6 rounded-2xl bg-card border border-border/80 shadow-md text-center h-full flex flex-col items-center">
                  <div className="w-14 h-14 bg-[#063F40] text-[#E7B76A] rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <item.icon className="w-7 h-7 text-[#E7B76A]" />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Important Dates */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <SectionHeader
                subtitle="Important Dates"
                title="Admission Timeline"
                description="Mark your calendar with these key dates for the upcoming academic year."
                align="left"
              />

              <div className="space-y-4 mt-8">
                {importantDates.map((item, index) => (
                  <Card
                    key={item.event}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/80 shadow-xs"
                  >
                    <div className="w-12 h-12 bg-[#063F40] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#E7B76A]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">{item.event}</h4>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <Card className="p-8 rounded-2xl bg-card border border-border/80 shadow-xs space-y-6">
                <div className="text-center">
                  <Award className="w-16 h-16 text-[#063F40] mx-auto mb-4" />
                  <h3 className="font-extrabold text-2xl text-foreground">
                    Merit Scholarships
                  </h3>
                  <p className="text-muted-foreground text-xs mt-2">
                    We offer generous scholarships to recognize academic excellence
                    and special talents.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    "Academic Excellence Award - Up to 100% tuition",
                    "Sports Scholarship - Up to 50% tuition",
                    "Arts & Music Scholarship - Up to 50% tuition",
                    "Need-Based Financial Aid - Varies",
                  ].map((scholarship) => (
                    <div key={scholarship} className="flex items-center gap-2.5 text-xs sm:text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-foreground font-medium">{scholarship}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link to="/admission-process">
                    <Button variant="outline" className="w-full font-bold rounded-xl h-11">
                      Learn About Financial Aid
                    </Button>
                  </Link>
                </div>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#063F40] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center space-y-6">
            <h2 className="font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              Ready to Take the First Step?
            </h2>
            <p className="text-emerald-100/90 max-w-2xl mx-auto leading-relaxed font-normal text-sm sm:text-base">
              Our admissions team is here to guide you through every step of the process.
              Start your application today or schedule a campus visit.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
                <Button size="lg" className="font-bold bg-[#E7B76A] hover:bg-[#d8a658] text-[#063F40] shadow-md flex items-center space-x-2 rounded-xl h-11 px-6">
                  <span>Start Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="font-bold border-white/20 text-white hover:bg-white/10 rounded-xl h-11 px-6">
                  Schedule a Visit
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

