export interface Parent {
  id: string;
  name: string;
  childrenIds: string[];
}

export * from './hooks/useMyChildrenFees';
export * from './hooks/useStudentAcademics';
export * from './hooks/useChildFinance';
