import { useState, useEffect } from 'react';
import { X, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingButton } from '@/components/edutrack/LoadingButton';
import { Button } from '@/components/ui/button';

interface AssignSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess: () => void;
}

export const AssignSectionModal = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}: AssignSectionModalProps) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      const currentSection = student.sections?.[0]?.section;
      if (currentSection) {
        setSelectedClassId(currentSection.class?.id || currentSection.class_id || '');
        setSelectedSectionId(currentSection.id || '');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedClassId) {
      fetchSections(selectedClassId);
    } else {
      setSections([]);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    setFetchingClasses(true);
    try {
      const res = await apiClient.get('/academic/classes');
      setClasses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    } finally {
      setFetchingClasses(false);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await apiClient.get('/academic/sections', { params: { classId } });
      setSections(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sections', err);
    }
  };

  const handleSave = async () => {
    if (!selectedSectionId) return;

    const currentSection = student.sections?.[0]?.section;
    if (
      currentSection &&
      !window.confirm(
        `Student is currently assigned to ${currentSection.class?.name || 'Unknown'} - ${currentSection.name}. Overwrite with new assignment?`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/admin/student-section/assign', {
        student_id: student.id,
        section_id: selectedSectionId,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign section');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">Assign Section</h3>
              <p className="text-muted-foreground text-sm font-medium">{student.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Select Class
            </label>
            <Select
              value={selectedClassId}
              onValueChange={(val) => {
                setSelectedClassId(val);
                setSelectedSectionId('');
              }}
              disabled={fetchingClasses || loading}
            >
              <SelectTrigger className="w-full h-12 rounded-2xl bg-muted/40 font-bold text-foreground">
                <SelectValue
                  placeholder={fetchingClasses ? 'Loading classes...' : 'Choose Class...'}
                />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="font-medium">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Select Section
            </label>
            <Select
              value={selectedSectionId}
              onValueChange={(val) => setSelectedSectionId(val)}
              disabled={!selectedClassId || loading}
            >
              <SelectTrigger className="w-full h-12 rounded-2xl bg-muted/40 font-bold text-foreground">
                <SelectValue
                  placeholder={selectedClassId ? 'Choose Section...' : 'Select class first'}
                />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="font-medium">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSectionId && (
            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Ready to assign to current active year.
              </p>
            </div>
          )}

          <div className="pt-3 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl font-bold"
            >
              Cancel
            </Button>
            <LoadingButton
              type="button"
              onClick={handleSave}
              isLoading={loading}
              loadingText="Saving..."
              disabled={!selectedSectionId || loading}
              className="flex-1 h-12 rounded-2xl font-bold bg-primary text-primary-foreground gap-2"
            >
              Save Assignment
              <ArrowRight className="w-4 h-4" />
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
};
