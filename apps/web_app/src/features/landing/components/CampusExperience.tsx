import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CAMPUS_GALLERY_DATA } from '../data/landing-content';
import { CampusMediaItem } from '../types/landing.types';

export const CampusExperience: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<CampusMediaItem | null>(null);

  const categories = [
    { key: 'all', label: 'All Campus' },
    { key: 'lab', label: 'STEM & Robotics' },
    { key: 'sports', label: 'Sports Arena' },
    { key: 'arts', label: 'Creative Arts' },
    { key: 'library', label: 'Knowledge Center' },
    { key: 'classroom', label: 'Classrooms' },
    { key: 'events', label: 'Events & Culture' },
  ];

  const filteredItems =
    selectedCategory === 'all'
      ? CAMPUS_GALLERY_DATA
      : CAMPUS_GALLERY_DATA.filter((item) => item.category === selectedCategory);

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Campus Experience
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Life at EduTrack. <br />
            <span className="text-indigo-900">Learning happens everywhere.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Our campus is designed to stimulate intellectual curiosity, physical vitality, artistic creation, and lifelong friendships.
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Image Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedImage(item)}
                className="group cursor-pointer bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-200 relative aspect-[4/3]"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />

                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                      {item.caption}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Image Preview Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="w-full sm:max-w-3xl bg-slate-950 text-white border-slate-800 p-0 overflow-hidden rounded-2xl">
            {selectedImage && (
              <div>
                <div className="relative aspect-[16/9] bg-slate-900">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-2">
                  <DialogTitle className="text-xl font-bold font-display text-white">
                    {selectedImage.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-300">
                    {selectedImage.caption}
                  </DialogDescription>
                  {selectedImage.tags && (
                    <div className="flex flex-wrap gap-2 pt-3">
                      {selectedImage.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default CampusExperience;
