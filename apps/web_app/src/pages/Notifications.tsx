import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import { NOTIFICATIONS } from "@/lib/public-constants";
import { cn } from "@/lib/utils";

export default function Notifications() {
  return (
    <div className="overflow-hidden">
      <section className="relative pt-32 pb-20 bg-hero-gradient">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block bg-gold/20 text-gold-light px-4 py-2 rounded-full text-sm font-semibold mb-6">Updates</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Notifications & <span className="text-gold">Announcements</span></h1>
            <p className="text-lg text-white/80">Stay informed with the latest updates from our institution.</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-custom max-w-3xl">
          <StaggerContainer className="space-y-4">
            {NOTIFICATIONS.map((notification) => (
              <StaggerItem key={notification.id}>
                <div className={cn("bg-white rounded-xl p-6 shadow-md border-l-4", notification.isNew ? "border-gold" : "border-muted")}>
                  <div className="flex items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", notification.isNew ? "bg-gold/10" : "bg-muted")}>
                      <Bell className={cn("w-5 h-5", notification.isNew ? "text-gold" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-primary">{notification.title}</h3>
                        {notification.isNew && <span className="bg-gold text-navy px-2 py-0.5 rounded-full text-xs font-medium">New</span>}
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{notification.date}</span>
                        {"ctaText" in notification && "ctaLink" in notification && (
                          <Link to={notification.ctaLink}>
                            <Button variant="cta" size="sm">{notification.ctaText}</Button>
                          </Link>
                        )}
                      </div>
                    </div>
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
