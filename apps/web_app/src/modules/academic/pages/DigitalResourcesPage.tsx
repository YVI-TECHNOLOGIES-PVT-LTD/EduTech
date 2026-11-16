import React, { useCallback, useEffect, useState } from 'react';
import {
  FolderCheck,
  Search,
  ExternalLink,
  Download,
  Archive,
  Trash2,
  Plus,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AcademicManagementService,
  LearningResourceItem,
  ResourceCategoryItem,
  GradeItem,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  formatShortDate,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

export const DigitalResourcesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('ACADEMIC_SETUP');

  const [resources, setResources] = useState<LearningResourceItem[]>([]);
  const [categories, setCategories] = useState<ResourceCategoryItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    resource_type: 'external_link' as 'external_link' | 'file',
    external_url: '',
    category_id: '',
    resource_status: 'published' as 'draft' | 'published',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resList, catList, gradeList] = await Promise.all([
        AcademicManagementService.listResources({
          search: search.trim() || undefined,
          category_id: selectedCategory || undefined,
          grade_id: selectedGrade || undefined,
          status: selectedStatus || undefined,
          limit: 50,
        }),
        AcademicManagementService.listResourceCategories(),
        AcademicManagementService.listGrades({ limit: 50 }),
      ]);
      setResources(resList.items);
      setCategories(catList);
      setGrades(gradeList.items);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load digital resource library'));
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedGrade, selectedStatus]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Resource title is required.');
      return;
    }
    if (form.resource_type === 'external_link' && !form.external_url.trim()) {
      setError('External URL is required for link resources.');
      return;
    }
    if (form.resource_type === 'file' && !selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (form.resource_type === 'file' && selectedFile) {
        const fd = new FormData();
        fd.append('title', form.title.trim());
        if (form.description.trim()) fd.append('description', form.description.trim());
        fd.append('resource_type', 'file');
        if (form.category_id) fd.append('category_id', form.category_id);
        fd.append('resource_status', form.resource_status);
        fd.append('file', selectedFile);
        await AcademicManagementService.createResource(fd);
      } else {
        await AcademicManagementService.createExternalResource({
          title: form.title.trim(),
          description: form.description.trim() || null,
          resource_type: 'external_link',
          external_url: form.external_url.trim(),
          category_id: form.category_id || null,
          resource_status: form.resource_status,
        });
      }

      setSuccess(`Added resource "${form.title.trim()}".`);
      setForm({
        title: '',
        description: '',
        resource_type: 'external_link',
        external_url: '',
        category_id: '',
        resource_status: 'published',
      });
      setSelectedFile(null);
      await loadResources();
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to save digital resource'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (resource: LearningResourceItem) => {
    setError(null);
    try {
      if (resource.resource_type === 'external_link' && resource.external_url) {
        window.open(resource.external_url, '_blank', 'noopener,noreferrer');
        return;
      }
      const res = await AcademicManagementService.getResourceDownload(resource.resource_id);
      const url = res?.signed_url || res?.download_url || res?.url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        setError('Download URL is currently unavailable for this asset.');
      }
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to download resource'));
    }
  };

  const handleArchive = async (id: string, title: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.archiveResource(id);
      setSuccess(`Archived "${title}".`);
      await loadResources();
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to archive resource'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.deleteResource(id);
      setSuccess(`Deleted "${title}".`);
      await loadResources();
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to delete resource'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="academic-resources-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Digital Resource Library"
        subtitle="Institutional repository of uploaded teaching materials, syllabi PDFs, and curated web links."
        icon={FolderCheck}
        onRefresh={loadResources}
        loading={loading}
      />

      <AcademicStatusBanner error={error} success={success} />

      {/* Search & Filter Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              aria-label="Search digital resources"
              placeholder="Search title, filename, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter by resource category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by grade"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Grades</option>
            {grades.map((g) => (
              <option key={g.grade_id} value={g.grade_id}>
                {g.grade_name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </CardContent>
      </Card>

      <div className={`grid grid-cols-1 ${canManage ? 'lg:grid-cols-3' : ''} gap-6`}>
        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Digital Resource
              </CardTitle>
              <CardDescription>
                Upload a document or attach a verified HTTP/HTTPS learning link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateResource} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="res-title">Title</Label>
                  <Input
                    id="res-title"
                    placeholder="e.g. Physics Wave Optics Lab Guide"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="res-type">Resource Type</Label>
                  <select
                    id="res-type"
                    value={form.resource_type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, resource_type: e.target.value as any }))
                    }
                    className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="external_link">External Web Link</option>
                    <option value="file">File Upload</option>
                  </select>
                </div>
                {form.resource_type === 'external_link' ? (
                  <div className="space-y-1">
                    <Label htmlFor="res-url">External URL</Label>
                    <Input
                      id="res-url"
                      placeholder="https://..."
                      value={form.external_url}
                      onChange={(e) => setForm((p) => ({ ...p, external_url: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label htmlFor="res-file">Document File</Label>
                    <Input
                      id="res-file"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="res-cat">Category</Label>
                    <select
                      id="res-cat"
                      value={form.category_id}
                      onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="res-status">Status</Label>
                    <select
                      id="res-status"
                      value={form.resource_status}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, resource_status: e.target.value as any }))
                      }
                      className="w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Publish Resource'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className={canManage ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Repository Assets ({resources.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {loading ? 'Loading digital resource library...' : 'No learning resources found.'}
              </div>
            ) : (
              resources.map((res) => (
                <div
                  key={res.resource_id}
                  className="p-4 rounded-xl border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-sm">{res.title}</span>
                      <Badge
                        variant="outline"
                        className={getAcademicStatusBadgeClass(res.resource_status)}
                      >
                        {res.resource_status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {res.category_name || 'General'} · {res.file_name || res.resource_type} ·
                      Added {formatShortDate(res.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(res)}
                    >
                      {res.resource_type === 'external_link' ? (
                        <>
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Open
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                    {canManage && res.resource_status !== 'archived' && (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        title="Archive resource"
                        onClick={() => handleArchive(res.resource_id, res.title)}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        title="Delete resource"
                        onClick={() => handleDelete(res.resource_id, res.title)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DigitalResourcesPage;
