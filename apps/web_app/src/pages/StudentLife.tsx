import { motion } from "framer-motion";
import { Users, Music, Trophy, Heart, Palette, Globe } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { Card } from '@/components/ui/card';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

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
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="STUDENT LIFE"
        title="Learning Continues Beyond the Classroom"
        accentText="Beyond the Classroom"
        description="A vibrant community with endless opportunities for growth, leadership, and lifelong friendships."
        backgroundImage="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[55%_center]"
        metadataItems={["Activities", "Community", "Experience"]}
      />

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader subtitle="Activities" title="Life Beyond Classroom" description="Explore diverse activities that develop skills, friendships, and memories." />
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <StaggerItem key={activity.title}>
                <Card className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                      <activity.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-xl text-foreground">{activity.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activity.items.map((item) => (
                      <span key={item} className="bg-muted px-3 py-1 rounded-lg text-xs font-medium text-muted-foreground">{item}</span>
                    ))}
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}

