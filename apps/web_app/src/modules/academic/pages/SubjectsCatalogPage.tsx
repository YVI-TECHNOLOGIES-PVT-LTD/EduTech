import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Search, FolderOpen, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AcademicManagementService,
  SubjectItem,
  SubjectCategoryItem,
  GradeItem,
  GradeSubjectOfferingItem,
  LearningResourceItem,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

export const SubjectsCatalogPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [categories, setCategories] = useState<SubjectCategoryItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [subjectResources, setSubjectResources] = useState<LearningResourceItem[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [gradeOfferings, setGradeOfferings] = useState<GradeSubjectOfferingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjectsRes, categoriesRes, gradesRes] = await Promise.all([
        AcademicManagementService.listSubjects({
          search: search.trim() || undefined,
          category_id: selectedCategory || undefined,
          limit: 100,
        }),
        AcademicManagementService.listSubjectCategories(),
        AcademicManagementService.listGrades({ limit: 50 }),
      ]);
      setSubjects(subjectsRes.items);
      setCategories(categoriesRes);
      setGrades(gradesRes.items);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load subjects catalog'));
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleInspectSubject = async (subject: SubjectItem) => {
    setSelectedSubject(subject);
    try {
      const resources = await AcademicManagementService.getSubjectResources(subject.subject_id);
      setSubjectResources(resources);
    } catch {
      setSubjectResources([]);
    }
  };

  const handleLoadGradeOfferings = async (gradeId: string) => {
    setSelectedGradeId(gradeId);
    if (!gradeId) {
      setGradeOfferings([]);
      return;
    }
    try {
      const offerings = await AcademicManagementService.getClassSubjects(gradeId);
      setGradeOfferings(offerings);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load grade subject allocations'));
    }
  };

  return (
    <div data-testid="academic-subjects-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Subjects & Catalog"
        subtitle="Institutional subjects directory, category taxonomy, linked digital resources, and grade allocations."
        icon={BookOpen}
        onRefresh={loadCatalog}
        loading={loading}
      />

      <AcademicStatusBanner error={error} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              aria-label="Search subjects"
              placeholder="Search subject name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Subject Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.subject_category_id} value={c.subject_category_id}>
                {c.category_name} ({c.category_code})
              </option>
            ))}
          </select>
          <select
            aria-label="Inspect grade subject mapping"
            value={selectedGradeId}
            onChange={(e) => handleLoadGradeOfferings(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Inspect Grade Allocation...</option>
            {grades.map((g) => (
              <option key={g.grade_id} value={g.grade_id}>
                {g.grade_name} ({g.grade_code})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Optional Grade Subject Allocation Panel */}
      {selectedGradeId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Grade Subject Offerings & Period Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gradeOfferings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No subjects mapped to the selected grade for the current academic year.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {gradeOfferings.map((o) => (
                  <div
                    key={o.academic_year_grade_subject_id}
                    className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">
                        {o.subject_code}
                      </span>
                      <Badge variant="outline">{o.subject_requirement}</Badge>
                    </div>
                    <div className="font-bold text-sm">{o.subject_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Weekly: {o.weekly_periods ?? 0} periods · Theory: {o.theory_periods ?? 0} ·
                      Practical: {o.practical_periods ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Catalog + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Master Subject Catalog ({subjects.length})
            </CardTitle>
            <CardDescription>
              Click a subject to view metadata and attached digital learning materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {loading
                  ? 'Loading subject catalog...'
                  : 'No subjects matched the selected filters.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjects.map((sub) => {
                  const isActive = selectedSubject?.subject_id === sub.subject_id;
                  return (
                    <button
                      type="button"
                      key={sub.subject_id}
                      onClick={() => handleInspectSubject(sub)}
                      className={`text-left p-4 rounded-xl border transition space-y-1.5 ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                          : 'border-border/70 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          {sub.subject_code}
                        </span>
                        <Badge
                          variant="outline"
                          className={getAcademicStatusBadgeClass(
                            sub.is_active ? 'active' : 'draft',
                          )}
                        >
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="font-bold text-sm text-foreground">{sub.subject_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {sub.category_name || 'General Category'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-600" />
              Subject Details & Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSubject ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Select a subject from the catalog to inspect details and mapped learning resources.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase text-indigo-600">
                    {selectedSubject.subject_code}
                  </div>
                  <h3 className="text-lg font-black">{selectedSubject.subject_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedSubject.description || 'No catalog description provided.'}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mapped Digital Resources ({subjectResources.length})
                  </div>
                  {subjectResources.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No linked learning resources.</p>
                  ) : (
                    subjectResources.map((r) => (
                      <div
                        key={r.resource_id}
                        className="p-2.5 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="text-xs font-semibold">{r.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.resource_type} · {r.resource_status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubjectsCatalogPage;
