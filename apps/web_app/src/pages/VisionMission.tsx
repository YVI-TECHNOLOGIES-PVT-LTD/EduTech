import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Target, Eye, Compass, Sparkles, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";

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
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Our Purpose
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Vision & <span className="text-gold">Mission</span>
            </h1>
            <p className="text-lg text-white/80">
              Our vision and mission guide everything we do, from curriculum design to 
              community engagement. They represent our commitment to educational excellence 
              and student success.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Vision Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection direction="left">
              <div className="inline-flex items-center gap-3 bg-gold/10 px-4 py-2 rounded-full mb-6">
                <Eye className="w-5 h-5 text-gold" />
                <span className="text-gold font-semibold">Our Vision</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-6">
                Inspiring Excellence, Empowering Futures
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                To be a world-renowned institution that transforms education by nurturing 
                innovative thinkers, compassionate leaders, and responsible global citizens 
                who will shape a better tomorrow.
              </p>
              <p className="text-muted-foreground">
                We envision a learning community where every student discovers their unique 
                potential, develops critical thinking skills, and emerges as a confident, 
                well-rounded individual prepared to make meaningful contributions to society.
              </p>
            </AnimatedSection>
            
            <StaggerContainer className="grid gap-4">
              {visionPoints.map((point) => (
                <StaggerItem key={point.title}>
                  <motion.div
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-md"
                  >
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <point.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary mb-1">{point.title}</h3>
                      <p className="text-sm text-muted-foreground">{point.description}</p>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <AnimatedSection>
              <div className="inline-flex items-center gap-3 bg-gold/10 px-4 py-2 rounded-full mb-6">
                <Target className="w-5 h-5 text-gold" />
                <span className="text-gold font-semibold">Our Mission</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-6">
                Nurturing Tomorrow's Leaders Today
              </h2>
              <p className="text-lg text-muted-foreground">
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
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md h-full"
                >
                  <div className={`h-2 ${pillar.color}`} />
                  <div className="p-8">
                    <h3 className="font-display text-xl font-bold text-primary mb-3">
                      {pillar.title}
                    </h3>
                    <p className="text-muted-foreground">{pillar.description}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Guiding Principles */}
      <section className="section-padding bg-primary">
        <div className="container-custom">
          <SectionHeader
            subtitle="Guiding Principles"
            title="The Compass of Our Actions"
            description="These principles inform our decisions and shape our institutional culture."
            light
          />
          
          <AnimatedSection>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { title: "Student-Centered", desc: "Every decision prioritizes student well-being and success." },
                { title: "Research-Based", desc: "Our methods are grounded in educational research and best practices." },
                { title: "Future-Focused", desc: "We prepare students for the challenges and opportunities ahead." },
              ].map((item, index) => (
                <div key={item.title} className="text-center">
                  <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="font-display text-xl font-bold text-navy">{index + 1}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
          
          <AnimatedSection className="text-center mt-12">
            <Link to="/about">
              <Button variant="hero">
                Learn More About Us
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
