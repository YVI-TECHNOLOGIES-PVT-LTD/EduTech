import { Trophy, Award, Medal, Star } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";

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
      <section className="relative pt-32 pb-20 bg-hero-gradient">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">Excellence</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Achievements & <span className="text-gold">Results</span></h1>
            <p className="text-lg text-white/80">Celebrating our students' outstanding accomplishments.</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader subtitle="Our Pride" title="Award-Winning Excellence" />
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {achievements.map((item, index) => (
              <StaggerItem key={index}>
                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-gold">
                  <span className="text-gold font-semibold">{item.year}</span>
                  <h3 className="font-display text-lg font-bold text-primary mt-1">{item.title}</h3>
                  <span className="inline-block bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground mt-2">{item.category}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
