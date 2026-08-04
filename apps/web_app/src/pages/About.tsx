import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Users, Target, Heart, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { SCHOOL_INFO } from "@/lib/public-constants";

const milestones = [
  { year: "1952", event: "Foundation of EduTrack" },
  { year: "1975", event: "Expansion to include High School programs" },
  { year: "1990", event: "Introduction of Advanced Placement courses" },
  { year: "2005", event: "State-of-the-art science complex opened" },
  { year: "2015", event: "Launch of STEM Innovation Center" },
  { year: "2023", event: "Recognition as a Center of Excellence" },
];

const values = [
  {
    icon: Award,
    title: "Excellence",
    description: "Striving for the highest standards in everything we do.",
  },
  {
    icon: Heart,
    title: "Integrity",
    description: "Upholding honesty and strong moral principles.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Fostering a supportive and inclusive environment.",
  },
  {
    icon: Target,
    title: "Innovation",
    description: "Embracing creative solutions and forward thinking.",
  },
];

export default function About() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">
              About Us
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              A Legacy of <span className="text-gold">Excellence</span>
            </h1>
            <p className="text-lg text-white/80">
              Since {SCHOOL_INFO.established}, {SCHOOL_INFO.name} has been dedicated to
              nurturing young minds and shaping future leaders. Our commitment to academic
              excellence and holistic development has made us a beacon of educational excellence.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection direction="left">
              <span className="text-gold font-semibold tracking-wider uppercase text-sm">Our Story</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mt-3 mb-6">
                Over {new Date().getFullYear() - SCHOOL_INFO.established} Years of
                Educational Excellence
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded in {SCHOOL_INFO.established}, {SCHOOL_INFO.name} began as a small
                  institution with a big vision: to provide world-class education that
                  nurtures not just academic excellence, but also character and creativity.
                </p>
                <p>
                  Over the decades, we have grown into one of the region's most respected
                  educational institutions, producing graduates who have gone on to become
                  leaders in their respective fields.
                </p>
                <p>
                  Our approach combines traditional academic rigor with innovative teaching
                  methodologies, creating an environment where every student can discover
                  and develop their unique potential.
                </p>
              </div>
              <div className="mt-8 flex gap-4">
                <Link to="/vision-mission">
                  <Button variant="cta">
                    Our Vision
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/leadership">
                  <Button variant="outline">
                    Meet Our Leaders
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-48 h-48 bg-gold/10 rounded-3xl" />
                <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-primary/10 rounded-3xl" />
                <div className="relative bg-white rounded-3xl p-8 shadow-lg">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-cream rounded-2xl">
                      <BookOpen className="w-10 h-10 text-gold mx-auto mb-3" />
                      <p className="font-display text-3xl font-bold text-primary">50+</p>
                      <p className="text-sm text-muted-foreground">Programs</p>
                    </div>
                    <div className="text-center p-6 bg-cream rounded-2xl">
                      <Users className="w-10 h-10 text-gold mx-auto mb-3" />
                      <p className="font-display text-3xl font-bold text-primary">5000+</p>
                      <p className="text-sm text-muted-foreground">Students</p>
                    </div>
                    <div className="text-center p-6 bg-cream rounded-2xl">
                      <Trophy className="w-10 h-10 text-gold mx-auto mb-3" />
                      <p className="font-display text-3xl font-bold text-primary">150+</p>
                      <p className="text-sm text-muted-foreground">Awards</p>
                    </div>
                    <div className="text-center p-6 bg-cream rounded-2xl">
                      <Award className="w-10 h-10 text-gold mx-auto mb-3" />
                      <p className="font-display text-3xl font-bold text-primary">95%</p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <SectionHeader
            subtitle="Our Values"
            title="The Principles We Stand By"
            description="These core values guide everything we do at EduTrack."
          />

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl p-6 shadow-md h-full text-center card-hover"
                >
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <value.icon className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader
            subtitle="Our Journey"
            title="Milestones Through the Years"
            description="Key moments that have shaped our institution's history."
          />

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gold/30" />

              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <AnimatedSection
                    key={milestone.year}
                    delay={index * 0.1}
                    className="relative pl-20"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-6 top-2 w-5 h-5 bg-gold rounded-full border-4 border-white shadow" />

                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <span className="text-gold font-display text-xl font-bold">
                        {milestone.year}
                      </span>
                      <p className="text-foreground mt-1">{milestone.event}</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
