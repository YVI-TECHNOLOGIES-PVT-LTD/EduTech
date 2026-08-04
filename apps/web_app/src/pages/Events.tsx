import { Calendar } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";

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
      <section className="relative pt-32 pb-20 bg-hero-gradient">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">Stay Updated</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Events & <span className="text-gold">News</span></h1>
            <p className="text-lg text-white/80">Stay connected with the latest happenings at our campus.</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader subtitle="Upcoming" title="Events Calendar" />
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <StaggerItem key={event.title}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-md">
                  <div className="bg-primary p-4 flex items-center gap-2 text-gold">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">{event.date}</span>
                  </div>
                  <div className="p-6">
                    <span className="inline-block bg-gold/10 text-gold px-2 py-1 rounded text-xs font-medium mb-2">{event.type}</span>
                    <h3 className="font-display text-xl font-bold text-primary mb-2">{event.title}</h3>
                    <p className="text-muted-foreground text-sm">{event.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
