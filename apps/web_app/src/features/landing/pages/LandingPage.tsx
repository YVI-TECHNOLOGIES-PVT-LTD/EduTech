import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users,
  Award,
  CheckCircle2,
  FileText,
  ChevronRight,
  TrendingUp,
  UserCheck,
  FileCheck,
  CalendarCheck,
  CreditCard,
  UserPlus,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { EduAIAssistant } from '@/features/landing/components/EduAIAssistant';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <div className="flex-1 bg-background text-foreground animate-page-entrance overflow-x-hidden">
      {/* 1. CINEMATIC EDITORIAL HERO SECTION */}
      <section className="bg-[#063F40] text-white pt-16 sm:pt-20 lg:pt-28 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column: Editorial Headlines & Staggered Action Hierarchy */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-[#E7B76A] text-xs font-bold border border-[#E7B76A]/30 shadow-xs animate-fade-in stagger-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
              <span className="uppercase tracking-widest text-[10px] font-black">
                EduTrack ERP • Academic Year 2026–27
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] animate-slide-up stagger-2">
              Empowering Academic Excellence Through <span className="text-[#E7B76A]">Integrated Operations</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-emerald-100/90 font-normal leading-relaxed max-w-2xl animate-fade-in stagger-3">
              A unified institutional platform connecting prospective parents, enrolled students, faculty, and administrators. Streamline admissions, track status in real time, process fees, and manage school operations.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-3">
              <Button
                onClick={() => navigate('/admission/register')}
                size="lg"
                className="px-8 font-bold bg-[#E7B76A] hover:bg-[#d8a658] text-[#063F40] shadow-lg flex items-center justify-center space-x-2 rounded-xl text-xs sm:text-sm h-12 transition-all duration-200"
              >
                <span>Apply for Admission</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                size="lg"
                className="px-8 font-bold border-white/20 text-white hover:bg-white/10 rounded-xl text-xs sm:text-sm h-12"
              >
                <span>Parent Portal Sign In</span>
              </Button>

              <Button
                onClick={() => navigate('/enquiry')}
                variant="ghost"
                size="lg"
                className="px-4 text-xs font-bold text-[#E7B76A] hover:bg-white/10 rounded-xl h-12"
              >
                <span>Submit Enquiry</span>
              </Button>
            </div>

            <div className="pt-4 flex items-center space-x-6 text-xs text-emerald-100/80 font-medium border-t border-emerald-900/60">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#E7B76A]" />
                <span>Verified Admissions Workflow</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>JWT Tenant Security</span>
              </div>
            </div>
          </div>

          {/* Right Column: High Quality Layered Editorial Photo Frame */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-3xl border border-white/15 bg-[#082F35] p-3 shadow-2xl overflow-hidden img-zoom-container">
                <div className="aspect-[4/5] rounded-2xl relative overflow-hidden text-white border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop"
                    alt="EduTrack Campus Student Collaboration"
                    className="w-full h-full object-cover img-zoom-target"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
                    <Badge variant="info" className="bg-[#063F40]/90 text-[#E7B76A] border-[#E7B76A]/40 font-mono text-[10px]">
                      Admissions Open
                    </Badge>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-200 uppercase bg-slate-950/60 px-2 py-1 rounded-md">AY 2026-27</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3 p-2 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E7B76A] text-[#063F40] flex items-center justify-center font-black shadow-md shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white tracking-tight">Institutional Excellence</h3>
                        <p className="text-[11px] text-emerald-200/80 leading-snug">
                          Real-time student dossier management & fee payments.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-emerald-200">
                      <span>99.8% System Uptime</span>
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Live Operations</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INSTITUTIONAL TRUST STRIP */}
      <section className="bg-editorial-cream py-6 border-y border-border/80 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between min-w-[750px] text-xs font-black text-foreground/80 uppercase tracking-widest">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#063F40]" />
            <span>Online Admissions</span>
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#063F40]" />
            <span>Parent Tracking Portal</span>
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-[#063F40]" />
            <span>Digital Fee Gateway</span>
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#063F40]" />
            <span>Centralized Desk CRM</span>
          </span>
        </div>
      </section>

      {/* 3. ABOUT EDUTRACK — OPEN EDITORIAL STORYTELLING */}
      <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest border border-border/80">
              ABOUT EDUTRACK
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              A Modern Academic Platform Built for Growth & Accountability
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              EduTrack brings together admissions CRM, student information management, parent communication, and fee processing into a clean, modern interface designed for institutional standards.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-2 shadow-xs">
                <h4 className="text-xs font-extrabold text-foreground flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-[#063F40]" />
                  <span>Academic Rigor</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Comprehensive curriculum, section, and grade availability tracking.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-2 shadow-xs">
                <h4 className="text-xs font-extrabold text-foreground flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Parent Engagement</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Real-time notification alerts, document vault, and fee receipts.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/about" className="inline-flex items-center text-xs font-bold text-[#063F40] hover:underline space-x-1">
                <span>Discover our full vision & mission</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-[#063F40] text-white space-y-2 shadow-md">
                <span className="text-4xl font-extrabold text-[#E7B76A]">100%</span>
                <p className="text-xs font-bold text-white">Digital Applications</p>
                <p className="text-[11px] text-emerald-100/80 leading-snug">Paperless admission processing from submission to enrollment.</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
                <span className="text-4xl font-extrabold text-foreground">24/7</span>
                <p className="text-xs font-bold text-foreground">Parent Access</p>
                <p className="text-[11px] text-muted-foreground leading-snug">Track application status and fee statements anytime.</p>
              </div>
            </div>
            <div className="space-y-4 pt-6">
              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
                <span className="text-4xl font-extrabold text-foreground">Real-time</span>
                <p className="text-xs font-bold text-foreground">Inquiry Desk</p>
                <p className="text-[11px] text-muted-foreground leading-snug">Instant counselor assignment and follow-up logging.</p>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 space-y-2">
                <span className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-300">Secure</span>
                <p className="text-xs font-bold text-foreground">Data Protection</p>
                <p className="text-[11px] text-muted-foreground leading-snug">Multi-tenant isolation and role-based permissions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ADMISSION LIFECYCLE PROGRESSION (VISUAL 7-STAGE TIMELINE) */}
      <section className="py-20 bg-muted/40 border-y border-border/80 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 min-w-[900px]">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-card border border-border/80 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              ADMISSION JOURNEY
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              7-Stage Transparent Admissions Lifecycle
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-3 text-center relative pt-4">
            <div className="space-y-2 relative group">
              <div className="w-10 h-10 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-bold text-xs mx-auto shadow-md">
                1
              </div>
              <h4 className="text-xs font-bold text-foreground">Enquiry</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Public Form Capture</p>
            </div>

            <div className="space-y-2 relative group">
              <div className="w-10 h-10 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-bold text-xs mx-auto shadow-md">
                2
              </div>
              <h4 className="text-xs font-bold text-foreground">Registration</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Guardian OTP Auth</p>
            </div>

            <div className="space-y-2 relative group">
              <div className="w-10 h-10 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-bold text-xs mx-auto shadow-md">
                3
              </div>
              <h4 className="text-xs font-bold text-foreground">Application</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Horizontal Wizard</p>
            </div>

            <div className="space-y-2 relative group">
              <div className="w-10 h-10 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-bold text-xs mx-auto shadow-md">
                4
              </div>
              <h4 className="text-xs font-bold text-foreground">Verification</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Desk Review</p>
            </div>

            <div className="space-y-2 relative group">
              <div className="w-10 h-10 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-bold text-xs mx-auto shadow-md">
                5
              </div>
              <h4 className="text-xs font-bold text-foreground">Interview</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Slot Scheduling</p>
            </div>

            <div className="space-y-2 relative group">
              <div className="w-10 h-10 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-bold text-xs mx-auto shadow-md">
                6
              </div>
              <h4 className="text-xs font-bold text-foreground">Decision</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Merit Offer</p>
            </div>

            <div className="space-y-2 relative group">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mx-auto shadow-md">
                7
              </div>
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Enrollment</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Fee Payment & ERP</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY EDUTRACK — SOFT MIST BENTO SYSTEM WITH INTERACTION HOVERS */}
      <section className="py-24 bg-editorial-mist border-t border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-card border border-border/80 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              PLATFORM FEATURES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Designed for Admissions, Built for Operations
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Explore the core capabilities powering EduTrack's academic workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Tile 1: Featured Span 2 */}
            <Card className="md:col-span-2 p-8 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 card-hover-lift flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#063F40] text-white flex items-center justify-center font-bold shadow-sm">
                  <FileText className="w-6 h-6 text-[#E7B76A]" />
                </div>
                <div className="space-y-2">
                  <Badge variant="info" className="w-fit text-[9px] uppercase tracking-wider font-mono">Admission Lifecycle</Badge>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    End-to-End Admission & Inquiry Management
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                    From initial walk-in or online enquiry through document verification, interview scheduling, merit list publishing, offer letter generation, and fee payment.
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-border/60 mt-6 flex items-center justify-between">
                <span className="text-xs font-bold text-[#063F40]">Integrated Desk Queues</span>
                <ArrowRight className="w-4 h-4 text-[#063F40] transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Card>

            {/* Bento Tile 2: Parent Portal */}
            <Card className="p-8 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 card-hover-lift flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-100 dark:border-emerald-900">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <Badge variant="success" className="w-fit text-[9px] uppercase tracking-wider font-mono">Parent Portal</Badge>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    Parent Guardian Dashboard
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Live status tracking, document uploads, digital fee receipts, and multi-child support.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600">Parent Experience</span>
                <ArrowRight className="w-4 h-4 text-emerald-600 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Card>

            {/* Bento Tile 3: Staff Tools */}
            <Card className="p-8 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 card-hover-lift flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Users className="w-6 h-6 text-[#E7B76A]" />
                </div>
                <div className="space-y-2">
                  <Badge variant="outline" className="w-fit text-[9px] uppercase tracking-wider font-mono">Staff Desks</Badge>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    Role-Based Staff Desks
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Receptionist, Counselor, Verification Officer, Principal, and Finance desks.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Staff Workspaces</span>
                <ArrowRight className="w-4 h-4 text-foreground transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Card>

            {/* Bento Tile 4: Executive Analytics Span 2 */}
            <Card className="md:col-span-2 p-8 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 card-hover-lift flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-100 dark:border-amber-900">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <Badge variant="warning" className="w-fit text-[9px] uppercase tracking-wider font-mono">Analytics</Badge>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    Executive Analytics & Command Center
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                    High-level enrollment KPIs, inquiry conversion metrics, fee collection forecasts, and operational health signals.
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-border/60 mt-6 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600">Executive Overview</span>
                <ArrowRight className="w-4 h-4 text-amber-600 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. ACADEMICS — WARM CREAM ATMOSPHERE */}
      <section className="py-24 bg-editorial-cream border-t border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-border/80 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-card border border-border/80 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                ACADEMIC PATHWAYS
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Structured Learning Programs Across Grades
              </h2>
            </div>
            <Link to="/academics" className="inline-flex items-center text-xs font-bold text-[#063F40] hover:underline">
              <span>Explore all academic programs</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <span className="text-xs font-black text-[#063F40] uppercase tracking-widest">FOUNDATION</span>
              <h3 className="text-base font-bold text-foreground">Pre-Primary & Nursery</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Early childhood development focused on play, creativity, and foundational social skills.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <span className="text-xs font-black text-[#063F40] uppercase tracking-widest">PRIMARY</span>
              <h3 className="text-base font-bold text-foreground">Grades 1 to 5</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Core numeracy, literacy, science, languages, and holistic physical education.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <span className="text-xs font-black text-[#063F40] uppercase tracking-widest">MIDDLE SCHOOL</span>
              <h3 className="text-base font-bold text-foreground">Grades 6 to 8</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Experiential science labs, mathematical problem-solving, and communicative skills.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <span className="text-xs font-black text-[#063F40] uppercase tracking-widest">SECONDARY</span>
              <h3 className="text-base font-bold text-foreground">Grades 9 to 12</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Specialized Science, Commerce, and Humanities streams preparing for higher education.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION SECTION */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest border border-border/80">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Admissions & Portal Guidance
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-xs">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
              How do I submit an enquiry for admission?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              You can submit an online enquiry via the public Enquiry form (`/enquiry`) without creating an account. Our admissions team will contact you within 24–48 hours.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
              How do parents register and track applications?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Register a Guardian Account (`/admission/register`), verify your OTP (`/admission/register/otp`), and log in to the Parent Portal (`/app/admissions/my`) to view real-time status and submit required documents.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
              Are digital fee payments supported?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Yes, parents can view itemized fee statements, pay online, and download official fee receipts directly from the Parent Portal Fees section (`/app/admissions/fees`).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
              How do staff members access their operational desks?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Staff sign in via the main Login screen (`/login`). Based on their assigned roles (Receptionist, Counselor, Verification, Principal, Finance), the platform dynamically routes them to their authorized workspaces.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* 8. FINAL ADMISSION CTA BANNER — DEEP INSTITUTIONAL TEAL */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#063F40] text-white rounded-3xl p-10 sm:p-14 lg:p-20 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden">
          <div className="space-y-4 max-w-xl relative z-10">
            <Badge variant="info" className="bg-emerald-950/90 text-[#E7B76A] border-[#E7B76A]/40 font-mono text-[10px]">
              Academic Year 2026-27
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Begin Your Educational Journey with EduTrack?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Apply online today or submit an enquiry to connect with our admissions counselors.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
            <Button
              onClick={() => navigate('/admission/register')}
              size="lg"
              className="w-full sm:w-auto px-8 font-bold bg-[#E7B76A] hover:bg-[#d8a658] text-[#063F40] shadow-lg rounded-xl text-xs sm:text-sm h-12"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              onClick={() => navigate('/enquiry')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 font-bold border-white/20 text-white hover:bg-white/10 rounded-xl text-xs sm:text-sm h-12"
            >
              <span>Submit Enquiry</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 9. EDUAI ASSISTANT INTEGRATION */}
      <EduAIAssistant isOpen={isAiOpen} onOpen={() => setIsAiOpen(true)} onClose={() => setIsAiOpen(false)} />
    </div>
  );
};

export default LandingPage;
