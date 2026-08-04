import { motion } from "framer-motion";
import { Quote, Award, BookOpen, Heart } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";

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
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Our Leaders
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Leadership & <span className="text-gold">Principal's Message</span>
            </h1>
            <p className="text-lg text-white/80">
              Meet the dedicated leaders who guide our institution with vision,
              expertise, and an unwavering commitment to student success.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                <div className="grid md:grid-cols-5">
                  <div className="md:col-span-2 bg-primary p-8 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gold/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="font-display text-4xl font-bold text-gold">MT</span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white">
                        Dr. Margaret Thompson
                      </h3>
                      <p className="text-gold">Principal</p>
                    </div>
                  </div>
                  <div className="md:col-span-3 p-8">
                    <div className="flex gap-2 mb-4">
                      <Quote className="w-8 h-8 text-gold flex-shrink-0" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-primary mb-4">
                      Message from the Principal
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
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
                      <p className="font-semibold text-primary">
                        With warm regards,<br />
                        Dr. Margaret Thompson
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <SectionHeader
            subtitle="Leadership Team"
            title="Guiding with Vision & Expertise"
            description="Our leadership team brings decades of experience in education and a shared passion for student success."
          />

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {leadershipTeam.map((leader) => (
              <StaggerItem key={leader.name}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md h-full flex flex-col"
                >
                  <div className="bg-primary p-6 text-center">
                    <div className="w-20 h-20 bg-gold/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="font-display text-2xl font-bold text-gold">
                        {leader.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">
                      {leader.name}
                    </h3>
                    <p className="text-gold text-sm">{leader.role}</p>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-muted-foreground text-sm mb-4">{leader.bio}</p>
                    <div className="flex items-center gap-2 text-sm text-primary mb-4">
                      <Award className="w-4 h-4 text-gold" />
                      <span>{leader.education}</span>
                    </div>
                    <div className="mt-auto pt-4 border-t border-muted">
                      <p className="text-sm italic text-muted-foreground">
                        "{leader.quote}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Board of Directors */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader
            subtitle="Governance"
            title="Board of Directors"
            description="Distinguished leaders who provide strategic guidance and oversight."
          />

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {boardMembers.map((member) => (
              <StaggerItem key={member.name}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl p-5 shadow-md text-center h-full"
                >
                  <div className="w-14 h-14 bg-primary rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="font-display text-lg font-bold text-gold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-primary text-sm mb-1">{member.name}</h4>
                  <p className="text-gold text-xs mb-2">{member.role}</p>
                  <p className="text-muted-foreground text-xs">{member.expertise}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Values Banner */}
      <section className="py-16 bg-gold">
        <div className="container-custom">
          <AnimatedSection className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: BookOpen, label: "Academic Leadership" },
              { icon: Heart, label: "Student Welfare" },
              { icon: Award, label: "Excellence in Education" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon className="w-8 h-8 text-navy" />
                <span className="font-display text-lg font-bold text-navy">
                  {item.label}
                </span>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
