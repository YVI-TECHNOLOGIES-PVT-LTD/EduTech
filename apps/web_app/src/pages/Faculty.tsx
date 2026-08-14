import { useState } from 'react';
import { motion } from "framer-motion";
import { Award, BookOpen, Mail } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { ImportWizard } from "@/components/import/ImportWizard";
import { useAuth } from "@/context/AuthContext";
import { Card } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const facultyMembers = [
  {
    name: "Dr. James Peterson",
    department: "Mathematics",
    role: "Department Head",
    education: "Ph.D. Mathematics, MIT",
    experience: "25 years",
    specialization: "Calculus & Applied Mathematics",
  },
  {
    name: "Dr. Maria Santos",
    department: "Sciences",
    role: "Department Head",
    education: "Ph.D. Biochemistry, Stanford",
    experience: "20 years",
    specialization: "Molecular Biology",
  },
  {
    name: "Prof. Elizabeth Moore",
    department: "English",
    role: "Department Head",
    education: "M.A. English Literature, Yale",
    experience: "18 years",
    specialization: "Victorian Literature",
  },
  {
    name: "Dr. Kevin Zhang",
    department: "Computer Science",
    role: "Department Head",
    education: "Ph.D. Computer Science, CMU",
    experience: "15 years",
    specialization: "AI & Machine Learning",
  },
  {
    name: "Prof. David Wilson",
    department: "Social Studies",
    role: "Department Head",
    education: "M.A. History, Columbia",
    experience: "22 years",
    specialization: "World History",
  },
  {
    name: "Ms. Sarah Mitchell",
    department: "Visual Arts",
    role: "Department Head",
    education: "MFA, Rhode Island School of Design",
    experience: "16 years",
    specialization: "Contemporary Art",
  },
  {
    name: "Dr. Amanda Foster",
    department: "Mathematics",
    role: "Senior Teacher",
    education: "Ph.D. Statistics, UC Berkeley",
    experience: "12 years",
    specialization: "Statistics & Probability",
  },
  {
    name: "Mr. Robert Chen",
    department: "Sciences",
    role: "Senior Teacher",
    education: "M.S. Physics, Caltech",
    experience: "14 years",
    specialization: "Quantum Mechanics",
  },
  {
    name: "Ms. Jennifer Adams",
    department: "English",
    role: "Senior Teacher",
    education: "M.A. Creative Writing, Iowa",
    experience: "10 years",
    specialization: "Creative Writing",
  },
  {
    name: "Mr. Anthony Rivera",
    department: "Performing Arts",
    role: "Department Head",
    education: "BFA, Juilliard",
    experience: "20 years",
    specialization: "Musical Theater",
  },
  {
    name: "Coach Michael Brown",
    department: "Physical Education",
    role: "Athletic Director",
    education: "M.S. Sports Science",
    experience: "18 years",
    specialization: "Athletics & Coaching",
  },
  {
    name: "Prof. Claire Dubois",
    department: "World Languages",
    role: "Department Head",
    education: "Ph.D. Linguistics, Sorbonne",
    experience: "17 years",
    specialization: "French & Spanish",
  },
];

const stats = [
  { value: "200+", label: "Faculty Members" },
  { value: "85%", label: "Advanced Degrees" },
  { value: "15:1", label: "Student-Teacher Ratio" },
  { value: "18+", label: "Avg. Years Experience" },
];

export default function Faculty() {
  const { user, hasPermission } = useAuth();
  const [importOpen, setImportOpen] = useState(false);
  const canImport = hasPermission('FACULTY_PROFILE_MANAGE');

  return (
    <div className="overflow-hidden">
      <ImportWizard
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        entityType="FACULTY"
        title="Faculty"
      />

      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="OUR FACULTY"
        title="Experienced Educators. Meaningful Learning."
        accentText="Meaningful Learning"
        description="Our distinguished faculty brings together experienced educators, researchers, and industry professionals dedicated to student success."
        backgroundImage="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[50%_35%]"
        metadataItems={["Qualified Teachers", "Mentorship", "Student Support"]}
        primaryAction={
          canImport
            ? {
                label: "Import Faculty CSV",
                onClick: () => setImportOpen(true),
              }
            : undefined
        }
      />

      {/* Stats */}
      <section className="relative -mt-10 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <Card className="p-6 rounded-2xl bg-card border border-border/80 shadow-md text-center">
                  <p className="font-extrabold text-3xl text-indigo-600 dark:text-indigo-400 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Faculty Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            subtitle="Faculty Directory"
            title="Dedicated Educators"
            description="Learn about the accomplished professionals who shape our students' academic journey."
          />

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {facultyMembers.map((member) => (
              <StaggerItem key={member.name}>
                <Card className="rounded-2xl bg-card border border-border/80 shadow-sm overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="bg-slate-950 p-4 text-center text-white border-b border-slate-900">
                    <div className="w-14 h-14 bg-indigo-600/30 text-amber-400 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg border border-indigo-500/40">
                      <span>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm">{member.name}</h3>
                    <p className="text-amber-400 text-xs font-bold">{member.role}</p>
                  </div>
                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{member.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{member.education}</span>
                    </div>
                    <div className="pt-2 border-t border-border/80 mt-auto space-y-1">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">Specialization:</span> {member.specialization}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">Experience:</span> {member.experience}
                      </p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Join Our Team */}
      <section className="py-20 bg-slate-950 text-white border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="font-extrabold text-2xl md:text-3xl text-white tracking-tight">
              Join Our Faculty
            </h2>
            <p className="text-slate-300 leading-relaxed font-normal">
              We're always looking for passionate educators to join our team.
              If you're interested in making a difference in students' lives,
              we'd love to hear from you.
            </p>
            <a href="mailto:careers@apexinternationalschool.edu" className="inline-block pt-2">
              <Button size="lg" className="font-bold shadow-lg flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Contact HR Department</span>
              </Button>
            </a>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

