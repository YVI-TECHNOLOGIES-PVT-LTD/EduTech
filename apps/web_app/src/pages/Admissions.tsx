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
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Admissions 2026-27
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Begin Your <span className="text-gold">Journey</span>
              </h1>
              <p className="text-lg text-white/80 mb-8">
                Join a community of learners where every student is valued,
                challenged, and supported to achieve their fullest potential.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
                  <Button variant="hero" size="xl">
                    Apply Now
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/admission-process">
                  <Button variant="heroOutline" size="xl">
                    View Process
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right" className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <h3 className="font-display text-xl font-bold text-white mb-6">
                  Why Join EduTrack?
                </h3>
                <ul className="space-y-4">
                  {whyJoin.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                      <span className="text-white/90">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="relative -mt-10 z-10">
        <div className="container-custom">
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {admissionHighlights.map((item) => (
              <StaggerItem key={item.title}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl p-6 shadow-lg text-center h-full"
                >
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Important Dates */}
      <section className="section-padding bg-background">
        <div className="container-custom">
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
                  <motion.div
                    key={item.event}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md"
                  >
                    <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary">{item.event}</h4>
                      <p className="text-sm text-muted-foreground">{item.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="bg-cream rounded-3xl p-8">
                <div className="text-center mb-6">
                  <Award className="w-16 h-16 text-gold mx-auto mb-4" />
                  <h3 className="font-display text-2xl font-bold text-primary">
                    Merit Scholarships
                  </h3>
                  <p className="text-muted-foreground mt-2">
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
                    <div key={scholarship} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-foreground">{scholarship}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link to="/admission-process">
                    <Button variant="cta">
                      Learn About Financial Aid
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container-custom">
          <AnimatedSection className="text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Take the First Step?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Our admissions team is here to guide you through every step of the process.
              Start your application today or schedule a campus visit.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
                <Button variant="hero" size="lg">
                  Start Application
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="heroOutline" size="lg">
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
