import React, { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useGetTeacherAiContextQuery,
  useGenerateLessonPlanMutation,
  useGenerateTeachingMaterialMutation,
  useGenerateQuestionsMutation,
  useGenerateAssessmentMutation,
  useGenerateHomeworkMutation,
  useGenerateProjectMutation,
  useAnalyzePerformanceMutation,
  useAnalyzeLearningGapsMutation,
  useGenerateRemedialPlanMutation,
  useDraftFeedbackMutation,
  useDraftParentCommunicationMutation,
  useApproveMaterialMutation,
  useListTeacherMaterialsQuery,
  LessonPlanOutput,
  TeachingMaterialOutput,
  AssessmentOutput,
  ActivityOutput,
  PerformanceAnalysisOutput,
  LearningGapAnalysisOutput,
  DraftFeedbackOutput,
  DraftParentCommunicationOutput,
} from '@/shared/api/aiCopilot.api';
import {
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  FolderGit2,
  TrendingUp,
  MessageSquare,
  Library,
  CheckCircle,
  Copy,
  AlertTriangle,
  Lightbulb,
  Clock,
  Award,
  Send,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type ActiveTab =
  | 'lesson-plan'
  | 'teaching-material'
  | 'assessments'
  | 'activities'
  | 'performance'
  | 'feedback-parent'
  | 'materials-library';

export const TeacherAiCopilotPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('lesson-plan');

  // Teacher Academic Context
  const { data: teacherContext, isLoading: isContextLoading } = useGetTeacherAiContextQuery();
  const assignments = teacherContext?.assigned_subjects || [];
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // Selected assignment fallback
  const currentAssignment =
    assignments.find((a) => a.faculty_assignment_id === selectedAssignmentId) || assignments[0];
  const activeAssignmentId = currentAssignment?.faculty_assignment_id || '';

  // 1. Lesson Plan State
  const [lpTopic, setLpTopic] = useState('');
  const [lpDuration, setLpDuration] = useState('45');
  const [lpApproach, setLpApproach] = useState('inquiry-based');
  const [lpInstructions, setLpInstructions] = useState('');
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState<LessonPlanOutput | null>(null);
  const [generateLessonPlan, { isLoading: isGeneratingLp }] = useGenerateLessonPlanMutation();

  // 2. Teaching Materials State
  const [matType, setMatType] = useState<'worksheet' | 'summary' | 'worked_examples' | 'glossary'>(
    'worksheet',
  );
  const [matTopic, setMatTopic] = useState('');
  const [matDifficulty, setMatDifficulty] = useState('intermediate');
  const [matLength, setMatLength] = useState('standard');
  const [generatedMaterial, setGeneratedMaterial] = useState<{
    generation_request_id: string | null;
    material: TeachingMaterialOutput;
  } | null>(null);
  const [generateMaterial, { isLoading: isGeneratingMat }] = useGenerateTeachingMaterialMutation();
  const [approveMaterial, { isLoading: isApproving }] = useApproveMaterialMutation();
  const [approvalReviewComment, setApprovalReviewComment] = useState('');

  // 3. Questions & Assessment State
  const [assessMode, setAssessMode] = useState<'questions' | 'blueprint'>('blueprint');
  const [assessTopic, setAssessTopic] = useState('');
  const [assessTitle, setAssessTitle] = useState('');
  const [assessQuestionsCount, setAssessQuestionsCount] = useState('5');
  const [assessTotalMarks, setAssessTotalMarks] = useState('25');
  const [assessDuration, setAssessDuration] = useState('45');
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);
  const [generatedAssessment, setGeneratedAssessment] = useState<AssessmentOutput | null>(null);
  const [generateQuestions, { isLoading: isGeneratingQuestions }] = useGenerateQuestionsMutation();
  const [generateAssessment, { isLoading: isGeneratingAssessment }] =
    useGenerateAssessmentMutation();

  // 4. Learning Activities State (Stage 3 Phase 4 Helper)
  const [actType, setActType] = useState<'homework' | 'project'>('homework');
  const [actTopic, setActTopic] = useState('');
  const [actDifficulty, setActDifficulty] = useState('intermediate');
  const [actDays, setActDays] = useState('3');
  const [actNotes, setActNotes] = useState('');
  const [generatedActivity, setGeneratedActivity] = useState<ActivityOutput | null>(null);
  const [generateHomework, { isLoading: isGeneratingHw }] = useGenerateHomeworkMutation();
  const [generateProject, { isLoading: isGeneratingProj }] = useGenerateProjectMutation();

  // 5. Performance & Learning Gaps
  const [gapTopic, setGapTopic] = useState('');
  const [generatedPerformance, setGeneratedPerformance] =
    useState<PerformanceAnalysisOutput | null>(null);
  const [generatedGaps, setGeneratedGaps] = useState<LearningGapAnalysisOutput | null>(null);
  const [analyzePerformance, { isLoading: isAnalyzingPerf }] = useAnalyzePerformanceMutation();
  const [analyzeLearningGaps, { isLoading: isAnalyzingGaps }] = useAnalyzeLearningGapsMutation();

  // 6. Feedback & Parent Communication
  const [feedbackWork, setFeedbackWork] = useState('');
  const [feedbackStrengths, setFeedbackStrengths] = useState('');
  const [feedbackWeaknesses, setFeedbackWeaknesses] = useState('');
  const [feedbackTone, setFeedbackTone] = useState('encouraging');
  const [generatedFeedback, setGeneratedFeedback] = useState<DraftFeedbackOutput | null>(null);
  const [draftFeedback, { isLoading: isDraftingFeedback }] = useDraftFeedbackMutation();

  const [parentCommType, setParentCommType] = useState('progress_update');
  const [parentTopic, setParentTopic] = useState('');
  const [parentNotes, setParentNotes] = useState('');
  const [parentTone, setParentTone] = useState('friendly');
  const [generatedParentComm, setGeneratedParentComm] =
    useState<DraftParentCommunicationOutput | null>(null);
  const [draftParentComm, { isLoading: isDraftingParentComm }] =
    useDraftParentCommunicationMutation();

  // 7. Approved Materials Library
  const {
    data: approvedMaterials,
    refetch: refetchMaterials,
    isLoading: isLoadingMaterials,
  } = useListTeacherMaterialsQuery();

  // Handlers
  const handleGenerateLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentId || !lpTopic.trim()) {
      toast.error('Please select an assigned class and provide a topic.');
      return;
    }
    try {
      const res = await generateLessonPlan({
        faculty_assignment_id: activeAssignmentId,
        topic: lpTopic.trim(),
        duration_minutes: parseInt(lpDuration, 10) || 45,
        pedagogical_approach: lpApproach,
        special_instructions: lpInstructions.trim() || undefined,
      }).unwrap();
      setGeneratedLessonPlan(res.lesson_plan);
      toast.success('Lesson plan generated successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate lesson plan.');
    }
  };

  const handleGenerateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentId || !matTopic.trim()) {
      toast.error('Please select an assigned class and provide a topic.');
      return;
    }
    try {
      const res = await generateMaterial({
        faculty_assignment_id: activeAssignmentId,
        material_type: matType,
        topic: matTopic.trim(),
        difficulty: matDifficulty,
        length: matLength,
      }).unwrap();
      setGeneratedMaterial(res);
      toast.success('Teaching material generated successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate teaching material.');
    }
  };

  const handleApproveMaterial = async () => {
    if (!generatedMaterial?.generation_request_id) {
      toast.error('Cannot approve: No generation request ID found for this material.');
      return;
    }
    try {
      await approveMaterial({
        generation_request_id: generatedMaterial.generation_request_id,
        title: generatedMaterial.material.title,
        material_type: generatedMaterial.material.material_type,
        content: generatedMaterial.material,
        review_comments: approvalReviewComment.trim() || 'Reviewed and approved by teacher',
      }).unwrap();
      toast.success('Material successfully approved and stored in Materials Library!');
      refetchMaterials();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to approve material.');
    }
  };

  const handleGenerateAssessmentOrQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentId || !assessTopic.trim()) {
      toast.error('Please select an assigned class and enter a topic.');
      return;
    }
    try {
      if (assessMode === 'questions') {
        const res = await generateQuestions({
          faculty_assignment_id: activeAssignmentId,
          topic: assessTopic.trim(),
          total_questions: parseInt(assessQuestionsCount, 10) || 5,
        }).unwrap();
        setGeneratedQuestions(res.question_set.questions);
        setGeneratedAssessment(null);
        toast.success('Practice questions generated successfully!');
      } else {
        const res = await generateAssessment({
          faculty_assignment_id: activeAssignmentId,
          title: assessTitle.trim() || `${assessTopic} Assessment`,
          topic: assessTopic.trim(),
          duration_minutes: parseInt(assessDuration, 10) || 45,
          total_marks: parseInt(assessTotalMarks, 10) || 25,
          question_count: parseInt(assessQuestionsCount, 10) || 5,
        }).unwrap();
        setGeneratedAssessment(res.assessment);
        setGeneratedQuestions(null);
        toast.success('Assessment blueprint generated successfully!');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate assessment.');
    }
  };

  const handleGenerateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentId || !actTopic.trim()) {
      toast.error('Please select an assigned class and enter a topic.');
      return;
    }
    try {
      if (actType === 'homework') {
        const res = await generateHomework({
          faculty_assignment_id: activeAssignmentId,
          topic: actTopic.trim(),
          difficulty: actDifficulty,
          suggested_days: parseInt(actDays, 10) || 3,
          additional_notes: actNotes.trim() || undefined,
        }).unwrap();
        setGeneratedActivity(res.activity);
      } else {
        const res = await generateProject({
          faculty_assignment_id: activeAssignmentId,
          topic: actTopic.trim(),
          difficulty: actDifficulty,
          suggested_days: parseInt(actDays, 10) || 7,
          additional_notes: actNotes.trim() || undefined,
        }).unwrap();
        setGeneratedActivity(res.activity);
      }
      toast.success(`${actType === 'homework' ? 'Homework' : 'Project'} drafted successfully!`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to draft activity.');
    }
  };

  const handleAnalyzePerformance = async () => {
    if (!activeAssignmentId) return;
    try {
      const res = await analyzePerformance({ faculty_assignment_id: activeAssignmentId }).unwrap();
      setGeneratedPerformance(res);
      toast.success('Performance analysis generated!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to analyze performance.');
    }
  };

  const handleAnalyzeLearningGaps = async () => {
    if (!activeAssignmentId || !gapTopic.trim()) {
      toast.error('Please enter a topic to identify learning gaps.');
      return;
    }
    try {
      const res = await analyzeLearningGaps({
        faculty_assignment_id: activeAssignmentId,
        topic: gapTopic.trim(),
      }).unwrap();
      setGeneratedGaps(res);
      toast.success('Learning gaps & remedial plan generated!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to detect learning gaps.');
    }
  };

  const handleDraftFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentId) return;
    try {
      const res = await draftFeedback({
        faculty_assignment_id: activeAssignmentId,
        student_work_text: feedbackWork.trim() || undefined,
        observed_strengths: feedbackStrengths.trim() || undefined,
        observed_weaknesses: feedbackWeaknesses.trim() || undefined,
        tone: feedbackTone,
      }).unwrap();
      setGeneratedFeedback(res);
      toast.success('Evaluation feedback drafted!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to draft feedback.');
    }
  };

  const handleDraftParentComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentId) return;
    try {
      const res = await draftParentComm({
        faculty_assignment_id: activeAssignmentId,
        communication_type: parentCommType,
        topic: parentTopic.trim() || undefined,
        specific_observations: parentNotes.trim() || undefined,
        tone: parentTone,
      }).unwrap();
      setGeneratedParentComm(res);
      toast.success('Parent communication drafted!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to draft communication.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <PageContainer>
      <PageHeader
        title="AI Teacher Copilot"
        description="Pedagogical assistant for lesson planning, materials generation, assessment drafting, and learning analytics with teacher oversight."
      />

      {/* Global Context Selector */}
      <Card className="p-4 mb-6 bg-card border-border shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">
                Active Class & Subject Context
              </div>
              <div className="text-xs text-muted-foreground">
                All AI suggestions are contextualized to your assigned curriculum and grade level.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {isContextLoading ? (
              <span className="text-xs text-muted-foreground">Loading teacher assignments...</span>
            ) : assignments.length === 0 ? (
              <Badge variant="outline" className="text-amber-500 border-amber-500">
                No active faculty assignments found
              </Badge>
            ) : (
              <select
                className="w-full md:w-80 px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={activeAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
              >
                {assignments.map((a) => (
                  <option key={a.faculty_assignment_id} value={a.faculty_assignment_id}>
                    {a.subject_name} — {a.grade_name} ({a.section_name})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-border mb-6 gap-2 pb-1 text-sm font-medium">
        <button
          onClick={() => setActiveTab('lesson-plan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'lesson-plan'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Lesson Plans
        </button>
        <button
          onClick={() => setActiveTab('teaching-material')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'teaching-material'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" /> Materials & Worksheets
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'assessments'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Questions & Assessments
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'activities'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderGit2 className="w-4 h-4" /> Homework & Projects
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'performance'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Performance & Gaps
        </button>
        <button
          onClick={() => setActiveTab('feedback-parent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'feedback-parent'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Feedback & Parents
        </button>
        <button
          onClick={() => setActiveTab('materials-library')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'materials-library'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Library className="w-4 h-4" /> Approved Library
        </button>
      </div>

      {/* TAB 1: LESSON PLAN */}
      {activeTab === 'lesson-plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1 border-border">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Lesson Plan Configuration
            </h3>
            <form onSubmit={handleGenerateLessonPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Lesson Topic *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solving Quadratic Equations by Factoring"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={lpTopic}
                  onChange={(e) => setLpTopic(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={lpDuration}
                  onChange={(e) => setLpDuration(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Pedagogical Approach
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={lpApproach}
                  onChange={(e) => setLpApproach(e.target.value)}
                >
                  <option value="inquiry-based">Inquiry-Based Learning</option>
                  <option value="direct-instruction">Direct Instruction & Guided Practice</option>
                  <option value="flipped-classroom">Flipped Classroom</option>
                  <option value="project-based">Project & Collaborative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Special Instructions or Differentiation
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Include group activities and scaffold for visual learners..."
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={lpInstructions}
                  onChange={(e) => setLpInstructions(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isGeneratingLp}
                className="w-full flex items-center justify-center gap-2"
              >
                {isGeneratingLp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating Lesson Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Lesson Plan
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="p-5 lg:col-span-2 border-border min-h-[400px]">
            {generatedLessonPlan ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {generatedLessonPlan.title}
                    </h2>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline">{generatedLessonPlan.subject}</Badge>
                      <Badge variant="outline">{generatedLessonPlan.grade_level}</Badge>
                      <Badge variant="outline">{generatedLessonPlan.duration_minutes} mins</Badge>
                      <Badge variant="secondary">{generatedLessonPlan.pedagogical_approach}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(generatedLessonPlan, null, 2))}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Copy JSON
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Target Learning Outcomes</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {generatedLessonPlan.learning_outcomes.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Structured Lesson Phases</h4>
                  <div className="space-y-3">
                    {generatedLessonPlan.lesson_phases.map((phase, idx) => (
                      <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm text-foreground">
                            {phase.title}
                          </span>
                          <span className="text-xs text-primary font-medium">
                            {phase.duration_minutes} mins
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{phase.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Support for Struggling Learners
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {
                        generatedLessonPlan.differentiated_instruction
                          ?.support_for_struggling_learners
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h5 className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                      Extension for Advanced Learners
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {
                        generatedLessonPlan.differentiated_instruction
                          ?.extension_for_advanced_learners
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Assessment Checkpoints</h4>
                  <div className="space-y-2">
                    {generatedLessonPlan.assessment_checkpoints.map((cp, idx) => (
                      <div key={idx} className="p-2.5 bg-background border rounded-md text-xs">
                        <div className="font-medium text-foreground">
                          {cp.checkpoint}: {cp.question}
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          Expected: {cp.expected_understanding}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Homework Recommendation:
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {generatedLessonPlan.homework_recommendation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mb-3 text-muted-foreground/40" />
                <h4 className="font-semibold text-foreground">No Lesson Plan Generated Yet</h4>
                <p className="text-xs max-w-sm mt-1">
                  Fill in the configuration panel on the left and click "Generate Lesson Plan" to
                  create a structured pedagogical plan.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: TEACHING MATERIALS & WORKSHEETS */}
      {activeTab === 'teaching-material' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1 border-border">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Material Specification
            </h3>
            <form onSubmit={handleGenerateMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Material Type
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as any)}
                >
                  <option value="worksheet">Practice Worksheet with Problems</option>
                  <option value="summary">Concept Summary & Study Notes</option>
                  <option value="worked_examples">Worked Step-by-Step Examples</option>
                  <option value="glossary">Key Definitions & Glossary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Topic *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Properties of Circles: Chords & Tangents"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={matTopic}
                  onChange={(e) => setMatTopic(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Difficulty
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={matDifficulty}
                    onChange={(e) => setMatDifficulty(e.target.value)}
                  >
                    <option value="foundational">Foundational</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Length
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={matLength}
                    onChange={(e) => setMatLength(e.target.value)}
                  >
                    <option value="concise">Concise (1-page)</option>
                    <option value="standard">Standard (2-page)</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGeneratingMat}
                className="w-full flex items-center justify-center gap-2"
              >
                {isGeneratingMat ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Drafting Material...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" /> Generate Material
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="p-5 lg:col-span-2 border-border min-h-[400px]">
            {generatedMaterial ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {generatedMaterial.material.title}
                    </h2>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline">{generatedMaterial.material.material_type}</Badge>
                      <Badge variant="outline">{generatedMaterial.material.subject}</Badge>
                      <Badge variant="outline">{generatedMaterial.material.grade_level}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(generatedMaterial.material, null, 2))
                      }
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg text-sm text-foreground">
                  <span className="font-semibold block mb-1">Summary:</span>
                  {generatedMaterial.material.summary}
                </div>

                {generatedMaterial.material.key_definitions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Key Definitions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {generatedMaterial.material.key_definitions.map((kd, idx) => (
                        <div key={idx} className="p-2.5 bg-background border rounded-md text-xs">
                          <span className="font-semibold text-primary">{kd.term}: </span>
                          <span className="text-muted-foreground">{kd.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedMaterial.material.worked_examples?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Worked Examples</h4>
                    <div className="space-y-3">
                      {generatedMaterial.material.worked_examples.map((we, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-background border rounded-lg text-xs space-y-1"
                        >
                          <div className="font-semibold text-foreground">Problem: {we.problem}</div>
                          <div className="text-primary font-mono">Solution: {we.solution}</div>
                          <div className="text-muted-foreground">Explanation: {we.explanation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedMaterial.material.student_worksheet && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Student Practice Worksheet</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {generatedMaterial.material.student_worksheet.instructions}
                    </p>
                    <div className="space-y-2">
                      {generatedMaterial.material.student_worksheet.practice_problems?.map(
                        (p, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-muted/40 border rounded-md text-xs flex justify-between items-start"
                          >
                            <div>
                              <span className="font-medium text-foreground">
                                Q{idx + 1}. {p.question}
                              </span>
                              {p.hints && (
                                <div className="text-muted-foreground text-[11px] mt-0.5">
                                  Hint: {p.hints}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary">{p.points} pts</Badge>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Teacher Approval Section */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Teacher Review & Approval
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        AI drafts require teacher verification before saving to the permanent school
                        materials library.
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Optional review notes or adjustments made..."
                    className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-md"
                    value={approvalReviewComment}
                    onChange={(e) => setApprovalReviewComment(e.target.value)}
                  />
                  <Button
                    onClick={handleApproveMaterial}
                    disabled={isApproving}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isApproving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Approving & Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Approve & Save to Materials Library
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 text-muted-foreground/40" />
                <h4 className="font-semibold text-foreground">No Material Generated</h4>
                <p className="text-xs max-w-sm mt-1">
                  Choose a material type and topic to generate worksheets, worked examples, and
                  summaries.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: QUESTIONS & ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1 border-border">
            <div className="flex gap-2 mb-4">
              <Button
                variant={assessMode === 'blueprint' ? 'default' : 'outline'}
                size="sm"
                className="w-1/2 text-xs"
                onClick={() => setAssessMode('blueprint')}
              >
                Full Assessment
              </Button>
              <Button
                variant={assessMode === 'questions' ? 'default' : 'outline'}
                size="sm"
                className="w-1/2 text-xs"
                onClick={() => setAssessMode('questions')}
              >
                Question Bank
              </Button>
            </div>

            <form onSubmit={handleGenerateAssessmentOrQuestions} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Assessment Topic *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Algebra and Quadratic Equations"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={assessTopic}
                  onChange={(e) => setAssessTopic(e.target.value)}
                  required
                />
              </div>

              {assessMode === 'blueprint' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Assessment Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Term 1 Mathematics Assessment"
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={assessTitle}
                    onChange={(e) => setAssessTitle(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Question Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={assessQuestionsCount}
                    onChange={(e) => setAssessQuestionsCount(e.target.value)}
                  />
                </div>
                {assessMode === 'blueprint' && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                      value={assessTotalMarks}
                      onChange={(e) => setAssessTotalMarks(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {assessMode === 'blueprint' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={assessDuration}
                    onChange={(e) => setAssessDuration(e.target.value)}
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isGeneratingQuestions || isGeneratingAssessment}
                className="w-full flex items-center justify-center gap-2"
              >
                {isGeneratingQuestions || isGeneratingAssessment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4" /> Generate{' '}
                    {assessMode === 'blueprint' ? 'Assessment' : 'Questions'}
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="p-5 lg:col-span-2 border-border min-h-[400px]">
            {generatedAssessment ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {generatedAssessment.title}
                    </h2>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline">{generatedAssessment.subject}</Badge>
                      <Badge variant="outline">{generatedAssessment.total_marks} Marks</Badge>
                      <Badge variant="outline">{generatedAssessment.duration_minutes} Mins</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(generatedAssessment, null, 2))}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Copy Blueprint
                  </Button>
                </div>

                <div className="space-y-4">
                  {generatedAssessment.questions?.map((q, idx) => (
                    <div key={idx} className="p-4 bg-muted/30 border rounded-lg text-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-foreground">
                          Q{q.question_number || idx + 1}. {q.question_text}
                        </span>
                        <div className="flex gap-1.5">
                          <Badge variant="secondary">{q.question_type}</Badge>
                          <Badge variant="outline">{q.marks} m</Badge>
                        </div>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="p-2 bg-background border rounded text-xs">
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-primary font-medium mt-1">
                        Answer: {q.correct_answer}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Explanation: {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : generatedQuestions ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Generated Question Set</h3>
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-muted/30 border rounded-lg text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        Q{idx + 1}. {q.question_text}
                      </span>
                      <Badge variant="secondary">{q.difficulty}</Badge>
                    </div>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((o: string, oi: number) => (
                          <div key={oi} className="p-1.5 bg-background border rounded text-xs">
                            {o}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-primary font-medium">
                      Answer: {q.correct_answer}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mb-3 text-muted-foreground/40" />
                <h4 className="font-semibold text-foreground">No Assessment Drafted</h4>
                <p className="text-xs max-w-sm mt-1">
                  Configure question count, duration, and topic to generate a comprehensive
                  assessment with rubrics.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: HOMEWORK & PROJECTS (STAGE 3 PHASE 4 INTEGRATION) */}
      {activeTab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1 border-border">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-primary" /> Activity Helper
            </h3>
            <form onSubmit={handleGenerateActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Activity Type
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={actType === 'homework' ? 'default' : 'outline'}
                    size="sm"
                    className="w-1/2 text-xs"
                    onClick={() => setActType('homework')}
                  >
                    Homework
                  </Button>
                  <Button
                    type="button"
                    variant={actType === 'project' ? 'default' : 'outline'}
                    size="sm"
                    className="w-1/2 text-xs"
                    onClick={() => setActType('project')}
                  >
                    Project
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Topic *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Statistical Analysis of Ecosystems"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={actTopic}
                  onChange={(e) => setActTopic(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Difficulty
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={actDifficulty}
                    onChange={(e) => setActDifficulty(e.target.value)}
                  >
                    <option value="introductory">Introductory</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={actDays}
                    onChange={(e) => setActDays(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific learning goals or constraints..."
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  value={actNotes}
                  onChange={(e) => setActNotes(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isGeneratingHw || isGeneratingProj}
                className="w-full flex items-center justify-center gap-2"
              >
                {isGeneratingHw || isGeneratingProj ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Drafting Activity...
                  </>
                ) : (
                  <>
                    <FolderGit2 className="w-4 h-4" /> Draft{' '}
                    {actType === 'homework' ? 'Homework' : 'Project'}
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="p-5 lg:col-span-2 border-border min-h-[400px]">
            {generatedActivity ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{generatedActivity.title}</h2>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {generatedActivity.activity_type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{generatedActivity.target_grade}</Badge>
                      <Badge variant="outline">
                        {generatedActivity.recommended_duration_days} Days
                      </Badge>
                      <Badge variant="secondary">
                        {generatedActivity.suggested_maximum_marks} Marks
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(generatedActivity, null, 2))}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Copy Draft
                  </Button>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    Overview
                  </h4>
                  <p className="text-sm text-foreground mt-1">{generatedActivity.overview}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    Detailed Instructions
                  </h4>
                  <p className="text-sm text-foreground mt-1 whitespace-pre-line">
                    {generatedActivity.detailed_instructions}
                  </p>
                </div>

                {generatedActivity.deliverables?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Deliverables
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-foreground">
                      {generatedActivity.deliverables.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 bg-muted/40 rounded-lg border">
                  <h4 className="text-xs font-semibold text-primary mb-1">
                    Evaluation Rubric Summary
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {generatedActivity.evaluation_rubric_summary}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <FolderGit2 className="w-12 h-12 mb-3 text-muted-foreground/40" />
                <h4 className="font-semibold text-foreground">No Activity Drafted</h4>
                <p className="text-xs max-w-sm mt-1">
                  Draft engaging homework and project guidelines directly aligned with Stage 3 Phase
                  4 Learning Activities.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 5: PERFORMANCE & LEARNING GAPS */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-border flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">Section Performance Insights</h4>
                <p className="text-xs text-muted-foreground">
                  Synthesize attendance, activity submissions, and assessment data.
                </p>
              </div>
              <Button onClick={handleAnalyzePerformance} disabled={isAnalyzingPerf} size="sm">
                {isAnalyzingPerf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Analyze Section'
                )}
              </Button>
            </Card>

            <Card className="p-4 border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Concept or topic for gap detection..."
                  className="flex-1 px-3 py-1.5 text-xs bg-background border rounded-md"
                  value={gapTopic}
                  onChange={(e) => setGapTopic(e.target.value)}
                />
                <Button onClick={handleAnalyzeLearningGaps} disabled={isAnalyzingGaps} size="sm">
                  {isAnalyzingGaps ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Detect Gaps'}
                </Button>
              </div>
            </Card>
          </div>

          {generatedPerformance && (
            <Card className="p-5 border-border space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Performance Summary:{' '}
                {generatedPerformance.analysis_scope}
              </h3>
              <p className="text-sm text-muted-foreground">{generatedPerformance.data_summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <h5 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">
                    Strengths
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                    {generatedPerformance.overall_strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
                    Areas for Improvement
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                    {generatedPerformance.areas_for_improvement.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {generatedGaps && (
            <Card className="p-5 border-border space-y-5">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Identified Knowledge Gaps:{' '}
                {generatedGaps.topic}
              </h3>
              <div className="space-y-3">
                {generatedGaps.identified_gaps.map((gap, i) => (
                  <div key={i} className="p-4 bg-muted/40 border rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-foreground">{gap.concept}</span>
                      <Badge variant={gap.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {gap.severity} severity
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Hypothesis: {gap.potential_reason_hypothesis}
                    </p>
                    <p className="text-primary font-medium">
                      Revision Strategy: {gap.suggested_revision_strategy}
                    </p>
                  </div>
                ))}
              </div>

              {generatedGaps.remedial_teaching_plan && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Remedial Teaching Plan: {generatedGaps.remedial_teaching_plan.objective}
                  </h4>
                  <div className="space-y-2">
                    {generatedGaps.remedial_teaching_plan.step_by_step_plan.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between p-2 bg-background border rounded text-xs"
                      >
                        <span>
                          Step {step.step}: {step.activity}
                        </span>
                        <span className="text-primary font-medium">
                          {step.duration_minutes} mins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* TAB 6: FEEDBACK & PARENT COMMUNICATIONS */}
      {activeTab === 'feedback-parent' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feedback Assistant */}
          <Card className="p-5 border-border space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Evaluation Feedback Assistant
            </h3>
            <p className="text-xs text-muted-foreground">
              Draft formative, constructive feedback for student submissions. (Teacher maintains
              final grading authority).
            </p>
            <form onSubmit={handleDraftFeedback} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Student Work Excerpt
                </label>
                <textarea
                  rows={2}
                  placeholder="Paste student solution or steps..."
                  className="w-full px-3 py-1.5 text-xs bg-background border rounded-md"
                  value={feedbackWork}
                  onChange={(e) => setFeedbackWork(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Observed Strengths
                </label>
                <input
                  type="text"
                  placeholder="Clean layout, correct initial factoring..."
                  className="w-full px-3 py-1.5 text-xs bg-background border rounded-md"
                  value={feedbackStrengths}
                  onChange={(e) => setFeedbackStrengths(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Observed Weaknesses
                </label>
                <input
                  type="text"
                  placeholder="Dropped negative sign in step 3..."
                  className="w-full px-3 py-1.5 text-xs bg-background border rounded-md"
                  value={feedbackWeaknesses}
                  onChange={(e) => setFeedbackWeaknesses(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isDraftingFeedback} className="w-full text-xs">
                {isDraftingFeedback ? 'Drafting...' : 'Draft Feedback'}
              </Button>
            </form>

            {generatedFeedback && (
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-2 border">
                <div className="font-semibold text-primary">Draft Feedback Message:</div>
                <p className="text-foreground italic">
                  "{generatedFeedback.draft_feedback_message}"
                </p>
                <div className="text-muted-foreground text-[11px]">
                  Suggested Next Steps: {generatedFeedback.recommended_next_steps}
                </div>
              </div>
            )}
          </Card>

          {/* Parent Communication Assistant */}
          <Card className="p-5 border-border space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Parent Communication Assistant
            </h3>
            <p className="text-xs text-muted-foreground">
              Draft clear, empathetic updates for parents with tone control.
            </p>
            <form onSubmit={handleDraftParentComm} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Category
                </label>
                <select
                  className="w-full px-3 py-1.5 text-xs bg-background border rounded-md"
                  value={parentCommType}
                  onChange={(e) => setParentCommType(e.target.value)}
                >
                  <option value="progress_update">Academic Progress Update</option>
                  <option value="intervention_notice">Targeted Intervention Notice</option>
                  <option value="appreciation">Praise & Positive Recognition</option>
                  <option value="homework_reminder">Missing Work / Reminder</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Topic / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics Midterm Progress"
                  className="w-full px-3 py-1.5 text-xs bg-background border rounded-md"
                  value={parentTopic}
                  onChange={(e) => setParentTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Teacher Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="Observations and recommended parent actions..."
                  className="w-full px-3 py-1.5 text-xs bg-background border rounded-md"
                  value={parentNotes}
                  onChange={(e) => setParentNotes(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isDraftingParentComm} className="w-full text-xs">
                {isDraftingParentComm ? 'Drafting...' : 'Draft Parent Communication'}
              </Button>
            </form>

            {generatedParentComm && (
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-2 border">
                <div className="font-semibold text-foreground">
                  Subject: {generatedParentComm.subject_line}
                </div>
                <p className="text-muted-foreground whitespace-pre-line">
                  {generatedParentComm.greeting}
                  {'\n\n'}
                  {generatedParentComm.body}
                  {'\n\n'}
                  {generatedParentComm.closing}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 7: APPROVED MATERIALS LIBRARY */}
      {activeTab === 'materials-library' && (
        <Card className="p-5 border-border">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-base">Approved School Materials Library</h3>
              <p className="text-xs text-muted-foreground">
                Verified curriculum materials preserved in PostgreSQL with audit history and version
                control.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchMaterials()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>

          {isLoadingMaterials ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Loading materials...
            </div>
          ) : !approvedMaterials || approvedMaterials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Library className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <h4 className="font-semibold text-foreground">No Approved Materials Yet</h4>
              <p className="text-xs mt-1">
                Generate worksheets or study materials in the "Materials & Worksheets" tab and click
                "Approve" to store them here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {approvedMaterials.map((mat) => (
                <div key={mat.material_id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{mat.title}</div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                      <Badge variant="outline">{mat.material_type}</Badge>
                      <Badge variant="secondary">v{mat.current_version_number}.0</Badge>
                      <span>Role: {mat.target_role}</span>
                      <span>Added: {new Date(mat.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info(`Viewing material ${mat.material_id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </PageContainer>
  );
};

export default TeacherAiCopilotPage;
