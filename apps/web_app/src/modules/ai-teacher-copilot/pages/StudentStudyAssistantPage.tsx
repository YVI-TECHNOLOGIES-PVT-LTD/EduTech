import React, { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useRespondStudentStudyAssistantMutation,
  StudentStudyAssistantOutput,
} from '@/shared/api/aiCopilot.api';
import {
  Sparkles,
  HelpCircle,
  BookOpen,
  Send,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

export const StudentStudyAssistantPage: React.FC = () => {
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [style, setStyle] = useState('step_by_step');
  const [studyResponse, setStudyResponse] = useState<StudentStudyAssistantOutput | null>(null);

  const [askAssistant, { isLoading }] = useRespondStudentStudyAssistantMutation();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !question.trim()) {
      toast.error('Please specify both the topic and your question.');
      return;
    }

    try {
      const res = await askAssistant({
        subject_name: subject,
        topic: topic.trim(),
        student_question: question.trim(),
        preferred_style: style,
      }).unwrap();

      setStudyResponse(res);
      toast.success('Study assistant responded!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to get study response.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="AI Study Assistant"
        description="Your interactive study coach for step-by-step concept explanations, guided practice, and exam preparation."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Query Card */}
        <Card className="p-5 border-border lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Ask Study Coach</h3>
              <p className="text-xs text-muted-foreground">Get conceptual breakdowns & practice</p>
            </div>
          </div>

          <form onSubmit={handleAsk} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Subject
              </label>
              <select
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science / Physics / Chemistry</option>
                <option value="English">English & Literature</option>
                <option value="Social Studies">Social Studies & History</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Topic *
              </label>
              <input
                type="text"
                placeholder="e.g. Pythagorean Theorem, Photosynthesis..."
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                What concept or question do you need help with? *
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Can you explain why a^2 + b^2 = c^2 and show a geometric proof?"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Explanation Style
              </label>
              <select
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="step_by_step">Step-by-Step Breakdown</option>
                <option value="intuitive_analogy">Intuitive Real-World Analogy</option>
                <option value="socratic_hints">Guided Hints & Questions</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Ask Assistant
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-muted/40 border rounded-lg text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Academic Integrity Notice:
            </div>
            <p>
              The study assistant explains fundamental ideas, derivation steps, and hints. It does
              not provide direct answers to active exams or graded homework.
            </p>
          </div>
        </Card>

        {/* Right Output Card */}
        <Card className="p-5 border-border lg:col-span-2 min-h-[450px]">
          {studyResponse ? (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <Badge variant="secondary" className="mb-2">
                  {studyResponse.topic}
                </Badge>
                <h3 className="text-lg font-bold text-foreground">Conceptual Explanation</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {studyResponse.conceptual_explanation}
                </p>
              </div>

              {studyResponse.step_by_step_breakdown?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <CheckCircle2 className="w-4 h-4" /> Step-by-Step Concept Breakdown
                  </h4>
                  <div className="space-y-2">
                    {studyResponse.step_by_step_breakdown.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted/30 border rounded-md text-xs text-foreground flex gap-3"
                      >
                        <span className="font-bold text-primary">{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {studyResponse.practice_questions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <HelpCircle className="w-4 h-4" /> Practice Questions for Mastery
                  </h4>
                  <div className="space-y-3">
                    {studyResponse.practice_questions.map((pq, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-background border rounded-lg text-xs space-y-1"
                      >
                        <div className="font-semibold text-foreground">
                          Q{idx + 1}. {pq.question}
                        </div>
                        {pq.hint && (
                          <div className="text-muted-foreground italic">Hint: {pq.hint}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {studyResponse.summary_takeaway && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-foreground">
                  <span className="font-semibold text-primary block mb-0.5">Key Takeaway:</span>
                  {studyResponse.summary_takeaway}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mb-3 text-muted-foreground/40" />
              <h4 className="font-semibold text-foreground">Study Coach Ready</h4>
              <p className="text-xs max-w-sm mt-1">
                Enter your subject, topic, and question on the left to receive tailored pedagogical
                explanations and practice problems.
              </p>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

export default StudentStudyAssistantPage;
