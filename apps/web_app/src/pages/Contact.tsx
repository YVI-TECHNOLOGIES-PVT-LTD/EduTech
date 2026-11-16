import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { SCHOOL_INFO } from "@/lib/public-constants";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Thank you for contacting us! Our administration team will respond shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 600);
  };

  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="CONTACT EDUTRACK"
        title="Let's Connect About Your Education Journey"
        accentText="Education Journey"
        description="We'd love to hear from you. Reach out with any questions regarding admissions, academics, or campus tours."
        backgroundImage="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[65%_center]"
        metadataItems={["Admissions", "Support", "Enquiries"]}
      />

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <AnimatedSection>
              <h2 className="font-extrabold text-2xl text-foreground mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#063F40] text-[#E7B76A] rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
                    <MapPin className="w-6 h-6 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Address</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{SCHOOL_INFO.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#063F40] text-[#E7B76A] rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Phone className="w-6 h-6 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Phone</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{SCHOOL_INFO.phone}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#063F40] text-[#E7B76A] rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Mail className="w-6 h-6 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Email</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{SCHOOL_INFO.email}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#063F40] text-[#E7B76A] rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Clock className="w-6 h-6 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Office Hours</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">Mon - Fri: 8:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <Card className="p-8 rounded-2xl bg-card border border-border/80 shadow-xs space-y-6">
                <h2 className="font-extrabold text-2xl text-foreground">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                  <textarea
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-foreground transition-all duration-200 outline-none text-sm placeholder:text-muted-foreground focus-visible:border-[#063F40] focus-visible:ring-2 focus-visible:ring-[#063F40]/30 resize-none"
                    required
                  />
                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full font-bold bg-[#E7B76A] hover:bg-[#d8a658] text-[#063F40] shadow-md flex items-center justify-center space-x-2 rounded-xl h-11">
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}


