import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Users, Target, Heart, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { SCHOOL_INFO } from "@/lib/public-constants";
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

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
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="ABOUT EDUTRACK"
        title="Building Better Education Experiences for Every Learner"
        accentText="Every Learner"
        description={`Since ${SCHOOL_INFO.established}, ${SCHOOL_INFO.name} has been dedicated to nurturing young minds and shaping future leaders through holistic development and academic excellence.`}
        backgroundImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[65%_center]"
        metadataItems={["Academic Excellence", "Parent Engagement", "Digital Operations"]}
      />

      {/* Story Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection direction="left">
              <span className="text-[#063F40] font-black tracking-widest uppercase text-xs">Our Story</span>
              <h2 className="font-extrabold text-3xl md:text-4xl text-foreground mt-3 mb-6 tracking-tight">
                Over {new Date().getFullYear() - SCHOOL_INFO.established} Years of Educational Excellence
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
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
                  <Button className="bg-[#063F40] text-[#E7B76A] hover:bg-[#082F35] font-bold rounded-xl h-11 px-6">
                    Our Vision
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/leadership">
                  <Button variant="outline" className="font-bold border-border/80 rounded-xl h-11 px-6">
                    Meet Our Leaders
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="relative">
                <div className="relative bg-card border border-border/80 rounded-3xl p-8 shadow-lg">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-editorial-cream rounded-2xl">
                      <BookOpen className="w-10 h-10 text-[#063F40] mx-auto mb-3" />
                      <p className="text-3xl font-extrabold text-foreground">50+</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Programs</p>
                    </div>
                    <div className="text-center p-6 bg-editorial-cream rounded-2xl">
                      <Users className="w-10 h-10 text-[#063F40] mx-auto mb-3" />
                      <p className="text-3xl font-extrabold text-foreground">5000+</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Students</p>
                    </div>
                    <div className="text-center p-6 bg-editorial-cream rounded-2xl">
                      <Trophy className="w-10 h-10 text-[#063F40] mx-auto mb-3" />
                      <p className="text-3xl font-extrabold text-foreground">150+</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Awards</p>
                    </div>
                    <div className="text-center p-6 bg-editorial-cream rounded-2xl">
                      <Award className="w-10 h-10 text-[#063F40] mx-auto mb-3" />
                      <p className="text-3xl font-extrabold text-foreground">95%</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Success Rate</p>
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
