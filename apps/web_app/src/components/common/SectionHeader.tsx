import { cn } from "@/lib/utils";
import { AnimatedSection } from "./AnimatedSection";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  align?: "left" | "center" | "right";
  className?: string;
  titleClassName?: string;
  light?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  description,
  align = "center",
  className,
  titleClassName,
  light = false,
}: SectionHeaderProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  };

  return (
    <AnimatedSection
      className={cn("max-w-3xl mb-12 md:mb-16", alignClasses[align], className)}
    >
      {subtitle && (
        <span
          className={cn(
            "inline-block text-sm font-semibold tracking-wider uppercase mb-3",
            light ? "text-gold-light" : "text-gold"
          )}
        >
          {subtitle}
        </span>
      )}
      <h2
        className={cn(
          "font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4",
          light ? "text-white" : "text-primary",
          titleClassName
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-lg leading-relaxed",
            light ? "text-white/80" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      )}
    </AnimatedSection>
  );
}

export default SectionHeader;
