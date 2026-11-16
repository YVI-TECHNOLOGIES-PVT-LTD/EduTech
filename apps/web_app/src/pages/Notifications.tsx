import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/common/AnimatedSection";
import { NOTIFICATIONS } from "@/lib/public-constants";
import { cn } from "@/lib/utils";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CinematicPageHero } from "@/components/patterns/CinematicPageHero";

export default function Notifications() {
  return (
    <div className="overflow-hidden">
      {/* Cinematic Hero Section */}
      <CinematicPageHero
        eyebrow="EDUTRACK UPDATES"
        title="Important Information for Our Community"
        accentText="Our Community"
        description="Stay informed with official circulars, announcements, and key institutional updates."
        backgroundImage="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop"
        imagePosition="object-[55%_center]"
        metadataItems={["Announcements", "Updates", "Notices"]}
      />

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <StaggerContainer className="space-y-4">
            {NOTIFICATIONS.map((notification) => (
              <StaggerItem key={notification.id}>
                <Card className={cn("p-6 rounded-2xl bg-card border border-border/80 shadow-sm border-l-4", notification.isNew ? "border-l-indigo-600 dark:border-l-indigo-400" : "border-l-muted")}>
                  <div className="flex items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", notification.isNew ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400" : "bg-muted text-muted-foreground")}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-base">{notification.title}</h3>
                        {notification.isNew && (
                          <Badge variant="secondary" className="text-[10px] font-bold">New</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{notification.message}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <span className="text-xs font-medium text-muted-foreground">{notification.date}</span>
                        {"ctaText" in notification && "ctaLink" in notification && (
                          <Link to={notification.ctaLink}>
                            <Button size="sm" className="font-bold">{notification.ctaText}</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}

