import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCHOOL_INFO, EXTERNAL_URLS } from "@/lib/public-constants";

const footerLinks = {
  quickLinks: [
    { label: "About Us", href: "/about" },
    { label: "Academics", href: "/academics" },
    { label: "Admissions", href: "/admissions" },
    { label: "Campus Life", href: "/campus" },
    { label: "Contact Us", href: "/contact" },
  ],
  academics: [
    { label: "Programs", href: "/academics" },
    { label: "Departments", href: "/departments" },
    { label: "Faculty", href: "/faculty" },
    { label: "Achievements", href: "/achievements" },
    { label: "Events", href: "/events" },
  ],
  resources: [
    { label: "Student Portal", href: EXTERNAL_URLS.LOGIN, external: true },
    { label: "Apply Online", href: EXTERNAL_URLS.ADMISSION_REGISTRATION, external: true },
    { label: "Notifications", href: "/notifications" },
    { label: "Vision & Mission", href: "/vision-mission" },
    { label: "Leadership", href: "/leadership" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: SCHOOL_INFO.socialLinks.facebook, label: "Facebook" },
  { icon: Twitter, href: SCHOOL_INFO.socialLinks.twitter, label: "Twitter" },
  { icon: Instagram, href: SCHOOL_INFO.socialLinks.instagram, label: "Instagram" },
  { icon: Linkedin, href: SCHOOL_INFO.socialLinks.linkedin, label: "LinkedIn" },
  { icon: Youtube, href: SCHOOL_INFO.socialLinks.youtube, label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* CTA Section */}
      <div className="bg-gold">
        <div className="container-custom py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-navy mb-2">
                Ready to Begin Your Journey?
              </h3>
              <p className="text-navy/80">
                Join our community of learners and achievers. Applications are now open.
              </p>
            </div>
            <Link to={EXTERNAL_URLS.ADMISSION_REGISTRATION}>
              <Button
                size="lg"
                className="bg-navy text-white hover:bg-navy-light shadow-lg group"
              >
                Start Your Application
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-gold" />
              </div>
              <div>
                <span className="font-display text-xl font-bold block">
                  {SCHOOL_INFO.name}
                </span>
                <span className="text-xs text-primary-foreground/70">
                  Est. {SCHOOL_INFO.established}
                </span>
              </div>
            </Link>
            <p className="text-primary-foreground/80 mb-6 max-w-sm">
              {SCHOOL_INFO.tagline}. We are committed to nurturing young minds and
              shaping future leaders through excellence in education.
            </p>
            <div className="space-y-3">
              <a
                href={`mailto:${SCHOOL_INFO.email}`}
                className="flex items-center gap-3 text-primary-foreground/80 hover:text-gold transition-colors"
              >
                <Mail className="w-4 h-4" />
                {SCHOOL_INFO.email}
              </a>
              <a
                href={`tel:${SCHOOL_INFO.phone}`}
                className="flex items-center gap-3 text-primary-foreground/80 hover:text-gold transition-colors"
              >
                <Phone className="w-4 h-4" />
                {SCHOOL_INFO.phone}
              </a>
              <div className="flex items-start gap-3 text-primary-foreground/80">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {SCHOOL_INFO.address}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-gold">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Academics */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-gold">
              Academics
            </h4>
            <ul className="space-y-2">
              {footerLinks.academics.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-gold">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-gold hover:text-navy transition-all"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <p className="text-sm text-primary-foreground/60 text-center md:text-right">
              © {new Date().getFullYear()} {SCHOOL_INFO.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
