import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, Beaker, Calculator, Globe, Music, Palette, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { EXTERNAL_URLS } from "@/lib/public-constants";
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const programs = [
  {
    level: "Elementary School",
    grades: "Grades 1-5",
    description: "Building strong foundations through play-based and experiential learning. Focus on literacy, numeracy, and social skills.",
    highlights: ["Phonics-based Reading", "Mental Math", "Science Exploration", "Art & Music"],
    color: "from-blue-500 to-blue-600",
  },
  {
    level: "Middle School",
    grades: "Grades 6-8",
    description: "Transitional years focusing on critical thinking, research skills, and personal development.",
    highlights: ["STEM Integration", "Language Arts", "Social Studies", "Physical Education"],
    color: "from-green-500 to-green-600",
  },
  {
    level: "High School",
    grades: "Grades 9-12",
    description: "College preparatory curriculum with advanced courses and career exploration opportunities.",
    highlights: ["AP Courses", "SAT/ACT Prep", "Career Counseling", "College Guidance"],
    color: "from-purple-500 to-purple-600",
  },
];

const subjects = [
  { icon: Calculator, name: "Mathematics", description: "From basic arithmetic to advanced calculus" },
  { icon: Beaker, name: "Sciences", description: "Physics, Chemistry, Biology with hands-on labs" },
  { icon: BookOpen, name: "Language Arts", description: "Literature, writing, and communication skills" },
  { icon: Globe, name: "Social Studies", description: "History, geography, and civics education" },
  { icon: Monitor, name: "Computer Science", description: "Coding, robotics, and digital literacy" },
  { icon: Palette, name: "Fine Arts", description: "Visual arts, music, drama, and dance" },
];

const specialPrograms = [
  {
    title: "Advanced Placement (AP)",
    description: "College-level courses in 15+ subjects for motivated students.",
    badge: "College Credit",
  },
  {
    title: "Honors Program",
    description: "Accelerated curriculum for high-achieving students.",
    badge: "Advanced",
  },
  {
    title: "STEM Excellence",
    description: "Specialized track in science, technology, engineering, and mathematics.",
    badge: "Innovation",
  },
  {
    title: "Arts Conservatory",
    description: "Intensive training in music, visual arts, or performing arts.",
    badge: "Creative",
  },
];

export default function Academics() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="ACADEMIC EXPERIENCE"
        title="Learning Pathways Designed Around Every Student"
        accentText="Every Student"
        description="Our comprehensive academic programs are designed to challenge students, foster intellectual curiosity, and prepare them for success in higher education and beyond."
        backgroundImage="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[55%_center]"
        metadataItems={["Curriculum", "Learning", "Progress"]}
      />

      {/* Academic Levels */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            subtitle="Academic Levels"
            title="Education for Every Stage"
            description="Tailored programs that meet students where they are and take them where they need to go."
          />

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {programs.map((program) => (
              <StaggerItem key={program.level}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 h-full flex flex-col"
                >
                  <div className="bg-[#063F40] text-white p-6 border-b border-white/10">
                    <span className="inline-block bg-[#E7B76A] text-[#063F40] px-3 py-1 rounded-full text-xs font-bold mb-2">
                      {program.grades}
                    </span>
                    <h3 className="font-extrabold text-2xl text-white tracking-tight">
                      {program.level}
                    </h3>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">{program.description}</p>
                    <div className="mt-auto">
                      <h4 className="font-bold text-foreground mb-3 text-xs uppercase tracking-wider">Key Highlights</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {program.highlights.map((highlight) => (
                          <li key={highlight} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-[#E7B76A] rounded-full" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-24 bg-editorial-cream border-t border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            subtitle="Core Subjects"
            title="Comprehensive Curriculum"
            description="A well-rounded education covering all essential disciplines."
          />

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <StaggerItem key={subject.name}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-[#063F40] rounded-xl flex items-center justify-center flex-shrink-0">
                    <subject.icon className="w-6 h-6 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-base">{subject.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{subject.description}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Special Programs */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader
            subtitle="Special Programs"
            title="Pathways to Excellence"
            description="Specialized tracks for students with specific interests and aspirations."
          />

          <StaggerContainer className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {specialPrograms.map((program) => (
              <StaggerItem key={program.title}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-gold"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-display text-xl font-bold text-primary">
                      {program.title}
                    </h3>
                    <span className="bg-gold/10 text-gold px-3 py-1 rounded-full text-xs font-semibold">
                      {program.badge}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{program.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimatedSection className="text-center mt-12">
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/departments">
                <Button variant="outline" size="lg">
                  Explore Departments
                </Button>
              </Link>
              <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
                <Button variant="cta" size="lg">
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Academic Support */}
      <section className="py-16 bg-primary">
        <div className="container-custom">
          <AnimatedSection className="text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
              Academic Support Services
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              We provide comprehensive support to ensure every student succeeds,
              including tutoring, counseling, and enrichment programs.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {["Tutoring Center", "Learning Support", "College Counseling", "Career Guidance"].map((service) => (
                <div key={service} className="flex items-center gap-2 text-white">
                  <GraduationCap className="w-5 h-5 text-gold" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
