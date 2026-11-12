import React, { useState } from 'react';
import { Download, ExternalLink, Eye, FileText, FolderOpen, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGetChildResourcesQuery,
  useGetChildSubjectsQuery,
  useLazyGetChildResourceDownloadQuery,
  useLazyGetChildResourcePreviewQuery,
  ChildResourceDto,
} from '@/shared/api/parentPortal.api';
import { useParentSelectedChild } from '../hooks/useParentSelectedChild';
import { ParentChildSelectorBar } from '../components/ParentChildSelectorBar';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
} from '../components/ParentStates';

export const ParentLearningResourcesPage: React.FC = () => {
  const {
    children,
    selectedChildId,
    selectChild,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useParentSelectedChild();

  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [resourceType, setResourceType] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: subjectsData } = useGetChildSubjectsQuery(selectedChildId || '', {
    skip: !selectedChildId,
  });

  const { data, isLoading, isError, refetch } = useGetChildResourcesQuery(
    {
      childId: selectedChildId || '',
      search: search.trim() || undefined,
      subjectId: subjectId || undefined,
      categoryId: categoryId || undefined,
      resourceType: resourceType || undefined,
      page,
      limit: 24,
    },
    { skip: !selectedChildId },
  );

  const [triggerPreview] = useLazyGetChildResourcePreviewQuery();
  const [triggerDownload] = useLazyGetChildResourceDownloadQuery();

  const handlePreview = async (resource: ChildResourceDto) => {
    if (!selectedChildId) return;
    if (resource.resource_type === 'external_link' && resource.external_url) {
      window.open(resource.external_url, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const res: any = await triggerPreview({
        childId: selectedChildId,
        resourceId: resource.resource_id,
      }).unwrap();
      const targetUrl = res?.signedUrl || res?.signed_url || res?.url || res?.external_url;
      if (!targetUrl) {
        toast.error('Preview URL could not be generated for this resource.');
        return;
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Unable to open resource preview.');
    }
  };

  const handleDownload = async (resource: ChildResourceDto) => {
    if (!selectedChildId) return;
    try {
      const res: any = await triggerDownload({
        childId: selectedChildId,
        resourceId: resource.resource_id,
      }).unwrap();
      const targetUrl = res?.signedUrl || res?.signed_url || res?.url;
      if (!targetUrl) {
        toast.error('Download link is unavailable.');
        return;
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Unable to download resource.');
    }
  };

  if (isListLoading) {
    return (
      <PageContainer data-testid="parent-learning-resources-page">
        <ParentLoadingSkeleton />
      </PageContainer>
    );
  }

  if (isListError) {
    return (
      <PageContainer data-testid="parent-learning-resources-page">
        <ParentErrorState onRetry={refetchList} />
      </PageContainer>
    );
  }

  return (
    <PageContainer data-testid="parent-learning-resources-page">
      <PageHeader
        title="Learning Resources"
        description="Published study materials, notes, and digital links shared for your child's grade, section, and subjects."
        badge={
          <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">
            Digital Resource Library
          </Badge>
        }
      />

      {children.length === 0 ? (
        <ParentNoChildrenState />
      ) : (
        <>
          <ParentChildSelectorBar
            childrenList={children}
            selectedChildId={selectedChildId}
            onSelectChild={(id) => {
              setSubjectId('');
              setPage(1);
              selectChild(id);
            }}
          />

          {/* Filters */}
          <Card className="p-4 rounded-2xl border-border bg-card">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search study resources..."
                  className="pl-9 text-xs"
                />
              </div>

              <select
                aria-label="Filter by subject"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs"
              >
                <option value="">All Subjects</option>
                {(subjectsData?.subjects || []).map((sub) => (
                  <option key={sub.subject_id} value={sub.subject_id}>
                    {sub.subject_name} ({sub.subject_code})
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs"
              >
                <option value="">All Categories</option>
                {(data?.categories || []).map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by type"
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs"
              >
                <option value="">All Formats</option>
                <option value="file">Uploaded Files</option>
                <option value="external_link">External Links</option>
              </select>
            </div>
          </Card>

          {isLoading && !data ? (
            <ParentLoadingSkeleton />
          ) : isError ? (
            <ParentErrorState onRetry={refetch} />
          ) : !data || data.items.length === 0 ? (
            <Card className="p-10 rounded-3xl border-dashed border-2 border-border bg-card text-center space-y-2">
              <FolderOpen className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No Learning Resources Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No published resources matched your filter criteria for{' '}
                {data?.grade_name || 'this grade'}.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.items.map((item) => (
                  <Card
                    key={item.resource_id}
                    className="p-5 rounded-2xl border-border bg-card flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {item.category_name ||
                            (item.resource_type === 'external_link' ? 'External Link' : 'Document')}
                        </Badge>
                        {item.resource_type === 'file' && !item.allow_download && (
                          <Badge variant="outline" className="text-[10px]">
                            View Only
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-sm font-extrabold text-foreground leading-snug">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {item.description}
                        </p>
                      )}

                      {item.subjects && item.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.subjects.map((sub) => (
                            <Badge key={sub.subject_id} variant="outline" className="text-[10px]">
                              {sub.subject_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 truncate">
                          <User className="w-3 h-3 shrink-0" />
                          {item.uploaded_by_name || 'School Faculty'}
                        </span>
                        {item.file_name && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                            <FileText className="w-3 h-3 shrink-0" />
                            {item.file_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(item)}
                          className="flex-1 text-xs gap-1.5"
                        >
                          {item.resource_type === 'external_link' ? (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Link</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </>
                          )}
                        </Button>

                        {item.resource_type === 'file' && item.allow_download && (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(item)}
                            className="flex-1 text-xs gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>
                    Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} resources)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= data.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ParentLearningResourcesPage;
