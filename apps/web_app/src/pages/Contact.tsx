import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { SCHOOL_INFO } from "@/lib/public-constants";

export default function Contact() {
  return (
    <div className="overflow-hidden">
      <section className="relative pt-32 pb-20 bg-hero-gradient">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">Get in Touch</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Contact <span className="text-gold">Us</span></h1>
            <p className="text-lg text-white/80">We'd love to hear from you. Reach out with any questions.</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <AnimatedSection>
              <h2 className="font-display text-2xl font-bold text-primary mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Address</h3>
                    <p className="text-muted-foreground">{SCHOOL_INFO.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Phone</h3>
                    <p className="text-muted-foreground">{SCHOOL_INFO.phone}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Email</h3>
                    <p className="text-muted-foreground">{SCHOOL_INFO.email}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Office Hours</h3>
                    <p className="text-muted-foreground">Mon - Fri: 8:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="font-display text-2xl font-bold text-primary mb-6">Send us a Message</h2>
                <form className="space-y-4">
                  <input type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-gold focus:outline-none" />
                  <input type="email" placeholder="Your Email" className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-gold focus:outline-none" />
                  <input type="text" placeholder="Subject" className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-gold focus:outline-none" />
                  <textarea placeholder="Your Message" rows={4} className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-gold focus:outline-none resize-none" />
                  <Button variant="cta" className="w-full">Send Message</Button>
                </form>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
