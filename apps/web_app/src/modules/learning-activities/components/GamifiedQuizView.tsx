import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuizConfig } from '@/shared/api/learningActivities.api';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  HelpCircle,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

interface GamifiedQuizViewProps {
  activityTitle: string;
  config?: QuizConfig | null;
  isSubmitting?: boolean;
  onSubmitQuiz: (answersSummary: string) => Promise<void>;
  canSubmit?: boolean;
  blockReason?: string | null;
  previousSubmissionText?: string | null;
}

export const GamifiedQuizView: React.FC<GamifiedQuizViewProps> = ({
  activityTitle,
  config,
  isSubmitting = false,
  onSubmitQuiz,
  canSubmit = true,
  blockReason,
  previousSubmissionText,
}) => {
  const questions = config?.questions || [];
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(0);
  const [submittedLocal, setSubmittedLocal] = useState(false);

  if (totalQuestions === 0) {
    return (
      <Card className="p-8 text-center text-xs text-muted-foreground">
        <HelpCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
        No interactive quiz questions configured for this activity.
      </Card>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setSelectedAnswers((prev) => {
      const next = { ...prev, [questionId]: optionKey };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirm = window.confirm(
        `You have answered ${answeredCount} of ${totalQuestions} questions. Do you want to submit anyway?`,
      );
      if (!confirm) return;
    }

    // Compile answer summary
    const summaryLines = [
      `=== QUIZ SUBMISSION: ${activityTitle} ===`,
      `Completed Questions: ${answeredCount}/${totalQuestions}`,
      `Submitted At: ${new Date().toISOString()}`,
      '',
      ...questions.map((q, idx) => {
        const choice = selectedAnswers[q.question_id] || '(No Answer)';
        return `Q${idx + 1}. [${q.question_text}] -> Selected: ${choice}`;
      }),
    ];

    try {
      await onSubmitQuiz(summaryLines.join('\n'));
      setSubmittedLocal(true);
      toast.success('Gamified Quiz submitted successfully!');
    } catch {
      // handled in parent
    }
  };

  return (
    <div className="space-y-4">
      {/* Gamified Header: Progress & Streak */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-emerald-950">
                Interactive Knowledge Challenge
              </h3>
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-100/70 text-emerald-900 text-xs font-semibold"
              >
                Question {currentIndex + 1} of {totalQuestions}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {answeredCount} of {totalQuestions} answered ({progressPercent}%)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {answeredCount >= 3 && (
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-900 text-xs animate-bounce">
                <Flame className="h-4 w-4 text-amber-600" />
                <span>Quiz Streak active!</span>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900 text-xs">
              <Award className="h-3.5 w-3.5 text-emerald-700" />
              <span>{answeredCount * 10} XP</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Question Card */}
      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between gap-2 border-b pb-3">
          <span className="font-semibold text-sm text-foreground">
            {currentIndex + 1}. {currentQ.question_text}
          </span>
          {currentQ.marks !== undefined && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {currentQ.marks} marks
            </Badge>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt) => {
            const isSelected = selectedAnswers[currentQ.question_id] === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelectOption(currentQ.question_id, opt.key)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-xs transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/80 font-medium text-emerald-950 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-foreground'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'border bg-background text-muted-foreground'
                  }`}
                >
                  {opt.key}
                </span>
                <span className="flex-1">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Question Navigation */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="gap-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>

          <div className="flex gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.question_id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`h-7 w-7 rounded-lg text-xs font-semibold ${
                  currentIndex === i
                    ? 'bg-emerald-600 text-white'
                    : selectedAnswers[q.question_id]
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentIndex < totalQuestions - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="gap-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isSubmitting || !canSubmit}
              onClick={handleSubmit}
              className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Submitting Quiz...' : 'Submit Answers'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
