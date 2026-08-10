import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TESTIMONIALS_DATA } from '../data/landing-content';

export const ParentTestimonials: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/20">
            Community Voices
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            What families say. <br />
            <span className="text-amber-400">Trusted by parents & alumni.</span>
          </h2>
          <p className="text-base text-slate-300 leading-relaxed">
            Discover real experiences and testimonials from parents, alumni, and educational advisors in our community.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="max-w-4xl mx-auto relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {TESTIMONIALS_DATA.map((item) => (
                <div key={item.id} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-700/80 shadow-2xl relative">
                    <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500/30 absolute top-6 right-6 pointer-events-none" />

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-4 sm:mb-6">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    {/* Quote Text */}
                    <blockquote className="font-display text-base sm:text-xl lg:text-2xl font-semibold text-slate-100 leading-relaxed mb-6 sm:mb-8 italic">
                      "{item.quote}"
                    </blockquote>

                    {/* Author Metadata */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-slate-700/60">
                      <div>
                        <div className="font-bold text-base sm:text-lg text-white font-display">
                          {item.author}
                        </div>
                        <div className="text-xs text-amber-400 font-semibold mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold bg-slate-700 text-slate-300 px-3 py-1 rounded-full uppercase tracking-wider">
                        {item.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-between mt-6 sm:mt-8 px-2 sm:px-4">
            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {scrollSnaps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === selectedIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                aria-label="Previous testimonial"
                className="w-11 h-11 rounded-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                aria-label="Next testimonial"
                className="w-11 h-11 rounded-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParentTestimonials;
