import React from 'react';
import { ExamWorkspace } from '../exams/ExamWorkspace';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';

export function EntranceExamPage() {
  return (
    <PageContainer variant="full">
      <PageHeader
        title="Entrance Examination & Evaluation Desk"
        description="Manage candidate exam schedules, score logging, test portals, and merit evaluations."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-indigo-600 border-indigo-200"
          >
            Exam Cell Desk
          </Badge>
        }
      />
      <ExamWorkspace />
    </PageContainer>
  );
}

export default EntranceExamPage;
