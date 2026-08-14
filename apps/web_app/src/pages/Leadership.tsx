import { motion } from "framer-motion";
import { Quote, Award, BookOpen, Heart } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { Card } from '@/components/ui/card';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const leadershipTeam = [
  {
    name: "Dr. Margaret Thompson",
    role: "Principal",
    bio: "With over 30 years in education, Dr. Thompson has led EduTrack to new heights of academic excellence. Her vision for holistic education has transformed our approach to student development.",
    education: "Ph.D. in Educational Leadership, Harvard University",
    quote: "Every child has unlimited potential. Our job is to help them discover and nurture it.",
  },
  {
    name: "Prof. Robert Williams",
    role: "Vice Principal - Academics",
    bio: "Prof. Williams oversees all academic programs and curriculum development. His innovative approach to STEM education has earned national recognition.",
    education: "M.Ed. from Stanford University",
    quote: "Excellence is not a destination but a continuous journey of learning and improvement.",
  },
  {
    name: "Dr. Sarah Chen",
    role: "Vice Principal - Student Affairs",
    bio: "Dr. Chen champions student welfare and extracurricular development. Her initiatives in mental health support have set new standards for student care.",
    education: "Ed.D. in Counseling Psychology, Columbia University",
    quote: "A supportive environment is the foundation of academic success.",
  },
];

const boardMembers = [
  { name: "James Morrison", role: "Chairman of the Board", expertise: "Corporate Leadership" },
  { name: "Dr. Linda Park", role: "Board Member", expertise: "Higher Education" },
  { name: "Michael Foster", role: "Board Member", expertise: "Finance & Development" },
  { name: "Patricia Greene", role: "Board Member", expertise: "Community Relations" },
  { name: "Dr. Ahmad Hassan", role: "Board Member", expertise: "Educational Technology" },
];

export default function Leadership() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="EDUTRACK LEADERSHIP"
        title="Leadership That Keeps Learning at the Centre"
        accentText="Learning at the Centre"
        description="Meet the dedicated leaders who guide our institution with vision, expertise, and an unwavering commitment to student success."
        backgroundImage="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[50%_35%]"
        metadataItems={["Leadership", "Governance", "Academic Direction"]}
      />

      {/* Principal's Message */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <Card className="rounded-2xl border border-border/80 shadow-sm overflow-hidden bg-card">
                <div className="grid md:grid-cols-5">
                  <div className="md:col-span-2 bg-slate-950 text-white p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-900">
                    <div className="text-center space-y-3">
                      <div className="w-28 h-28 bg-indigo-600/30 text-amber-400 rounded-full mx-auto flex items-center justify-center font-bold text-3xl border border-indigo-500/40 shadow-inner">
                        <span>MT</span>
                      </div>
                      <h3 className="font-extrabold text-xl text-white">
                        Dr. Margaret Thompson
                      </h3>
                      <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Principal</p>
                    </div>
                  </div>
                  <div className="md:col-span-3 p-8 space-y-4">
                    <div className="flex gap-2">
                      <Quote className="w-8 h-8 text-amber-500 shrink-0 opacity-80" />
                    </div>
                    <h2 className="font-extrabold text-2xl text-foreground">
                      Message from the Principal
                    </h2>
                    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        Dear Parents, Students, and Community Members,
                      </p>
                      <p>
                        Welcome to EduTrack, where we believe that every child
                        carries within them the seeds of greatness. Our mission is to
                        provide the nurturing environment, rigorous academics, and
                        supportive community that allows these seeds to flourish.
                      </p>
                      <p>
                        In today's rapidly changing world, we prepare our students not
                        just for examinations, but for life. We focus on developing
                        critical thinking, creativity, collaboration, and character –
                        the skills that will serve them well throughout their lives.
                      </p>
                      <p>
                        I invite you to explore our campus, meet our exceptional faculty,
                        and discover why EduTrack has been a trusted name in
                        education for over seven decades.
                      </p>
                      <p className="font-bold text-foreground pt-2">
                        With warm regards,<br />
                        Dr. Margaret Thompson
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-slate-50/50 dark:bg-card/40 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            subtitle="Leadership Team"
            title="Guiding with Vision & Expertise"
            description="Our leadership team brings decades of experience in education and a shared passion for student success."
          />

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {leadershipTeam.map((leader) => (
              <StaggerItem key={leader.name}>
                <Card className="rounded-2xl bg-card border border-border/80 shadow-sm overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="bg-slate-950 p-6 text-center text-white border-b border-slate-900">
                    <div className="w-16 h-16 bg-indigo-600/30 text-amber-400 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-xl border border-indigo-500/40">
                      <span>
                        {leader.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-white">
                      {leader.name}
                    </h3>
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">{leader.role}</p>
                  </div>
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">{leader.bio}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{leader.education}</span>
                    </div>
                    <div className="mt-auto pt-4 border-t border-border/80">
                      <p className="text-xs italic text-muted-foreground leading-relaxed">
                        "{leader.quote}"
                      </p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Board of Directors */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            subtitle="Governance"
            title="Board of Directors"
            description="Distinguished leaders who provide strategic guidance and oversight."
          />

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {boardMembers.map((member) => (
              <StaggerItem key={member.name}>
                <Card className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm text-center h-full flex flex-col items-center justify-center space-y-1.5">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-sm">
                    <span>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm">{member.name}</h4>
                  <p className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">{member.role}</p>
                  <p className="text-muted-foreground text-xs">{member.expertise}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}

