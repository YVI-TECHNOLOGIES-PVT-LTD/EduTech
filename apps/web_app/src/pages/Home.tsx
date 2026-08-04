import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  Trophy,
  BookOpen,
  ArrowRight,
  Star,
  MapPin,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import SectionHeader from "@/components/common/SectionHeader";
import { EXTERNAL_URLS, SCHOOL_INFO } from "@/lib/public-constants";

// Stats data
const stats = [
  { icon: GraduationCap, value: "5000+", label: "Students" },
  { icon: Users, value: "200+", label: "Expert Faculty" },
  { icon: Trophy, value: "150+", label: "Awards Won" },
  { icon: BookOpen, value: "50+", label: "Programs" },
];

// Features data
const features = [
  {
    title: "Academic Excellence",
    description: "Rigorous curriculum designed to challenge and inspire students to reach their full potential.",
    icon: BookOpen,
  },
  {
    title: "Holistic Development",
    description: "Emphasis on sports, arts, and extracurricular activities for well-rounded growth.",
    icon: Star,
  },
  {
    title: "World-Class Faculty",
    description: "Experienced educators dedicated to nurturing the next generation of leaders.",
    icon: Users,
  },
  {
    title: "Modern Infrastructure",
    description: "State-of-the-art facilities including labs, libraries, and sports complexes.",
    icon: MapPin,
  },
];

// Programs preview
const programs = [
  {
    title: "Elementary School",
    grades: "Grades 1-5",
    description: "Building strong foundations through interactive learning.",
    color: "bg-blue-500",
  },
  {
    title: "Middle School",
    grades: "Grades 6-8",
    description: "Nurturing curiosity and critical thinking skills.",
    color: "bg-green-500",
  },
  {
    title: "High School",
    grades: "Grades 9-12",
    description: "Preparing students for higher education and beyond.",
    color: "bg-purple-500",
  },
];

// Testimonials
const testimonials = [
  {
    quote: "EduTrack transformed my child's approach to learning. The teachers here truly care.",
    author: "Sarah Johnson",
    role: "Parent",
  },
  {
    quote: "The best decision I made was joining this school. It prepared me excellently for university.",
    author: "Michael Chen",
    role: "Alumni, Class of 2022",
  },
  {
    quote: "A nurturing environment where every child is encouraged to discover their unique talents.",
    author: "Dr. Emily Roberts",
    role: "Education Consultant",
  },
];

// Upcoming events
const events = [
  {
    title: "Open House 2026",
    date: "Feb 15, 2026",
    description: "Visit our campus and meet our faculty.",
  },
  {
    title: "Annual Science Fair",
    date: "Mar 10, 2026",
    description: "Showcasing student innovations and discoveries.",
  },
  {
    title: "Spring Arts Festival",
    date: "Apr 5, 2026",
    description: "A celebration of creativity and artistic expression.",
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-hero-gradient overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />

        {/* Animated Shapes */}
        <div className="absolute top-20 right-20 w-72 h-72 lg:w-64 lg:h-64 xl:w-72 xl:h-72 bg-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 lg:w-64 lg:h-64 xl:w-96 xl:h-96 bg-white/5 rounded-full blur-3xl animate-float" />

        <div className="container-custom relative z-10 pt-32 lg:pt-16 xl:pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Admissions Open 2026-27
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6 lg:max-w-2xl">
                Shaping Minds,{" "}
                <span className="text-gold">Building Futures</span>
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-lg lg:max-w-xl">
                Welcome to {SCHOOL_INFO.name}, where academic excellence meets holistic development.
                Join a legacy of {new Date().getFullYear() - SCHOOL_INFO.established} years of
                educational excellence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
                  <Button variant="hero" size="xl">
                    Apply Now
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="heroOutline" size="xl">
                    Explore Our Story
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block lg:scale-95 xl:scale-100 origin-center"
            >
              <div className="relative">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-gold/20 rounded-2xl rotate-12" />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-2xl -rotate-12" />

                {/* Main Image Container */}
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-navy-light to-navy flex items-center justify-center overflow-hidden">
                    <div className="text-center p-8">
                      <GraduationCap className="w-24 h-24 text-gold mx-auto mb-4" />
                      <p className="text-white font-display text-2xl font-bold">
                        {SCHOOL_INFO.name}
                      </p>
                      <p className="text-white/70 mt-2">{SCHOOL_INFO.tagline}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gold rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 lg:-mt-8 xl:-mt-16 z-20">
        <div className="container-custom">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StaggerItem key={stat.label}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg text-center card-hover"
                >
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-7 h-7 text-gold" />
                  </div>
                  <p className="font-display text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader
            subtitle="Why Choose Us"
            title="Excellence in Every Aspect"
            description="We provide a comprehensive educational experience that nurtures academic achievement, personal growth, and character development."
          />

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl p-6 shadow-md card-hover h-full"
                >
                  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-5">
                    <feature.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Programs Section */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <SectionHeader
            subtitle="Our Programs"
            title="Comprehensive Academic Programs"
            description="From elementary to high school, we offer tailored programs designed to bring out the best in every student."
          />

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {programs.map((program) => (
              <StaggerItem key={program.title}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="group relative bg-white rounded-3xl overflow-hidden shadow-md card-hover"
                >
                  <div className={`h-3 ${program.color}`} />
                  <div className="p-8">
                    <span className="inline-block bg-muted px-3 py-1 rounded-full text-sm font-medium text-muted-foreground mb-4">
                      {program.grades}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-primary mb-3">
                      {program.title}
                    </h3>
                    <p className="text-muted-foreground mb-6">{program.description}</p>
                    <Link to="/academics">
                      <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Learn More
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimatedSection className="text-center mt-12">
            <Link to="/academics">
              <Button variant="cta" size="lg">
                View All Programs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Admission CTA Section */}
      <section className="relative py-24 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Admissions 2026-27
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Begin Your Child's Journey to Excellence
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Applications are now open for the new academic year. Join our community of
                learners and embark on a transformative educational experience.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {["Online Application", "Merit-Based Admission", "Financial Aid Available"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-white/90">
                    <CheckCircle className="w-5 h-5 text-gold" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
                  <Button variant="hero" size="xl">
                    Start Application
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/admission-process">
                  <Button variant="heroOutline" size="xl">
                    View Process
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <SectionHeader
            subtitle="Testimonials"
            title="What Our Community Says"
            description="Hear from parents, students, and education experts about their experience with us."
          />

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-8 shadow-md h-full flex flex-col"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-foreground italic flex-1 mb-6">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-primary">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Events Section */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <SectionHeader
            subtitle="Upcoming Events"
            title="Join Us at Our Events"
            description="Stay connected with our vibrant community through various events and activities."
          />

          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {events.map((event) => (
              <StaggerItem key={event.title}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md card-hover"
                >
                  <div className="bg-primary p-4">
                    <div className="flex items-center gap-2 text-gold">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">{event.date}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-primary mb-2">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimatedSection className="text-center mt-12">
            <Link to="/events">
              <Button variant="cta" size="lg">
                View All Events
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
