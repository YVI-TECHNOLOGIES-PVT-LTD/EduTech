import { motion } from "framer-motion";
import { Users, Music, Trophy, Heart, Palette, Globe } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";

const activities = [
  { icon: Trophy, title: "Sports", items: ["Basketball", "Soccer", "Swimming", "Tennis"] },
  { icon: Music, title: "Performing Arts", items: ["Orchestra", "Drama Club", "Dance", "Choir"] },
  { icon: Palette, title: "Visual Arts", items: ["Painting", "Photography", "Sculpture", "Digital Art"] },
  { icon: Users, title: "Clubs", items: ["Debate Club", "Robotics", "Model UN", "Science Club"] },
  { icon: Heart, title: "Community Service", items: ["Volunteering", "Charity Events", "Mentorship", "Environment"] },
  { icon: Globe, title: "Cultural Events", items: ["International Day", "Festivals", "Exchange Programs", "Workshops"] },
];

export default function StudentLife() {
  return (
    <div className="overflow-hidden">
      <section className="relative pt-32 pb-20 bg-hero-gradient">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">Beyond Academics</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Student <span className="text-gold">Life</span></h1>
            <p className="text-lg text-white/80">A vibrant community with endless opportunities for growth and discovery.</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader subtitle="Activities" title="Life Beyond Classroom" description="Explore diverse activities that develop skills, friendships, and memories." />
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <StaggerItem key={activity.title}>
                <motion.div whileHover={{ y: -5 }} className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <activity.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-primary">{activity.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activity.items.map((item) => (
                      <span key={item} className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">{item}</span>
                    ))}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
