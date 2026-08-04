import { motion } from "framer-motion";
import { Award, BookOpen, Mail } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";

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

import { useState } from 'react';
import { ImportWizard } from "@/components/import/ImportWizard";
import { useAuth } from "@/context/AuthContext";

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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10 flex justify-between items-end">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Our Team
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Meet Our <span className="text-gold">Faculty</span>
            </h1>
            <p className="text-lg text-white/80">
              Our distinguished faculty brings together experienced educators,
              researchers, and industry professionals dedicated to student success.
            </p>
          </AnimatedSection>

          {canImport && (
            <button
              onClick={() => setImportOpen(true)}
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20 font-bold transition-all mb-8"
            >
              <BookOpen className="w-5 h-5" />
              Import Faculty CSV
            </button>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-10 z-10">
        <div className="container-custom">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                  <p className="font-display text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Faculty Grid */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader
            subtitle="Faculty Directory"
            title="Dedicated Educators"
            description="Learn about the accomplished professionals who shape our students' academic journey."
          />

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {facultyMembers.map((member) => (
              <StaggerItem key={member.name}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md h-full"
                >
                  <div className="bg-primary p-4 text-center">
                    <div className="w-16 h-16 bg-gold/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="font-display text-xl font-bold text-gold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm">{member.name}</h3>
                    <p className="text-gold text-xs">{member.role}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-muted-foreground">{member.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-muted-foreground text-xs">{member.education}</span>
                    </div>
                    <div className="pt-2 border-t border-muted">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Specialization:</span> {member.specialization}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Experience:</span> {member.experience}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Join Our Team */}
      <section className="py-16 bg-cream">
        <div className="container-custom">
          <AnimatedSection className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-4">
              Join Our Faculty
            </h2>
            <p className="text-muted-foreground mb-6">
              We're always looking for passionate educators to join our team.
              If you're interested in making a difference in students' lives,
              we'd love to hear from you.
            </p>
            <a href="mailto:careers@apexinternationalschool.edu">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold"
              >
                <Mail className="w-4 h-4" />
                Contact HR Department
              </motion.button>
            </a>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
