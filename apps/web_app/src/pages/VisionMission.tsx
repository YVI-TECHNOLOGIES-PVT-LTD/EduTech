import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Target, Eye, Compass, Sparkles, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { Card } from '@/components/ui/card';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

const visionPoints = [
  {
    icon: Globe,
    title: "Global Perspective",
    description: "Preparing students to be global citizens with cross-cultural understanding.",
  },
  {
    icon: Sparkles,
    title: "Innovation Hub",
    description: "Creating an environment that encourages creativity and innovative thinking.",
  },
  {
    icon: Shield,
    title: "Character Building",
    description: "Developing ethical leaders with strong moral foundations.",
  },
];

const missionPillars = [
  {
    title: "Academic Excellence",
    description: "Provide rigorous, challenging curriculum that prepares students for higher education and lifelong learning.",
    color: "bg-blue-500",
  },
  {
    title: "Holistic Development",
    description: "Foster physical, emotional, social, and intellectual growth through diverse programs and activities.",
    color: "bg-green-500",
  },
  {
    title: "Character Education",
    description: "Instill values of integrity, responsibility, and compassion in every student.",
    color: "bg-purple-500",
  },
  {
    title: "Community Engagement",
    description: "Build strong partnerships with families and the community to support student success.",
    color: "bg-orange-500",
  },
];

export default function VisionMission() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="OUR PURPOSE"
        title="A Clear Vision for Better Learning Outcomes"
        accentText="Learning Outcomes"
        description="Our vision and mission guide everything we do, from curriculum design to community engagement. They represent our commitment to educational excellence and student success."
        backgroundImage="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[55%_center]"
        metadataItems={["Vision", "Mission", "Core Values"]}
      />

      {/* Vision Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection direction="left">
              <div className="inline-flex items-center gap-2 bg-[#063F40] text-[#E7B76A] px-4 py-1.5 rounded-full mb-6 border border-[#E7B76A]/30">
                <Eye className="w-4 h-4 text-[#E7B76A]" />
                <span className="font-bold text-xs uppercase tracking-wider">Our Vision</span>
              </div>
              <h2 className="font-extrabold text-3xl md:text-4xl text-foreground mb-6 tracking-tight">
                Inspiring Excellence, Empowering Futures
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                To be a world-renowned institution that transforms education by nurturing 
                innovative thinkers, compassionate leaders, and responsible global citizens 
                who will shape a better tomorrow.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We envision a learning community where every student discovers their unique 
                potential, develops critical thinking skills, and emerges as a confident, 
                well-rounded individual prepared to make meaningful contributions to society.
              </p>
            </AnimatedSection>
            
            <StaggerContainer className="grid gap-4">
              {visionPoints.map((point) => (
                <StaggerItem key={point.title}>
                  <Card className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 bg-[#063F40] text-[#E7B76A] rounded-xl flex items-center justify-center flex-shrink-0">
                      <point.icon className="w-6 h-6 text-[#E7B76A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1 text-base">{point.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{point.description}</p>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-editorial-cream border-t border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 bg-[#063F40] text-[#E7B76A] px-4 py-1.5 rounded-full mb-2 border border-[#E7B76A]/30">
                <Target className="w-4 h-4 text-[#E7B76A]" />
                <span className="font-bold text-xs uppercase tracking-wider">Our Mission</span>
              </div>
              <h2 className="font-extrabold text-3xl md:text-4xl text-foreground tracking-tight">
                Nurturing Tomorrow's Leaders Today
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Our mission is to provide an exceptional educational experience that 
                challenges, inspires, and empowers every student to achieve their fullest 
                potential while developing the skills, knowledge, and character necessary 
                to succeed in a rapidly changing world.
              </p>
            </AnimatedSection>
          </div>
          
          <StaggerContainer className="grid md:grid-cols-2 gap-6">
            {missionPillars.map((pillar) => (
              <StaggerItem key={pillar.title}>
                <Card className="rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden h-full flex flex-col">
                  <div className="h-2 bg-[#063F40]" />
                  <div className="p-8 space-y-3 flex-1">
                    <h3 className="font-bold text-xl text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Guiding Principles */}
      <section className="py-20 bg-[#063F40] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            subtitle="Guiding Principles"
            title="The Compass of Our Actions"
            description="These principles inform our decisions and shape our institutional culture."
            light
          />
          
          <AnimatedSection className="pt-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { title: "Student-Centered", desc: "Every decision prioritizes student well-being and success." },
                { title: "Research-Based", desc: "Our methods are grounded in educational research and best practices." },
                { title: "Future-Focused", desc: "We prepare students for the challenges and opportunities ahead." },
              ].map((item, index) => (
                <div key={item.title} className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[#E7B76A] text-[#063F40] rounded-full flex items-center justify-center mx-auto mb-4 font-black text-lg shadow-md">
                    <span>{index + 1}</span>
                  </div>
                  <h3 className="font-bold text-xl text-white">{item.title}</h3>
                  <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
          
          <AnimatedSection className="text-center mt-12">
            <Link to="/about">
              <Button size="lg" className="font-bold bg-[#E7B76A] hover:bg-[#d8a658] text-[#063F40] shadow-md flex items-center space-x-2 rounded-xl h-11 px-6 mx-auto">
                <span>Learn More About Us</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

