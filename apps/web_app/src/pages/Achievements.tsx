import { Trophy, Award, Medal, Star } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const achievements = [
  { year: "2023", title: "National Excellence Award", category: "Academic" },
  { year: "2023", title: "State Basketball Champions", category: "Sports" },
  { year: "2022", title: "Science Olympiad Gold", category: "Academic" },
  { year: "2022", title: "Best School Musical Award", category: "Arts" },
  { year: "2021", title: "Environmental Leadership", category: "Community" },
  { year: "2021", title: "Coding Competition Winners", category: "Technology" },
];

export default function Achievements() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="ACHIEVEMENTS"
        title="Celebrating Progress, Excellence and Impact"
        accentText="Excellence and Impact"
        description="Celebrating our students' outstanding accomplishments across academics, sports, arts, and community leadership."
        backgroundImage="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[55%_center]"
        metadataItems={["Achievements", "Recognition", "Impact"]}
      />

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader subtitle="Our Pride" title="Award-Winning Excellence" />
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {achievements.map((item, index) => (
              <StaggerItem key={index}>
                <Card className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm border-l-4 border-l-amber-500 hover:shadow-md transition-all duration-300 space-y-2">
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">{item.year}</span>
                  <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                  <div>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {item.category}
                    </Badge>
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

