import { motion } from "framer-motion";
import { Building, BookOpen, Beaker, Monitor, Dumbbell, Music, Utensils, Bus } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { Card } from '@/components/ui/card';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const facilities = [
  { icon: Building, title: "Modern Classrooms", description: "Smart classrooms with interactive whiteboards and A/V equipment." },
  { icon: Beaker, title: "Science Labs", description: "Fully equipped physics, chemistry, and biology laboratories." },
  { icon: Monitor, title: "Computer Labs", description: "State-of-the-art computer labs with latest hardware and software." },
  { icon: BookOpen, title: "Library", description: "Extensive collection of books, journals, and digital resources." },
  { icon: Dumbbell, title: "Sports Complex", description: "Indoor and outdoor sports facilities including swimming pool." },
  { icon: Music, title: "Auditorium", description: "1000-seat auditorium for performances and events." },
  { icon: Utensils, title: "Cafeteria", description: "Nutritious meals prepared in hygienic kitchen facilities." },
  { icon: Bus, title: "Transportation", description: "Safe and reliable bus service covering major routes." },
];

export default function Campus() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="OUR CAMPUS"
        title="Spaces Designed for Learning, Growth and Community"
        accentText="Growth and Community"
        description="World-class infrastructure designed to inspire learning and growth."
        backgroundImage="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-center"
        metadataItems={["Facilities", "Learning Spaces", "Community"]}
      />

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader subtitle="Facilities" title="Everything You Need" description="Our campus provides all the resources for academic excellence and personal development." />
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map((facility) => (
              <StaggerItem key={facility.title}>
                <Card className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 h-full text-center flex flex-col items-center">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <facility.icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{facility.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{facility.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}

