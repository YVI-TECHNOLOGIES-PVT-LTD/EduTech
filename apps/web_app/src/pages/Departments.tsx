import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Beaker, Calculator, Globe, Palette, Music, Monitor, Activity, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";

const departments = [
  {
    icon: Calculator,
    name: "Mathematics",
    head: "Dr. James Peterson",
    description: "From foundational arithmetic to advanced calculus, our mathematics department develops problem-solving skills and logical thinking.",
    courses: ["Algebra", "Geometry", "Calculus", "Statistics"],
    achievements: "National Math Olympiad winners 5 years running",
  },
  {
    icon: Beaker,
    name: "Sciences",
    head: "Dr. Maria Santos",
    description: "State-of-the-art laboratories and hands-on experiments bring science to life for students at all levels.",
    courses: ["Physics", "Chemistry", "Biology", "Environmental Science"],
    achievements: "Regional Science Fair champions",
  },
  {
    icon: BookOpen,
    name: "English & Literature",
    head: "Prof. Elizabeth Moore",
    description: "Developing strong communication skills through literature, creative writing, and critical analysis.",
    courses: ["Literature", "Creative Writing", "Journalism", "Public Speaking"],
    achievements: "Published student anthology",
  },
  {
    icon: Globe,
    name: "Social Studies",
    head: "Prof. David Wilson",
    description: "Understanding our world through history, geography, economics, and civics education.",
    courses: ["World History", "Geography", "Economics", "Political Science"],
    achievements: "Model UN Award winners",
  },
  {
    icon: Monitor,
    name: "Computer Science",
    head: "Dr. Kevin Zhang",
    description: "Preparing students for the digital age with coding, robotics, and computational thinking.",
    courses: ["Programming", "Web Development", "Robotics", "AI Basics"],
    achievements: "National Coding Competition finalists",
  },
  {
    icon: Palette,
    name: "Visual Arts",
    head: "Ms. Sarah Mitchell",
    description: "Nurturing creativity through painting, sculpture, digital art, and art history.",
    courses: ["Drawing", "Painting", "Digital Art", "Art History"],
    achievements: "Student works exhibited at City Gallery",
  },
  {
    icon: Music,
    name: "Performing Arts",
    head: "Mr. Anthony Rivera",
    description: "Developing artistic expression through music, drama, and dance programs.",
    courses: ["Orchestra", "Choir", "Drama", "Dance"],
    achievements: "Annual Broadway-style production",
  },
  {
    icon: Activity,
    name: "Physical Education",
    head: "Coach Michael Brown",
    description: "Promoting physical fitness, teamwork, and sportsmanship through athletics.",
    courses: ["Team Sports", "Individual Athletics", "Fitness Training", "Health Education"],
    achievements: "State champions in multiple sports",
  },
  {
    icon: Languages,
    name: "World Languages",
    head: "Prof. Claire Dubois",
    description: "Building global citizens through language learning and cultural exchange.",
    courses: ["Spanish", "French", "Mandarin", "German"],
    achievements: "Student exchange with 10 countries",
  },
];

export default function Departments() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Departments
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Academic <span className="text-gold">Departments</span>
            </h1>
            <p className="text-lg text-white/80">
              Our diverse academic departments are led by experienced educators 
              dedicated to excellence in their respective fields.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments.map((dept) => (
              <StaggerItem key={dept.name}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md h-full flex flex-col"
                >
                  <div className="bg-primary p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gold/20 rounded-xl flex items-center justify-center">
                        <dept.icon className="w-7 h-7 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-white">
                          {dept.name}
                        </h3>
                        <p className="text-gold-light text-sm">{dept.head}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-muted-foreground mb-4">{dept.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-primary mb-2">Key Courses</h4>
                      <div className="flex flex-wrap gap-2">
                        {dept.courses.map((course) => (
                          <span
                            key={course}
                            className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground"
                          >
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-muted">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gold">★</span>
                        <span className="text-muted-foreground">{dept.achievements}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-cream">
        <div className="container-custom">
          <AnimatedSection className="text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-4">
              Interested in Learning More?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Meet our faculty and discover how each department contributes to 
              our students' academic success.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/faculty">
                <Button variant="cta" size="lg">
                  Meet Our Faculty
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/academics">
                <Button variant="outline" size="lg">
                  View Curriculum
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
