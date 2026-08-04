import { motion } from "framer-motion";
import { Building, BookOpen, Beaker, Monitor, Dumbbell, Music, Utensils, Bus } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";

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
      <section className="relative pt-32 pb-20 bg-hero-gradient">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">Our Campus</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Campus & <span className="text-gold">Facilities</span></h1>
            <p className="text-lg text-white/80">World-class infrastructure designed to inspire learning and growth.</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader subtitle="Facilities" title="Everything You Need" description="Our campus provides all the resources for academic excellence and personal development." />
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map((facility) => (
              <StaggerItem key={facility.title}>
                <motion.div whileHover={{ y: -8 }} className="bg-white rounded-2xl p-6 shadow-md h-full text-center">
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <facility.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2">{facility.title}</h3>
                  <p className="text-sm text-muted-foreground">{facility.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
