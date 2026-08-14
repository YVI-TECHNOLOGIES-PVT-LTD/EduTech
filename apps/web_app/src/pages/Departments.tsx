import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Beaker, Calculator, Globe, Palette, Music, Monitor, Activity, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { Card } from '@/components/ui/card';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

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
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="ACADEMIC DEPARTMENTS"
        title="Specialized Learning Across Every Discipline"
        accentText="Every Discipline"
        description="Our diverse academic departments are led by experienced educators dedicated to excellence in their respective fields."
        backgroundImage="https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[55%_center]"
        metadataItems={["Departments", "Subjects", "Learning Spaces"]}
      />

      {/* Departments Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments.map((dept) => (
              <StaggerItem key={dept.name}>
                <Card className="rounded-2xl bg-card border border-border/80 shadow-sm overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="bg-slate-950 p-6 text-white border-b border-slate-900">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600/30 text-amber-400 rounded-xl flex items-center justify-center border border-indigo-500/40 shrink-0">
                        <dept.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">
                          {dept.name}
                        </h3>
                        <p className="text-amber-400 text-xs font-bold">{dept.head}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">{dept.description}</p>
                    
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Key Courses</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {dept.courses.map((course) => (
                          <span
                            key={course}
                            className="bg-muted px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground"
                          >
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-border/80">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <span>★</span>
                        <span className="text-muted-foreground font-normal">{dept.achievements}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-950 text-white border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center space-y-6">
            <h2 className="font-extrabold text-2xl md:text-3xl text-white tracking-tight">
              Interested in Learning More?
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Meet our faculty and discover how each department contributes to 
              our students' academic success.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/faculty">
                <Button size="lg" className="font-bold shadow-lg flex items-center space-x-2">
                  <span>Meet Our Faculty</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/academics">
                <Button variant="outline" size="lg" className="font-bold border-slate-800 text-slate-200 hover:bg-slate-900">
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

