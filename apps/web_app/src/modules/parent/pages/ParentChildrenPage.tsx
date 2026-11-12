import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  FolderCheck,
  GraduationCap,
  Library,
  Mail,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Clock,
  Award,
  Layers,
} from 'lucide-react';
import { PageContainer, PageHeader, SectionHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useGetParentChildProfileQuery } from '@/shared/api/parentPortal.api';
import { useParentSelectedChild } from '../hooks/useParentSelectedChild';
import { ParentChildSelectorBar } from '../components/ParentChildSelectorBar';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
} from '../components/ParentStates';

export const ParentChildrenPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    children,
    selectedChildId,
    selectChild,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useParentSelectedChild();

  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useGetParentChildProfileQuery(selectedChildId || '', {
    skip: !selectedChildId,
  });

  if (isListLoading) {
    return (
      <PageContainer data-testid="parent-children-page">
        <ParentLoadingSkeleton />
      </PageContainer>
    );
  }

  if (isListError) {
    return (
      <PageContainer data-testid="parent-children-page">
        <ParentErrorState onRetry={refetchList} />
      </PageContainer>
    );
  }

  const child =
    profileData?.child || children.find((c) => c.student_id === selectedChildId) || null;
  const org = profileData?.organization || null;
  const enr = child?.current_enrollment || null;

  return (
    <PageContainer data-testid="parent-children-page">
      <PageHeader
        title="My Children"
        description="Manage student profiles, class placements, class teachers, faculty assignments, and enrollment history."
        badge={
          <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">
            Student Profiles ({children.length})
          </Badge>
        }
      />

      {children.length === 0 ? (
        <ParentNoChildrenState
          action={
            <Button onClick={() => navigate('/app/admissions/my')}>Go to Admissions Desk</Button>
          }
        />
      ) : (
        <>
          <ParentChildSelectorBar
            childrenList={children}
            selectedChildId={selectedChildId}
            onSelectChild={selectChild}
            title="Select Linked Child"
          />

          {isProfileLoading && !profileData ? (
            <ParentLoadingSkeleton cards={2} />
          ) : isProfileError ? (
            <ParentErrorState onRetry={refetchProfile} />
          ) : child ? (
            <div className="space-y-6">
              {/* Hero Profile Card */}
              <Card className="p-6 rounded-3xl border-border bg-card shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start sm:items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-primary/20 shadow-sm shrink-0">
                      {child.photo_url && (
                        <AvatarImage src={child.photo_url} alt={child.full_name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-black">
                        {getInitials(child.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                          {child.full_name}
                        </h2>
                        <Badge
                          variant={child.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize text-[11px]"
                        >
                          {child.status}
                        </Badge>
                        {child.is_primary_contact && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Primary Guardian Contact
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {child.admission_no && (
                          <span>
                            <strong className="text-foreground">Admission No:</strong>{' '}
                            {child.admission_no}
                          </span>
                        )}
                        {org?.org_name && (
                          <span>
                            <strong className="text-foreground">School:</strong> {org.org_name}
                          </span>
                        )}
                        {child.board_affiliation && (
                          <span>
                            <strong className="text-foreground">Board:</strong>{' '}
                            {child.board_affiliation}
                          </span>
                        )}
                        {child.relationship && (
                          <span className="capitalize">
                            <strong className="text-foreground">Relation:</strong>{' '}
                            {child.relationship}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/app/parent/timetable?childId=${encodeURIComponent(child.student_id)}`,
                        )
                      }
                      className="gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Timetable</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/app/parent/subjects?childId=${encodeURIComponent(child.student_id)}`,
                        )
                      }
                      className="gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Subjects</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/app/parent/documents?studentId=${encodeURIComponent(child.student_id)}${
                            child.application_id
                              ? `&applicationId=${encodeURIComponent(child.application_id)}`
                              : ''
                          }`,
                        )
                      }
                      className="gap-1.5"
                    >
                      <FolderCheck className="w-3.5 h-3.5" />
                      <span>Documents</span>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Current Placement + Class Teacher + Quick Academic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 rounded-2xl border-border bg-card space-y-4">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>Current Academic Placement</span>
                  </div>
                  {enr ? (
                    <dl className="space-y-2.5 text-xs">
                      <div className="flex justify-between gap-2 border-b border-border/50 pb-2">
                        <dt className="text-muted-foreground">Academic Year</dt>
                        <dd className="font-bold text-foreground">{enr.academic_year_name}</dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-border/50 pb-2">
                        <dt className="text-muted-foreground">Grade</dt>
                        <dd className="font-bold text-foreground">
                          {enr.grade_name} ({enr.grade_code})
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-border/50 pb-2">
                        <dt className="text-muted-foreground">Section</dt>
                        <dd className="font-bold text-foreground">
                          {enr.section_name || 'Pending Assignment'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-border/50 pb-2">
                        <dt className="text-muted-foreground">Roll Number</dt>
                        <dd className="font-bold text-foreground">{enr.roll_number || '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Homeroom</dt>
                        <dd className="font-bold text-foreground">{enr.section_room_no || '—'}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No active enrollment record found for this academic year.
                    </p>
                  )}
                </Card>

                <Card className="p-6 rounded-2xl border-border bg-card space-y-4">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Class Teacher</span>
                  </div>
                  {enr?.class_teacher ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                        <div className="text-sm font-bold text-foreground">
                          {enr.class_teacher.name}
                        </div>
                        {enr.class_teacher.designation && (
                          <div className="text-xs text-muted-foreground">
                            {enr.class_teacher.designation}
                          </div>
                        )}
                        {enr.class_teacher.email && (
                          <div className="text-xs text-primary flex items-center gap-1.5 pt-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{enr.class_teacher.email}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Assigned primary mentor for {enr.grade_name}{' '}
                        {enr.section_name ? `Section ${enr.section_name}` : ''}.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Class teacher information is not yet assigned for this section.
                    </p>
                  )}
                </Card>

                <Card className="p-6 rounded-2xl border-border bg-card space-y-4">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Student Details & Shortcuts</span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2 border-b border-border/50 pb-1.5">
                      <dt className="text-muted-foreground">Subjects Offered</dt>
                      <dd className="font-bold text-foreground">{child.subjects_count ?? 0}</dd>
                    </div>
                    {child.gender && (
                      <div className="flex justify-between gap-2 border-b border-border/50 pb-1.5">
                        <dt className="text-muted-foreground">Gender</dt>
                        <dd className="font-bold text-foreground capitalize">{child.gender}</dd>
                      </div>
                    )}
                    {child.dob && (
                      <div className="flex justify-between gap-2 border-b border-border/50 pb-1.5">
                        <dt className="text-muted-foreground">Date of Birth</dt>
                        <dd className="font-bold text-foreground">
                          {new Date(child.dob).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start gap-1.5"
                      onClick={() =>
                        navigate(
                          `/app/parent/learning-resources?childId=${encodeURIComponent(child.student_id)}`,
                        )
                      }
                    >
                      <Library className="w-3.5 h-3.5" />
                      <span>Resources</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start gap-1.5"
                      onClick={() =>
                        navigate(
                          `/app/parent/academic-progress?childId=${encodeURIComponent(child.student_id)}`,
                        )
                      }
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Progress</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start gap-1.5 col-span-2"
                      onClick={() =>
                        navigate(
                          `/app/parent/academic-calendar?childId=${encodeURIComponent(child.student_id)}`,
                        )
                      }
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Academic Calendar & Events</span>
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Subject Teachers List */}
              <div className="space-y-3">
                <SectionHeader
                  title="Subject Faculty"
                  description="Assigned subject teachers for this child's current section."
                />
                {child.subject_teachers && child.subject_teachers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {child.subject_teachers.map((t: any) => (
                      <Card
                        key={t.faculty_assignment_id}
                        className="p-4 rounded-2xl border-border bg-card space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {t.subject_name} ({t.subject_code})
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {t.assignment_role}
                          </Badge>
                        </div>
                        <div className="text-sm font-bold text-foreground">{t.teacher_name}</div>
                        {t.designation_name && (
                          <div className="text-xs text-muted-foreground">{t.designation_name}</div>
                        )}
                        {t.teacher_email && (
                          <div className="text-xs text-primary flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{t.teacher_email}</span>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-6 rounded-2xl border-border bg-card text-xs text-muted-foreground">
                    Subject faculty assignments have not been configured for this section yet.
                  </Card>
                )}
              </div>

              {/* Enrollment History */}
              {child.enrollment_history && child.enrollment_history.length > 0 && (
                <div className="space-y-3">
                  <SectionHeader
                    title="Enrollment History"
                    description="Academic year placements and section transfers recorded for this student."
                  />
                  <Card className="overflow-hidden rounded-2xl border-border bg-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                          <tr>
                            <th className="p-3 font-bold">Academic Year</th>
                            <th className="p-3 font-bold">Grade & Section</th>
                            <th className="p-3 font-bold">Roll No</th>
                            <th className="p-3 font-bold">Enrolled On</th>
                            <th className="p-3 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {child.enrollment_history.map((item: any) => (
                            <tr key={item.enrollment_id}>
                              <td className="p-3 font-semibold text-foreground">
                                {item.academic_year_name}
                              </td>
                              <td className="p-3">
                                {item.grade_name}
                                {item.section_name ? ` • Sec ${item.section_name}` : ''}
                              </td>
                              <td className="p-3">{item.roll_number || '—'}</td>
                              <td className="p-3">
                                {item.enrollment_date
                                  ? new Date(item.enrollment_date).toLocaleDateString()
                                  : '—'}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    item.enrollment_status === 'active' ? 'default' : 'secondary'
                                  }
                                  className="capitalize text-[10px]"
                                >
                                  <Award className="w-3 h-3 mr-1" />
                                  {item.enrollment_status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </PageContainer>
  );
};

export default ParentChildrenPage;
