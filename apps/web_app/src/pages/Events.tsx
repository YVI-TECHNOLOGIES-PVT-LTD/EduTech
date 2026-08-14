import { Calendar } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const events = [
  { title: "Open House 2026", date: "Feb 15, 2026", type: "Admissions", description: "Visit our campus and meet our faculty." },
  { title: "Annual Science Fair", date: "Mar 10, 2026", type: "Academic", description: "Student innovations and discoveries on display." },
  { title: "Spring Arts Festival", date: "Apr 5, 2026", type: "Arts", description: "A celebration of creativity and artistic expression." },
  { title: "Sports Day", date: "Apr 20, 2026", type: "Sports", description: "Annual athletics meet and competitions." },
  { title: "Graduation Ceremony", date: "May 25, 2026", type: "Ceremony", description: "Celebrating our graduating class of 2026." },
  { title: "Summer Camp", date: "Jun 1-30, 2026", type: "Summer", description: "Fun learning activities during summer break." },
];

export default function Events() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="EDUTRACK EVENTS"
        title="Moments That Bring Our Learning Community Together"
        accentText="Learning Community"
        description="Stay connected with workshops, ceremonies, exhibitions, and campus activities."
        backgroundImage="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[55%_center]"
        metadataItems={["Events", "Workshops", "Community"]}
      />

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader subtitle="Upcoming" title="Events Calendar" />
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <StaggerItem key={event.title}>
                <Card className="rounded-2xl bg-card border border-border/80 shadow-sm overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="bg-slate-950 p-4 flex items-center gap-2 text-amber-400 border-b border-slate-900">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-extrabold text-xs tracking-wide">{event.date}</span>
                  </div>
                  <div className="p-6 space-y-3 flex-1 flex flex-col">
                    <div>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {event.type}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-xl text-foreground">{event.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mt-auto">{event.description}</p>
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

